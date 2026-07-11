import type { Plugin } from "@opencode-ai/plugin"
import fs from "fs"
import path from "path"

// Map of sessionID to current model string
const sessionModels = new Map<string, string>()

// Cache for budget config
let configCache: {
  threshold: number
  priority: { model: string; limit: number }[]
} | null = null

function loadConfig(directory: string) {
  try {
    const configPath = path.join(directory, "budget-guardian.json")
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf8"))
      configCache = {
        threshold: data.threshold ?? 0.8,
        priority: data.priority ?? []
      }
    }
  } catch (e) {
    console.error("[Budget Guardian] Failed to load budget-guardian.json:", e)
  }
}

function updateDefaultModel(directory: string, newModel: string) {
  try {
    const opencodeJsonPath = path.join(directory, "opencode.json")
    if (fs.existsSync(opencodeJsonPath)) {
      const data = JSON.parse(fs.readFileSync(opencodeJsonPath, "utf8"))
      data.model = newModel
      fs.writeFileSync(opencodeJsonPath, JSON.stringify(data, null, 2))
      console.log(`[Budget Guardian] Successfully updated model in config to: ${newModel}`)
    }
  } catch (e) {
    console.error("[Budget Guardian] Failed to update opencode.json:", e)
  }
}

export const BudgetGuardianPlugin: Plugin = async (input, options) => {
  const directory = input.directory
  console.log("[Budget Guardian] Plugin loaded for directory:", directory)
  loadConfig(directory)

  return {
    event: async ({ event }) => {
      if (!event) return

      // Load config on event to ensure updates (like threshold change) are reflected
      loadConfig(directory)
      if (!configCache || !configCache.priority || configCache.priority.length === 0) return

      const sessionID = event.properties?.sessionID ?? event.properties?.info?.sessionID
      if (!sessionID) return

      // --- Track current model in the session ---
      // Support V1 (message.updated / session.created) and V2 (session.next.step.started)
      let modelName: string | undefined = undefined

      if (event.type === "message.updated" && event.properties?.info) {
        const info = event.properties.info
        if (info.model?.providerID && info.model?.modelID) {
          modelName = `${info.model.providerID}/${info.model.modelID}`
        } else if (info.providerID && info.modelID) {
          modelName = `${info.providerID}/${info.modelID}`
        }
      } else if (event.type === "session.next.step.started" && event.properties?.model) {
        const m = event.properties.model
        modelName = `${m.providerID}/${m.id}`
      } else if (event.type === "session.next.model.switched" && event.properties?.model) {
        const m = event.properties.model
        modelName = `${m.providerID}/${m.id}`
      }

      if (modelName) {
        sessionModels.set(sessionID, modelName)
      }

      // --- Proactive switching at threshold% context usage ---
      // Support V1 (message.updated) and V2 (session.next.step.ended)
      let inputTokens: number | undefined = undefined
      let currentModel = sessionModels.get(sessionID)

      if (event.type === "message.updated" && event.properties?.info?.role === "assistant") {
        const info = event.properties.info
        if (info.tokens?.input) {
          inputTokens = info.tokens.input
        }
      } else if (event.type === "session.next.step.ended" && event.properties?.tokens) {
        inputTokens = event.properties.tokens.input
      }

      if (inputTokens !== undefined) {
        if (!currentModel && event.properties?.info) {
          const info = event.properties.info
          if (info.providerID && info.modelID) {
            currentModel = `${info.providerID}/${info.modelID}`
          }
        }

        if (currentModel) {
          const matched = configCache.priority.find(item => item.model === currentModel)
          if (matched) {
            const ratio = inputTokens / matched.limit
            if (ratio >= configCache.threshold) {
              const currentIndex = configCache.priority.findIndex(item => item.model === currentModel)
              if (currentIndex !== -1 && currentIndex < configCache.priority.length - 1) {
                const nextItem = configCache.priority[currentIndex + 1]

                console.log(`[Budget Guardian] Proactive trigger: Context usage is ${Math.round(ratio * 100)}% (threshold: ${Math.round(configCache.threshold * 100)}%). Auto-switching from ${currentModel} to ${nextItem.model}.`)

                // Update default model in opencode.json
                updateDefaultModel(directory, nextItem.model)

                // Notify session using prompt API
                try {
                  await input.client.session.prompt({
                    sessionID,
                    prompt: {
                      text: `🚨 [Budget Guardian] Context usage has reached ${Math.round(ratio * 100)}% (threshold: ${Math.round(configCache.threshold * 100)}%). Auto-switching default model to ${nextItem.model}.`
                    }
                  })
                } catch (e) {
                  console.error("[Budget Guardian] Failed to prompt session switch notification:", e)
                }
              }
            }
          }
        }
      }

      // --- Reactive retry on failure (rate limit or context overflow) ---
      // Support V1 (session.error) and V2 (session.next.step.failed)
      let errorVal: any = undefined
      if (event.type === "session.error" && event.properties?.error) {
        errorVal = event.properties.error
      } else if (event.type === "session.next.step.failed" && event.properties?.error) {
        errorVal = event.properties.error
      }

      if (errorVal) {
        const errorMsg = errorVal.message || errorVal.code || errorVal._tag || ""
        if (typeof errorMsg === "string" && errorMsg) {
          const isRateLimitOrOverflow = /rate.*limit|429|context.*limit|overflow|too many tokens/i.test(errorMsg)
          if (isRateLimitOrOverflow) {
            if (!currentModel) {
              // Try to fallback to whatever model is configured in the session
              currentModel = configCache.priority[0]?.model
            }
            if (currentModel) {
              const currentIndex = configCache.priority.findIndex(item => item.model === currentModel)
              if (currentIndex !== -1 && currentIndex < configCache.priority.length - 1) {
                const nextItem = configCache.priority[currentIndex + 1]

                console.log(`[Budget Guardian] Reactive trigger: Step failed with error "${errorMsg}". Retrying with next model ${nextItem.model}.`)

                // Update default model in opencode.json
                updateDefaultModel(directory, nextItem.model)

                // Retry prompt on session with new model and explain why
                try {
                  await input.client.session.prompt({
                    sessionID,
                    prompt: {
                      text: `🚨 [Budget Guardian] Request failed (${errorMsg}). Retrying once with next priority model: ${nextItem.model}.`
                    }
                  })
                } catch (e) {
                  console.error("[Budget Guardian] Failed to retry prompt:", e)
                }
              }
            }
          }
        }
      }
    }
  }
}

// Export a default object that satisfies both V1 loader and V2 Loader
export default {
  id: "budget-guardian",
  server: BudgetGuardianPlugin,
  setup: async (ctx) => {
    // V2 Promise setup no-op
  }
}
