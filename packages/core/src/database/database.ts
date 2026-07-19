export * as Database from "./database"

import { EffectDrizzleSqlite } from "@opencode-ai/effect-drizzle-sqlite"
import { layer as sqliteLayer } from "#sqlite"
import { Context, Effect, Layer } from "effect"
import { Global } from "../global"
import { Flag } from "../flag/flag"
import { isAbsolute, join } from "path"
import { DatabaseMigration } from "./migration"
import { InstallationChannel } from "../installation/version"
import { makeGlobalNode } from "../effect/app-node"
import { existsSync, mkdirSync, copyFileSync } from "fs"
import { xdgData } from "xdg-basedir"

const makeDatabase = EffectDrizzleSqlite.makeWithDefaults()
type DatabaseShape = Effect.Success<typeof makeDatabase>

export interface Interface {
  db: DatabaseShape
}

export class Service extends Context.Service<Service, Interface>()("@opencode/v2/storage/Database") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const db = yield* makeDatabase

    yield* db.run("PRAGMA journal_mode = WAL")
    yield* db.run("PRAGMA synchronous = NORMAL")
    yield* db.run("PRAGMA busy_timeout = 5000")
    yield* db.run("PRAGMA cache_size = -64000")
    yield* db.run("PRAGMA foreign_keys = ON")
    yield* db.run("PRAGMA wal_checkpoint(PASSIVE)")
    yield* DatabaseMigration.apply(db)

    return { db }
  }).pipe(Effect.orDie),
)

export function layerFromPath(filename: string) {
  return layer.pipe(Layer.provide(sqliteLayer({ filename })))
}

export function path() {
  if (Flag.OPENCODE_DB) {
    if (Flag.OPENCODE_DB === ":memory:" || isAbsolute(Flag.OPENCODE_DB)) return Flag.OPENCODE_DB
    return join(Global.Path.data, Flag.OPENCODE_DB)
  }
  const isProd =
    ["latest", "beta", "prod"].includes(InstallationChannel) ||
    process.env.OPENCODE_DISABLE_CHANNEL_DB === "1" ||
    process.env.OPENCODE_DISABLE_CHANNEL_DB === "true"
  const resolved = isProd
    ? join(Global.Path.data, "am.db")
    : join(Global.Path.data, `am-${InstallationChannel.replace(/[^a-zA-Z0-9._-]/g, "-")}.db`)
  return resolved
}

// Migrate existing channel-specific databases from the old "opencode" data directory
// (used before the "opencode" → "am" rename) to the new "am" data directory.
// Only copies files; never writes to or deletes the originals.
// Never migrates the production "opencode.db" — that file belongs to real OpenCode.
// Runs synchronously at module level to ensure it completes before the DB is opened.
function migrateOldChannelDbs(): void {
  try {
    if (!xdgData) return
    const oldDir = join(xdgData, "opencode")
    const newDir = Global.Path.data
    if (oldDir === newDir) return
    const isProdChannel = ["latest", "beta", "prod"].includes(InstallationChannel)
      || process.env.OPENCODE_DISABLE_CHANNEL_DB === "1"
      || process.env.OPENCODE_DISABLE_CHANNEL_DB === "true"
    // Only migrate channel-specific dev databases (opencode-local.db, opencode-dev.db, etc.)
    // NEVER migrate opencode.db — that belongs to real OpenCode.
    const oldBase = isProdChannel ? null : `opencode-${InstallationChannel}.db`
    const newBase = isProdChannel ? null : `am-${InstallationChannel}.db`
    if (!oldBase || !newBase) return
    const oldPath = join(oldDir, oldBase)
    const newPath = join(newDir, newBase)
    if (existsSync(oldPath) && !existsSync(newPath)) {
      mkdirSync(newDir, { recursive: true })
      copyFileSync(oldPath, newPath)
      for (const ext of ["-wal", "-shm"]) {
        const oldExt = oldPath + ext
        if (existsSync(oldExt)) {
          copyFileSync(oldExt, newPath + ext)
        }
      }
      console.error(`[am] migrated channel database from ${oldDir}/${oldBase} to ${newDir}/${newBase}`)
    }
  } catch {
    // Non-critical: old data stays in place; AM starts with a fresh db
  }
}
migrateOldChannelDbs()

export const node = makeGlobalNode({ service: Service, layer: layerFromPath(path()), deps: [] })
