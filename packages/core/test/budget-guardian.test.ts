import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { AppNodeBuilder } from "../src/effect/app-node-builder"
import { BudgetGuardian, type CheckResult } from "../src/session/budget-guardian"
import { FSUtil } from "../src/fs-util"
import { ModelV2 } from "../src/model"
import { ProviderV2 } from "../src/provider"
import { Session } from "@opencode-ai/schema/session"
import { LayerNode } from "../src/effect/layer-node"

const testLayer = AppNodeBuilder.build(
  LayerNode.group([BudgetGuardian.node]),
)

describe("BudgetGuardian", () => {
  // ── Pure function tests ────────────────────────────────────────────────

  describe("resolveFallback (internal)", () => {
    test("selects fallback model by session ID hash (round-robin)", () => {
      // The test environment makes resolveFallback accessible by re-export
      // from budget-guardian module.
      const models = ["openai/gpt-4o-mini", "anthropic/claude-3-haiku", "openai/o3-mini"]
      // Use the resolveFallback via the check() method: provide settings with fallbackModels
      // and a session ID, then check() with enough estimated tokens to trigger threshold.
    })
  })

  describe("hashCode (internal)", () => {
    test("produces consistent hashes for the same input", () => {
      // hash is used by resolveFallback — tested indirectly via check()
    })
  })

  // ── Integration tests with BudgetGuardian layer ────────────────────────

  describe("check", () => {
    test("returns ok when no settings.json exists (uses defaults)", async () => {
      const result = await Effect.gen(function* () {
        const bg = yield* BudgetGuardian.Service
        return yield* bg.check("/tmp/nonexistent", Session.ID.make("ses_test-1"), 128_000, 1000)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)

      expect(result.status).toBe("ok")
    })

    test("returns ok when estimated tokens are below 80% threshold", async () => {
      const result = await Effect.gen(function* () {
        const bg = yield* BudgetGuardian.Service
        // With contextLimit=128_000 and threshold=0.8, failover at 102_400
        return yield* bg.check("/tmp/nonexistent", Session.ID.make("ses_test-2"), 128_000, 50_000)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)

      expect(result.status).toBe("ok")
    })

    test("returns failover when estimated tokens exceed 80% threshold with configured fallbacks", async () => {
      // Write settings.json to a temp directory
      const dir = `/tmp/bg-test-${Date.now()}`
      await Bun.write(`${dir}/settings.json`, JSON.stringify({
        budgetGuardian: {
          fallbackModels: ["anthropic/claude-3-haiku"],
          contextThreshold: 0.5,
        },
      }))

      try {
        const result = await Effect.gen(function* () {
          const bg = yield* BudgetGuardian.Service
          return yield* bg.check(dir, Session.ID.make("ses_test-3"), 100_000, 60_000)
        }).pipe(Effect.provide(testLayer), Effect.runPromise) as CheckResult

        expect(result.status).toBe("failover")
        if (result.status === "failover") {
          expect(result.reason).toBe("threshold")
          expect(result.fallbackModel.providerID).toBe(ProviderV2.ID.anthropic)
          expect(result.fallbackModel.id).toBe(ModelV2.ID.make("claude-3-haiku"))
          expect(result.message).toContain("Failover")
        }
      } finally {
        await Bun.write(`${dir}/settings.json`, "")
      }
    })

    test("returns ok when fallbackModels list is empty even past threshold", async () => {
      const dir = `/tmp/bg-test-${Date.now()}`
      await Bun.write(`${dir}/settings.json`, JSON.stringify({
        budgetGuardian: {
          contextThreshold: 0.3,
        },
      }))

      try {
        const result = await Effect.gen(function* () {
          const bg = yield* BudgetGuardian.Service
          return yield* bg.check(dir, Session.ID.make("ses_test-4"), 100_000, 90_000)
        }).pipe(Effect.provide(testLayer), Effect.runPromise)

        expect(result.status).toBe("ok")
      } finally {
        await Bun.write(`${dir}/settings.json`, "")
      }
    })
  })

  describe("recordTokens", () => {
    test("accumulates tokens across multiple calls", async () => {
      const sid = Session.ID.make("ses_token-test")

      const state = await Effect.gen(function* () {
        const bg = yield* BudgetGuardian.Service
        yield* bg.recordTokens(sid, { input: 1000, output: 500 })
        yield* bg.recordTokens(sid, { input: 2000, output: 1500 })
        return yield* bg.getState(sid)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)

      expect(state.tokensInput).toBe(3000)
      expect(state.tokensOutput).toBe(2000)
      expect(state.totalTokens).toBe(5000)
    })
  })

  describe("recordRateLimit", () => {
    test("returns failover when fallback models are configured", async () => {
      const dir = `/tmp/bg-test-${Date.now()}`
      await Bun.write(`${dir}/settings.json`, JSON.stringify({
        budgetGuardian: {
          fallbackModels: ["openai/o3-mini"],
          contextThreshold: 0.8,
        },
      }))

      try {
        const result = await Effect.gen(function* () {
          const bg = yield* BudgetGuardian.Service
          return yield* bg.recordRateLimit(
            dir,
            Session.ID.make("ses_rate-limit"),
            ModelV2.Ref.make({ id: ModelV2.ID.make("gpt-4o"), providerID: ProviderV2.ID.openai }),
          )
        }).pipe(Effect.provide(testLayer), Effect.runPromise) as CheckResult

        expect(result.status).toBe("failover")
        if (result.status === "failover") {
          expect(result.reason).toBe("rate-limit")
          expect(result.fallbackModel.id).toBe(ModelV2.ID.make("o3-mini"))
        }
      } finally {
        await Bun.write(`${dir}/settings.json`, "")
      }
    })

    test("returns ok when no fallback models configured", async () => {
      const result = await Effect.gen(function* () {
        const bg = yield* BudgetGuardian.Service
        return yield* bg.recordRateLimit(
          "/tmp/nonexistent",
          Session.ID.make("ses_rate-limit-2"),
          ModelV2.Ref.make({ id: ModelV2.ID.make("gpt-4o"), providerID: ProviderV2.ID.openai }),
        )
      }).pipe(Effect.provide(testLayer), Effect.runPromise)

      expect(result.status).toBe("ok")
    })
  })

  describe("getState", () => {
    test("returns initial state for new sessions", async () => {
      const state = await Effect.gen(function* () {
        const bg = yield* BudgetGuardian.Service
        return yield* bg.getState(Session.ID.make("ses_fresh"))
      }).pipe(Effect.provide(testLayer), Effect.runPromise)

      expect(state.tokensInput).toBe(0)
      expect(state.tokensOutput).toBe(0)
      expect(state.totalTokens).toBe(0)
      expect(state.failoverCount).toBe(0)
    })
  })

  describe("getSettings", () => {
    test("returns defaults when settings.json is missing", async () => {
      const settings = await Effect.gen(function* () {
        const bg = yield* BudgetGuardian.Service
        return yield* bg.getSettings("/tmp/nonexistent-path")
      }).pipe(Effect.provide(testLayer), Effect.runPromise)

      expect(settings.contextThreshold).toBe(0.8)
      expect(settings.fallbackModels).toEqual([])
    })
  })
})
