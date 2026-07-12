import { Context, Effect, Layer, Schema } from "effect"
import { makeGlobalNode } from "../effect/app-node"
import { FSUtil } from "../fs-util"
import { ModelV2 } from "../model"
import { ProviderV2 } from "../provider"
import { Session } from "@opencode-ai/schema/session"

// ── Public types ───────────────────────────────────────────────────────────

export type CheckResult =
  | { readonly status: "ok" }
  | {
      readonly status: "failover"
      readonly fallbackModel: ModelV2.Ref
      readonly reason: "threshold" | "rate-limit"
      readonly message: string
    }

export interface BudgetState {
  readonly tokensInput: number
  readonly tokensOutput: number
  readonly totalTokens: number
  readonly failoverCount: number
  readonly lastFailoverReason?: string
}

/** Guard config read from settings.json */
export interface GuardianSettings {
  readonly fallbackModels: readonly string[]
  readonly contextThreshold: number
}

// ── Service interface ──────────────────────────────────────────────────────

export interface Interface {
  readonly check: (
    worktree: string,
    sessionID: Session.ID,
    contextLimit: number,
    estimatedTokens: number,
  ) => Effect.Effect<CheckResult>
  readonly recordTokens: (
    sessionID: Session.ID,
    tokens: { readonly input: number; readonly output: number },
  ) => Effect.Effect<void>
  readonly recordRateLimit: (
    worktree: string,
    sessionID: Session.ID,
    modelRef: ModelV2.Ref,
  ) => Effect.Effect<CheckResult>
  readonly getState: (sessionID: Session.ID) => Effect.Effect<BudgetState>
  readonly getSettings: (worktree: string) => Effect.Effect<GuardianSettings>
}

// ── Service tag ────────────────────────────────────────────────────────────

export class Service extends Context.Service<Service, Interface>()("@opencode/v2/BudgetGuardian") {}

// ── Internal types ─────────────────────────────────────────────────────────

interface SessionBudget {
  tokensInput: number
  tokensOutput: number
  failoverCount: number
  lastFailoverReason?: string
}

const sessionState = new Map<Session.ID, SessionBudget>()

// ── Settings JSON schema (parsed from settings.json) ────────────────────────

const SettingsFile = Schema.Struct({
  budgetGuardian: Schema.optional(
    Schema.Struct({
      fallbackModels: Schema.optional(Schema.Array(Schema.String)),
      contextThreshold: Schema.optional(Schema.Number),
    }),
  ),
})

// ── Live layer ─────────────────────────────────────────────────────────────

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service

    const readSettings = (worktree: string): Effect.Effect<GuardianSettings> =>
      Effect.gen(function* () {
        const path = `${worktree}/settings.json`
        const text = yield* fs.readFileStringSafe(path).pipe(Effect.catch(() => Effect.succeed(undefined)))
        if (!text) return { fallbackModels: [], contextThreshold: 0.8 }

        const parsed = JSON.parse(text)
        const decoded = Schema.decodeUnknownOption(SettingsFile)(parsed)
        const bg = decoded._tag === "Some" ? decoded.value.budgetGuardian : undefined

        return {
          fallbackModels: bg?.fallbackModels ?? [],
          contextThreshold: bg?.contextThreshold ?? 0.8,
        }
      })

    const getOrCreate = (sessionID: Session.ID): SessionBudget => {
      let s = sessionState.get(sessionID)
      if (!s) {
        s = { tokensInput: 0, tokensOutput: 0, failoverCount: 0 }
        sessionState.set(sessionID, s)
      }
      return s
    }

    const check: Interface["check"] = (worktree, sessionID, contextLimit, estimatedTokens) =>
      Effect.gen(function* () {
        const s = getOrCreate(sessionID)
        const settings = yield* readSettings(worktree)
        const totalAccumulated = s.tokensInput + s.tokensOutput
        const projected = totalAccumulated + estimatedTokens
        const effectiveLimit = contextLimit > 0 ? contextLimit : 128_000
        const ratio = projected / effectiveLimit

        if (ratio >= settings.contextThreshold) {
          const fallbackRef = resolveFallback(sessionID, settings.fallbackModels)
          if (fallbackRef) {
            s.failoverCount++
            s.lastFailoverReason = `context-window: ${Math.round(ratio * 100)}% of ${effectiveLimit.toLocaleString()} tok`
            return {
              status: "failover",
              fallbackModel: fallbackRef,
              reason: "threshold",
              message:
                `Context budget exceeded ${Math.round(settings.contextThreshold * 100)}% threshold ` +
                `(${Math.round(ratio * 100)}% of ${effectiveLimit.toLocaleString()} tok used). ` +
                `Failover → ${fallbackRef.providerID}/${fallbackRef.id}.`,
            } as CheckResult
          }
        }
        return { status: "ok" } as CheckResult
      })

    const recordTokens: Interface["recordTokens"] = (sessionID, tokens) =>
      Effect.sync(() => {
        const s = getOrCreate(sessionID)
        s.tokensInput += tokens.input
        s.tokensOutput += tokens.output
      })

    const recordRateLimit: Interface["recordRateLimit"] = (worktree, sessionID, modelRef) =>
      Effect.gen(function* () {
        const s = getOrCreate(sessionID)
        const settings = yield* readSettings(worktree)
        s.failoverCount++
        s.lastFailoverReason = `rate-limit on ${modelRef.providerID}/${modelRef.id}`

        const fallbackRef = resolveFallback(sessionID, settings.fallbackModels)
        if (fallbackRef) {
          return {
            status: "failover",
            fallbackModel: fallbackRef,
            reason: "rate-limit",
            message: `Rate limit on ${modelRef.providerID}/${modelRef.id}. Failover → ${fallbackRef.providerID}/${fallbackRef.id}.`,
          } as CheckResult
        }
        return { status: "ok" } as CheckResult
      })

    const getState: Interface["getState"] = (sessionID) =>
      Effect.sync(() => {
        const s = getOrCreate(sessionID)
        return {
          tokensInput: s.tokensInput,
          tokensOutput: s.tokensOutput,
          totalTokens: s.tokensInput + s.tokensOutput,
          failoverCount: s.failoverCount,
          lastFailoverReason: s.lastFailoverReason,
        }
      })

    const getSettings: Interface["getSettings"] = (worktree) => readSettings(worktree)

    return Service.of({ check, recordTokens, recordRateLimit, getState, getSettings })
  }),
)

// ── Fallback model resolution ──────────────────────────────────────────────

const resolveFallback = (
  sessionID: Session.ID,
  fallbackModels: readonly string[],
): ModelV2.Ref | undefined => {
  if (fallbackModels.length === 0) return undefined

  const index = Math.abs(hashCode(sessionID)) % fallbackModels.length
  const raw = fallbackModels[index]
  const parts = raw.split("/")
  if (parts.length < 2) return undefined

  return ModelV2.Ref.make({ id: ModelV2.ID.make(parts.slice(1).join("/")), providerID: ProviderV2.ID.make(parts[0]) })
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

export const node = makeGlobalNode({ service: Service, layer, deps: [FSUtil.node] })

export * as BudgetGuardian from "./budget-guardian"
