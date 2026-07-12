import path from "path"
import { SessionV1 } from "@opencode-ai/core/v1/session"
import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Question } from "../question"
import { Session } from "@/session/session"
import { MessageV2 } from "../session/message-v2"
import { Provider } from "@/provider/provider"
import { InstanceState } from "@/effect/instance-state"
import { MessageID, PartID } from "../session/schema"
import { FSUtil } from "@opencode-ai/core/fs-util"
import EXIT_DESCRIPTION from "./plan-exit.txt"

export const Parameters = Schema.Struct({})

export const PlanExitTool = Tool.define(
  "plan_exit",
  Effect.gen(function* () {
    const session = yield* Session.Service
    const question = yield* Question.Service
    const provider = yield* Provider.Service
    const fsys = yield* FSUtil.Service

    return {
      description: EXIT_DESCRIPTION,
      parameters: Parameters,
      execute: (_params: {}, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const instance = yield* InstanceState.context
          const info = yield* session.get(ctx.sessionID)
          const plan = path.relative(instance.worktree, Session.plan(info, instance))

          const checklistPath = path.join(instance.worktree, "PLAN_CHECKLIST.md")
          let hasChecklist = yield* fsys.existsSafe(checklistPath)

          // Auto-generate PLAN_CHECKLIST.md from the plan file if it doesn't exist yet.
          if (!hasChecklist) {
            const planPath = path.join(instance.worktree, plan)
            const planContent = yield* fsys.readFileStringSafe(planPath)
            if (planContent) {
              const tasks: string[] = []
              for (const line of planContent.split(/\r?\n/)) {
                const trimmed = line.trim()
                // Match markdown list items that look like actionable steps
                // (not headers, not code fences, not empty lines).
                const listMatch = trimmed.match(/^(?:[-*]\s+|\d+[.)]\s+)(.+)/)
                if (listMatch && !trimmed.startsWith("```") && !trimmed.startsWith("#")) {
                  const desc = listMatch[1].replace(/^-\s+/, "").trim()
                  if (desc.length > 5 && !desc.startsWith("[") && !desc.startsWith(">")) {
                    tasks.push(desc)
                  }
                }
              }
              if (tasks.length > 0) {
                const checklist = tasks.map((t) => `- [ ] ${t}`).join("\n") + "\n"
                yield* fsys.writeFileString(checklistPath, checklist)
                hasChecklist = true
              }
            }
          }

          const uncheckedItems: string[] = []
          const checkedItems: string[] = []

          if (hasChecklist) {
            const content = yield* fsys.readFileStringSafe(checklistPath)
            if (content) {
              for (const line of content.split(/\r?\n/)) {
                if (line.includes("- [ ]")) {
                  const cleaned = line.replace(/^\s*(?:\d+\.\s*)?-\s*\[\s*\]\s*/, "")
                  uncheckedItems.push(cleaned || line.trim())
                } else if (line.includes("- [x]") || line.includes("- [X]")) {
                  const cleaned = line.replace(/^\s*(?:\d+\.\s*)?-\s*\[[xX]\]\s*/, "")
                  if (cleaned) checkedItems.push(cleaned)
                }
              }
            }
          }

          let questionText: string
          let headerText: string
          let yesLabel: string
          let yesDesc: string
          let noLabel: string
          let noDesc: string

          if (uncheckedItems.length > 0) {
            questionText = `Warning: The following checklist items are still unchecked:\n` +
              uncheckedItems.map((item) => `• ${item}`).join("\n") +
              `\n\nAre you sure you want to proceed to the build agent?`
            headerText = "Unfinished Checklist"
            yesLabel = "Yes, proceed anyway"
            yesDesc = "Switch to build agent despite unchecked checklist items"
            noLabel = "No, stay in plan mode"
            noDesc = "Stay with plan agent to complete the checklist"
          } else {
            // All checked (or no checklist): show Start Build summary confirmation
            const summary = buildSummaryBullets(checkedItems, hasChecklist)
            questionText =
              `Ready to start the build. Here is what will be implemented:\n\n${summary}\n\nProceed and switch to build mode?`
            headerText = "Start Build"
            yesLabel = "Yes, start build"
            yesDesc = "Switch to build agent and begin implementing"
            noLabel = "No, not yet"
            noDesc = "Stay in plan mode"
          }

          const answers = yield* question.ask({
            sessionID: ctx.sessionID,
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
            tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
          })

          if (answers[0]?.[0] === noLabel) yield* new Question.RejectedError()

          const messages = yield* session.messages({ sessionID: ctx.sessionID }).pipe(Effect.orDie)
          const lastUser = messages.findLast((item) => item.info.role === "user" && item.info.model)
          const model =
            lastUser?.info.role === "user" && lastUser.info.model ? lastUser.info.model : yield* provider.defaultModel()

          const msg: SessionV1.User = {
            id: MessageID.ascending(),
            sessionID: ctx.sessionID,
            role: "user",
            time: { created: Date.now() },
            agent: "build",
            model,
          }
          yield* session.updateMessage(msg)
          yield* session.updatePart({
            id: PartID.ascending(),
            messageID: msg.id,
            sessionID: ctx.sessionID,
            type: "text",
            text: `The plan at ${plan} has been approved, you can now edit files. Execute the plan`,
            synthetic: true,
          } satisfies SessionV1.TextPart)

          return {
            title: "Switching to build agent",
            output: "User approved switching to build agent. Wait for further instructions.",
            metadata: {},
          }
        }).pipe(Effect.orDie),
    }
  }),
)

// Derives a 3-5 bullet "what will be built" summary from the checked checklist
// items. Falls back to a generic message when no checklist is present.
function buildSummaryBullets(checkedItems: string[], hasChecklist: boolean): string {
  if (!hasChecklist || checkedItems.length === 0)
    return "• Implement the plan as described in the plan document"

  const bullets = checkedItems.slice(0, 5)
  if (checkedItems.length > 5) bullets.push(`…and ${checkedItems.length - 5} more steps`)
  return bullets.map((item) => `• ${item}`).join("\n")
}
