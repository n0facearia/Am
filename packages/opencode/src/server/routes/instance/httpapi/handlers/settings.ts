import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import * as fs from "node:fs/promises"
import * as nodePath from "node:path"

interface SettingsFile {
  budgetGuardian?: {
    fallbackModels?: string[]
    contextThreshold?: number
  }
  agentModels?: Record<string, string>
  customInstructions?: Record<string, string[]>
  userProfile?: {
    preferredName?: string
    bio?: string
    experienceLevel?: string
  }
}

const EMPTY: SettingsFile = {}

const readSettingsFile = (filePath: string): Effect.Effect<SettingsFile> =>
  Effect.tryPromise({
    try: () =>
      fs
        .readFile(filePath, "utf-8")
        .then((content) => JSON.parse(content) as SettingsFile)
        .catch(() => EMPTY),
    catch: () => EMPTY,
  }).pipe(Effect.orElseSucceed(() => EMPTY))

const writeSettingsFile = (input: {
  filePath: string
  data: SettingsFile
}): Effect.Effect<void, HttpApiError.BadRequest> =>
  Effect.tryPromise({
    try: () => fs.writeFile(input.filePath, JSON.stringify(input.data, null, 2), "utf-8"),
    catch: () => new HttpApiError.BadRequest({}),
  })

export const settingsHandlers = HttpApiBuilder.group(InstanceHttpApi, "settings", (handlers) =>
  Effect.gen(function* () {
    const get = Effect.fn("SettingsHttpApi.get")(function* () {
      const dir = yield* InstanceState.directory
      return yield* readSettingsFile(nodePath.join(dir, "settings.json"))
    })

    const update = Effect.fn("SettingsHttpApi.update")(function* (ctx) {
      const dir = yield* InstanceState.directory
      const filePath = nodePath.join(dir, "settings.json")
      const existing = yield* readSettingsFile(filePath)

      const merged: SettingsFile = {
        ...existing,
        ...ctx.payload,
        budgetGuardian: ctx.payload.budgetGuardian
          ? { ...existing.budgetGuardian, ...ctx.payload.budgetGuardian }
          : existing.budgetGuardian,
        agentModels: ctx.payload.agentModels
          ? { ...existing.agentModels, ...ctx.payload.agentModels }
          : existing.agentModels,
        customInstructions: ctx.payload.customInstructions
          ? { ...existing.customInstructions, ...ctx.payload.customInstructions }
          : existing.customInstructions,
        userProfile: ctx.payload.userProfile
          ? { ...existing.userProfile, ...ctx.payload.userProfile }
          : existing.userProfile,
      }

      yield* writeSettingsFile({ filePath, data: merged })
      return merged
    })

    return handlers.handle("get", get).handle("update", update)
  }),
)
