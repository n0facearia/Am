import path from "path"
import { Effect, Schema } from "effect"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { Question } from "../question"
import type { SessionID, MessageID } from "../session/schema"

// ── Gate result ────────────────────────────────────────────────────────────

const Passed = "passed"
const Overridden = "overridden"
const Blocked = "blocked"

export type GateResult =
  | { readonly status: "passed" }
  | { readonly status: "blocked"; readonly uncheckedItems: readonly string[] }
  | { readonly status: "overridden" }

// ── Checklist scanning ─────────────────────────────────────────────────────

export const scanChecklist = Effect.fn("BuildGate.scanChecklist")(function* (
  worktree: string,
) {
  const fsys = yield* FSUtil.Service
  const checklistPath = path.join(worktree, "PLAN_CHECKLIST.md")
  const hasChecklist = yield* fsys.existsSafe(checklistPath)

  if (!hasChecklist) return { unchecked: [] as string[], checked: [] as string[] }

  const content = yield* fsys.readFileStringSafe(checklistPath)
  if (!content) return { unchecked: [] as string[], checked: [] as string[] }

  const unchecked: string[] = []
  const checked: string[] = []

  for (const line of content.split(/\r?\n/)) {
    if (line.includes("- [ ]")) {
      const cleaned = line.replace(/^\s*(?:\d+\.\s*)?-\s*\[\s*\]\s*/, "")
      unchecked.push(cleaned || line.trim())
    } else if (line.includes("- [x]") || line.includes("- [X]")) {
      const cleaned = line.replace(/^\s*(?:\d+\.\s*)?-\s*\[[xX]\]\s*/, "")
      if (cleaned) checked.push(cleaned)
    }
  }

  return { unchecked, checked }
})

// ── Enforcement gate ───────────────────────────────────────────────────────
//
// Called before a build-mode code tool executes. Scans PLAN_CHECKLIST.md and:
//  - passes if no checklist or all items checked
//  - asks the user for a manual override if unchecked items exist
//  - returns "blocked" if the user declines (the caller must abort the tool)

export const enforce = Effect.fn("BuildGate.enforce")(function* (
  worktree: string,
  sessionID: SessionID,
  toolRef: { readonly messageID: MessageID; readonly callID: string } | undefined,
) {
  const { unchecked, checked } = yield* scanChecklist(worktree)
  if (unchecked.length === 0) return { status: Passed } as GateResult

  const question = yield* Question.Service
  const warningList = unchecked.map((item) => `  • ${item}`).join("\n")

  const answers = yield* question.ask({
    sessionID,
    tool: toolRef,
    questions: [
      {
        header: "Build Gate",
        question: [
          `Build Gate: ${unchecked.length} item(s) in PLAN_CHECKLIST.md still unchecked.`,
          "",
          warningList,
          "",
          checked.length > 0 ? `${checked.length} item(s) completed. ` : "",
          "Override the gate and proceed with build anyway?",
        ].join("\n"),
        options: [
          { label: "Override", description: "Proceed with build despite unchecked checklist items" },
          { label: "Cancel", description: "Cancel this tool call and stay in build mode" },
        ],
        custom: false,
      },
    ],
  })

  const choice = answers[0]?.[0]
  if (choice === "Override") return { status: Overridden } as GateResult
  return { status: Blocked, uncheckedItems: unchecked } as GateResult
})

export * as BuildGate from "./build-gate"
