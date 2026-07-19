import { Effect, Layer, ConfigProvider, Context } from "effect"
import { Agent } from "./src/agent/agent"
import { ToolRegistry } from "./src/tool/registry"
import { RuntimeFlags } from "./src/effect/runtime-flags"
import { Config } from "./src/config/config"
import { Auth } from "./src/auth"
import { Plugin } from "./src/plugin"
import { Skill } from "./src/skill"
import { Provider } from "./src/provider/provider"
import { LocationServiceMap, locationServiceMapLayer } from "@opencode-ai/core/location-services"
import { InstanceState } from "./src/effect/instance-state"

const program = Effect.gen(function* () {
  const agents = yield* Agent.Service
  const buildAgent = yield* agents.get("build")
  if (!buildAgent) throw new Error("build agent not found")
  
  const registry = yield* ToolRegistry
  const toolsInfo = yield* registry.tools({
     agent: buildAgent,
     modelID: "gpt-4",
     providerID: "openai",
     location: { workspaceID: "test" } as any,
  })
  
  const taskTool = toolsInfo.find(t => t.id === "task")
  console.log("Task Tool Description:\n" + taskTool?.description)
})

// Can't run this easily due to the massive dependency graph. I'll just write a test in task.test.ts instead or just rely on the tests.
