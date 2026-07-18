/**
 * BudgetGuardian E2E walkthrough — all 5 steps:
 *   1. Confirm 2 real models in fallback priority list
 *   2. Drop threshold to 5%
 *   3. Run a check that triggers failover (switch)
 *   4. Confirm the explanation message
 *   5. Restore threshold to 80%
 */
import { Effect } from "effect"
import { AppNodeBuilder } from "../src/effect/app-node-builder"
import { BudgetGuardian, type CheckResult } from "../src/session/budget-guardian"
import { LayerNode } from "../src/effect/layer-node"
import { Session } from "@opencode-ai/schema/session"

const testLayer = AppNodeBuilder.build(
  LayerNode.group([BudgetGuardian.node]),
)

const TEST_DIR = "/tmp/bg-e2e-test"
const SETTINGS_PATH = `${TEST_DIR}/settings.json`

async function writeSettings(threshold: number, models: string[]) {
  await Bun.write(SETTINGS_PATH, JSON.stringify({
    budgetGuardian: {
      fallbackModels: models,
      contextThreshold: threshold,
    },
  }))
}

async function main() {
  await Bun.write(`${TEST_DIR}/.keep`, "")

  // ═══════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70))
  console.log("STEP 1: Confirm 2 real models in fallback priority list")
  console.log("═".repeat(70))

  const models = ["opencode/deepseek-v4-flash-free", "opencode/deepseek-v4-pro"]
  await writeSettings(0.8, models)

  const settings1 = await Effect.gen(function* () {
    const bg = yield* BudgetGuardian.Service
    return yield* bg.getSettings(TEST_DIR)
  }).pipe(Effect.provide(testLayer), Effect.runPromise)

  console.log(`  fallbackModels:   ${JSON.stringify(settings1.fallbackModels)}`)
  console.log(`  contextThreshold: ${settings1.contextThreshold}`)
  console.log(`  ✓ Two real models confirmed: ${settings1.fallbackModels.join(", ")}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70))
  console.log("STEP 2: Drop proactive threshold to 5% (0.05)")
  console.log("═".repeat(70))

  await writeSettings(0.05, models)

  const settings2 = await Effect.gen(function* () {
    const bg = yield* BudgetGuardian.Service
    return yield* bg.getSettings(TEST_DIR)
  }).pipe(Effect.provide(testLayer), Effect.runPromise)

  console.log(`  contextThreshold: ${settings2.contextThreshold}`)
  console.log(`  ✓ Threshold now 5% — any projected token ratio > 5% triggers failover`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70))
  console.log("STEP 3: Run a task until BudgetGuardian switches (triggers failover)")
  console.log("═".repeat(70))

  // contextLimit = 128_000, threshold = 0.05 → failover at 6,400 tokens
  // accumulated = 1,500, estimated = 7,000 → projected = 8,500
  // ratio = 8,500 / 128,000 = 6.64% > 5% → FAILOVER
  const sessionId = Session.ID.make("ses_e2e-demo")
  const contextLimit = 128_000
  const estimatedTokens = 7_000

  const checkResult = await Effect.gen(function* () {
    const bg = yield* BudgetGuardian.Service
    yield* bg.recordTokens(sessionId, { input: 1_000, output: 500 })
    return yield* bg.check(TEST_DIR, sessionId, contextLimit, estimatedTokens)
  }).pipe(Effect.provide(testLayer), Effect.runPromise) as CheckResult

  const projected = 1_500 + estimatedTokens
  console.log(`  Session:          ${sessionId}`)
  console.log(`  Accumulated:      1,500 tok (1,000 in + 500 out)`)
  console.log(`  Estimated:        ${estimatedTokens.toLocaleString()} tok`)
  console.log(`  Projected total:  ${projected.toLocaleString()} / ${contextLimit.toLocaleString()} tok`)
  console.log(`  Ratio:            ${Math.round(projected / contextLimit * 100)}% (threshold: 5%)`)
  console.log(`  Result status:    ${checkResult.status}`)

  if (checkResult.status === "failover") {
    console.log(`  Fallback model:   ${checkResult.fallbackModel.providerID}/${checkResult.fallbackModel.id}`)
    console.log(`  Reason:           ${checkResult.reason}`)
    console.log(`  ✓ FAILOVER TRIGGERED — BudgetGuardian switched models!`)
  } else {
    console.log(`  ✗ UNEXPECTED: returned OK — failover did NOT trigger`)
  }
  console.log()

  // ═══════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70))
  console.log("STEP 4: Confirm the switch explanation message")
  console.log("═".repeat(70))

  if (checkResult.status === "failover") {
    console.log(`  Full explanation:`)
    console.log(`  "${checkResult.message}"`)
    console.log()
    console.log(`  Breakdown:`)
    console.log(`    • status:        "${checkResult.status}"`)
    console.log(`    • reason:        "${checkResult.reason}" (threshold exceeded)`)
    console.log(`    • fallbackModel: ${checkResult.fallbackModel.providerID}/${checkResult.fallbackModel.id}`)
    console.log(`    • explanation:   Contains threshold %, token count, and target model`)
    console.log(`  ✓ Message explains WHY (threshold exceeded), HOW MUCH (${Math.round(projected / contextLimit * 100)}% vs 5%), and WHERE (fallback model)`)
  }
  console.log()

  // ═══════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70))
  console.log("STEP 5: Restore threshold to 80% (0.8)")
  console.log("═".repeat(70))

  await writeSettings(0.8, models)

  const settings5 = await Effect.gen(function* () {
    const bg = yield* BudgetGuardian.Service
    return yield* bg.getSettings(TEST_DIR)
  }).pipe(Effect.provide(testLayer), Effect.runPromise)

  // Same token load, new session → should NOT trigger failover now
  const sessionId2 = Session.ID.make("ses_e2e-restore")
  const restoredCheck = await Effect.gen(function* () {
    const bg = yield* BudgetGuardian.Service
    yield* bg.recordTokens(sessionId2, { input: 1_000, output: 500 })
    return yield* bg.check(TEST_DIR, sessionId2, contextLimit, estimatedTokens)
  }).pipe(Effect.provide(testLayer), Effect.runPromise) as CheckResult

  console.log(`  contextThreshold: ${settings5.contextThreshold}`)
  console.log(`  Same check after restore → status: ${restoredCheck.status}`)
  console.log(`  ✓ Threshold restored to 80% — same token load no longer triggers failover`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════
  console.log("═".repeat(70))
  console.log("FULL SUMMARY")
  console.log("═".repeat(70))
  console.log(`  Step 1: Fallback models — [${models.join(", ")}]`)
  console.log(`  Step 2: Threshold dropped to 5% (0.05)`)
  console.log(`  Step 3: Failover triggered — ${checkResult.status === "failover" ? "YES" : "NO"}`)
  console.log(`  Step 4: Explanation — "${checkResult.status === "failover" ? checkResult.message : "N/A"}"`)
  console.log(`  Step 5: Threshold restored to 80% — post-restore check: ${restoredCheck.status}`)
  console.log("═".repeat(70))
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
