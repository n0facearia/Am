/**
 * Read-only import of OpenCode sessions from ~/.local/share/opencode/opencode.db.
 * Never writes to the OpenCode database — uses SQLite in read-only mode.
 */

import { existsSync } from "fs"
import { join } from "path"
import { xdgData } from "xdg-basedir"

/**
 * Lightweight session view for display in the session list.
 * Does not include fields that would imply write-back capability.
 */
export interface OpenCodeSession {
  readonly id: string
  readonly title: string
  readonly timeCreated: number
  readonly timeUpdated: number
  readonly directory: string
  readonly agent: string | null
  readonly model: { id: string; providerID: string } | null
}

export interface OpenCodeImportResult {
  readonly sessions: OpenCodeSession[]
  readonly available: boolean
  readonly dbPath: string | undefined
}

function opencodeDbPath(): string | undefined {
  if (!xdgData) return undefined
  return join(xdgData, "opencode", "opencode.db")
}

/**
 * Try to read sessions using Bun's built-in SQLite (bun:sqlite).
 * This is the primary path when running under the Bun runtime.
 */
async function readSessionsBun(dbPath: string): Promise<OpenCodeSession[] | null> {
  try {
    const { Database } = await import("bun:sqlite")
    const db = new Database(dbPath, { readonly: true })
    try {
      const rows = db
        .query(
          `SELECT id, title, time_created, time_updated, directory, agent, model
           FROM session WHERE parent_id IS NULL
           ORDER BY time_updated DESC LIMIT 100`,
        )
        .all() as Array<Record<string, unknown>>
      return rows.map((r) => ({
        id: String(r.id),
        title: String(r.title ?? "Untitled"),
        timeCreated: Number(r.time_created),
        timeUpdated: Number(r.time_updated),
        directory: String(r.directory ?? ""),
        agent: r.agent ? String(r.agent) : null,
        model: r.model ? (typeof r.model === "string" ? JSON.parse(r.model) : r.model) : null,
      }))
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

/**
 * Fallback: try Node.js 22+'s built-in SQLite (node:sqlite).
 * 
 * NOTE: This path is largely untested — there is no Node 22+ runtime available
 * in the current dev environment. If both Bun and Node SQLite paths fail, the
 * function returns empty (not crash), and a warning is printed to stderr.
 * Do not rely on this path for production-worthy OpenCode import until it has
 * been verified against a Node 22+ runtime.
 */
async function readSessionsNode(dbPath: string): Promise<OpenCodeSession[] | null> {
  try {
    const { DatabaseSync } = await import("node:sqlite")
    const db = new DatabaseSync(dbPath, { readOnly: true, open: true })
    try {
      const stmt = db.prepare(
        `SELECT id, title, time_created, time_updated, directory, agent, model
         FROM session WHERE parent_id IS NULL
         ORDER BY time_updated DESC LIMIT 100`,
      )
      const rows = stmt.all() as Array<Record<string, unknown>>
      return rows.map((r) => ({
        id: String(r.id),
        title: String(r.title ?? "Untitled"),
        timeCreated: Number(r.time_created),
        timeUpdated: Number(r.time_updated),
        directory: String(r.directory ?? ""),
        agent: r.agent ? String(r.agent) : null,
        model: r.model ? (typeof r.model === "string" ? JSON.parse(r.model) : r.model) : null,
      }))
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

/**
 * Attempt Bun SQLite first, then Node SQLite as fallback.
 * If both fail, print a warning so the silent-empty case is observable.
 */
async function readRawSessions(dbPath: string): Promise<OpenCodeSession[]> {
  const fromBun = await readSessionsBun(dbPath)
  if (fromBun) return fromBun
  const fromNode = await readSessionsNode(dbPath)
  if (fromNode) {
    console.warn("[opencode-import] loaded OpenCode sessions via node:sqlite fallback (Bun path unavailable)")
    return fromNode
  }
  console.warn(
    "[opencode-import] failed to read OpenCode sessions: neither bun:sqlite nor node:sqlite " +
    "was available. This is expected in worker threads or restricted runtimes. " +
    "OpenCode import will be unavailable.",
  )
  return []
}

/**
 * Load up to 100 most recent root-level sessions from the real OpenCode database.
 * Returns empty result (available=false) if the database doesn't exist or can't be read.
 */
export async function loadOpenCodeSessions(): Promise<OpenCodeImportResult> {
  const dbPath = opencodeDbPath()
  if (!dbPath || !existsSync(dbPath)) {
    return { sessions: [], available: false, dbPath }
  }
  const sessions = await readRawSessions(dbPath)
  return { sessions, available: sessions.length > 0, dbPath }
}
