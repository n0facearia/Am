import { describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Effect, Fiber, Queue } from "effect"
import { BuildGate } from "../../src/tool/build-gate"
import { Question } from "../../src/question"
import { SessionID, MessageID } from "../../src/session/schema"
import { Truncate } from "@/tool/truncate"
import { testEffect } from "../lib/effect"
import { EventV2Bridge } from "../../src/event-v2-bridge"
import { FSUtil } from "@opencode-ai/core/fs-util"
import path from "path"

const it = testEffect(
  LayerNode.compile(LayerNode.group([Question.node, EventV2Bridge.node, Truncate.node, FSUtil.node])),
)

const pending = Effect.fn("BuildGateTest.pending")(function* (question: Question.Interface) {
  const events = yield* EventV2Bridge.Service
  const asked = yield* Queue.unbounded<void>()
  const off = yield* events.listen((event) => {
    if (event.type === Question.Event.Asked.type) Queue.offerUnsafe(asked, undefined)
    return Effect.void
  })
  yield* Effect.addFinalizer(() => off)

  for (;;) {
    const items = yield* question.list()
    const item = items[0]
    if (item) return item
    yield* Queue.take(asked).pipe(Effect.timeout("2 seconds"))
  }
})

describe("BuildGate", () => {
  describe("scanChecklist", () => {
    it.instance("returns empty lists if PLAN_CHECKLIST.md does not exist", () =>
      Effect.gen(function* () {
        const fs = yield* FSUtil.Service
        const tmp = yield* fs.makeTempDirectoryScoped()
        const result = yield* BuildGate.scanChecklist(tmp)
        expect(result.unchecked).toEqual([])
        expect(result.checked).toEqual([])
      }),
    )

    it.instance("identifies checked and unchecked items correctly", () =>
      Effect.gen(function* () {
        const fs = yield* FSUtil.Service
        const tmp = yield* fs.makeTempDirectoryScoped()
        const checklistPath = path.join(tmp, "PLAN_CHECKLIST.md")
        yield* fs.writeFileString(
          checklistPath,
          [
            "- [ ] Unchecked Task 1",
            "- [x] Checked Task 2",
            "- [X] Checked Task 3",
            "- [ ] Unchecked Task 4",
          ].join("\n"),
        )

        const result = yield* BuildGate.scanChecklist(tmp)
        expect(result.unchecked).toEqual(["Unchecked Task 1", "Unchecked Task 4"])
        expect(result.checked).toEqual(["Checked Task 2", "Checked Task 3"])
      }),
    )
  })

  describe("enforce", () => {
    const sessionID = SessionID.make("ses_test-session")

    it.instance("asks transition confirmation when all items are checked and proceeds normally", () =>
      Effect.gen(function* () {
        const fs = yield* FSUtil.Service
        const question = yield* Question.Service
        const tmp = yield* fs.makeTempDirectoryScoped()
        const checklistPath = path.join(tmp, "PLAN_CHECKLIST.md")
        yield* fs.writeFileString(
          checklistPath,
          "- [x] All done\n",
        )

        const fiber = yield* BuildGate.enforce(tmp, sessionID, undefined).pipe(
          Effect.provideService(FSUtil.Service, fs),
          Effect.provideService(Question.Service, question),
          Effect.forkScoped,
        )
               const item = yield* pending(question)
        expect(item.questions[0]?.header).toBe("Start Build")
        yield* question.reply({ requestID: item.id, answers: [["Yes, start build"]] })

        const result = yield* Fiber.join(fiber)
        expect(result.status).toBe("passed")
      }),
    )

    it.instance("asks override warning and allows proceed when user chooses 'Yes, proceed anyway'", () =>
      Effect.gen(function* () {
        const fs = yield* FSUtil.Service
        const question = yield* Question.Service
        const tmp = yield* fs.makeTempDirectoryScoped()
        const checklistPath = path.join(tmp, "PLAN_CHECKLIST.md")
        yield* fs.writeFileString(
          checklistPath,
          "- [ ] Some pending task\n",
        )

        const fiber = yield* BuildGate.enforce(tmp, sessionID, undefined).pipe(
          Effect.provideService(FSUtil.Service, fs),
          Effect.provideService(Question.Service, question),
          Effect.forkScoped,
        )
               const item = yield* pending(question)
        expect(item.questions[0]?.header).toBe("Unfinished Checklist")
        yield* question.reply({ requestID: item.id, answers: [["Yes, proceed anyway"]] })

        const result = yield* Fiber.join(fiber)
        expect(result.status).toBe("overridden")
      }),
    )

    it.instance("asks override warning and blocks when user chooses 'No, stay in plan mode'", () =>
      Effect.gen(function* () {
        const fs = yield* FSUtil.Service
        const question = yield* Question.Service
        const tmp = yield* fs.makeTempDirectoryScoped()
        const checklistPath = path.join(tmp, "PLAN_CHECKLIST.md")
        yield* fs.writeFileString(
          checklistPath,
          "- [ ] Some pending task\n",
        )

        const fiber = yield* BuildGate.enforce(tmp, sessionID, undefined).pipe(
          Effect.provideService(FSUtil.Service, fs),
          Effect.provideService(Question.Service, question),
          Effect.forkScoped,
        )
               const item = yield* pending(question)
        expect(item.questions[0]?.header).toBe("Unfinished Checklist")
        yield* question.reply({ requestID: item.id, answers: [["No, stay in plan mode"]] })

        const result = yield* Fiber.join(fiber)
        expect(result.status).toBe("blocked")
        const unchecked = result.status === "blocked" ? result.uncheckedItems : []
        expect(unchecked).toEqual(["Some pending task"])
      }),
    )
  })
})
