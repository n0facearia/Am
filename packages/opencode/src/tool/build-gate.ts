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
  const fsys = yield* FSUtil.Service
  const checklistPath = path.join(worktree, "PLAN_CHECKLIST.md")
  const hasChecklist = yield* fsys.existsSafe(checklistPath)
  const { unchecked, checked } = yield* scanChecklist(worktree)

  const question = yield* Question.Service

  let questionText: string
  let headerText: string
  let yesLabel: string
  let yesDesc: string
  let noLabel: string
  let noDesc: string

  if (unchecked.length > 0) {
    questionText = `Warning: The following checklist items are still unchecked:\n` +
      unchecked.map((item) => `• ${item}`).join("\n") +
      `\n\nAre you sure you want to proceed to the build agent?`
    headerText = "Unfinished Checklist"
    yesLabel = "Yes, proceed anyway"
    yesDesc = "Switch to build agent despite unchecked checklist items"
    noLabel = "No, stay in plan mode"
    noDesc = "Stay with plan agent to complete the checklist"
  } else {
    const summary = buildSummaryBullets(checked, hasChecklist)
    questionText =
      `Ready to start the build. Here is what will be implemented:\n\n${summary}\n\nProceed and switch to build mode?`
    headerText = "Start Build"
    yesLabel = "Yes, start build"
    yesDesc = "Switch to build agent and begin implementing"
    noLabel = "No, not yet"
    noDesc = "Stay in plan mode"
  }

  const answers = yield* question.ask({
    sessionID,
    questions: [
      {
        question: questionText,
        header: headerText,
        custom: false,
        options: [
          { label: yesLabel, description: yesDesc },
          { label: noLabel, description: noDesc },
        ],
      },
    ],
    tool: toolRef,
  })

  const choice = answers[0]?.[0]
  if (choice === yesLabel) return { status: unchecked.length > 0 ? Overridden : Passed } as GateResult
  return { status: Blocked, uncheckedItems: unchecked } as GateResult
})

function buildSummaryBullets(checkedItems: string[], hasChecklist: boolean): string {
  if (!hasChecklist || checkedItems.length === 0)
    return "• Implement the plan as described in the plan document"

  const bullets = checkedItems.slice(0, 5)
  if (checkedItems.length > 5) bullets.push(`…and ${checkedItems.length - 5} more steps`)
  return bullets.map((item) => `• ${item}`).join("\n")
}

export * as BuildGate from "./build-gate"
