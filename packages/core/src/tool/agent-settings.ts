import { ToolFailure } from "@opencode-ai/llm"
import { Effect, Layer, Schema } from "effect"
import { makeLocationNode } from "../effect/app-node"
import { Tool } from "./tool"
import { FSUtil } from "../fs-util"
import { Location } from "../location"
import { ToolRegistry } from "./registry"
import { Tools } from "./tools"
import path from "path"

export const name = "attach_instruction"

const layer = Layer.effectDiscard(
  Effect.gen(function* () {
    const tools = yield* Tools.Service
    const fs = yield* FSUtil.Service
    const location = yield* Location.Service

    const execute = (input: { agentId: string; filePath: string }, context: Tool.Context) =>
      Effect.gen(function* () {
        const settingsPath = path.join(location.directory, "settings.json")

        const text = yield* fs.readFileStringSafe(settingsPath).pipe(
          Effect.catch(() => Effect.succeed(undefined)),
        )
        if (!text) {
          return "Error: settings.json not found at the project root."
        }

        let settings
        try {
          settings = JSON.parse(text)
        } catch (e) {
          return "Error: Failed to parse settings.json."
        }

        const customInstructions = settings.customInstructions ?? {}
        const paths = customInstructions[input.agentId] ?? []
        if (!Array.isArray(paths)) {
          return "Error: customInstructions for this agent is not a list of files."
        }

        if (paths.includes(input.filePath)) {
          return `File ${input.filePath} is already attached to agent ${input.agentId}.`
        }

        const updatedPaths = [...paths, input.filePath]
        const updatedSettings = {
          ...settings,
          customInstructions: {
            ...customInstructions,
            [input.agentId]: updatedPaths,
          },
        }

        yield* fs.writeFileString(settingsPath, JSON.stringify(updatedSettings, null, 2))

        return `Successfully attached ${input.filePath} to agent ${input.agentId}. Note: A restart is required for the changes to take effect in the current session.`
      }).pipe(
        Effect.mapError(() => new ToolFailure({ message: "Failed to attach instruction file." })),
      )

    yield* tools
      .register({
        [name]: Tool.make({
          description: "Attaches a .md file to a specific agent's custom instructions in settings.json",
          input: Schema.Struct({
            agentId: Schema.String,
            filePath: Schema.String,
          }),
          output: Schema.String,
          execute,
        }),
      })
      .pipe(Effect.orDie)
  }),
)

export const node = makeLocationNode({
  name: "tool/agent-settings",
  layer,
  deps: [ToolRegistry.node, FSUtil.node, Location.node],
})
