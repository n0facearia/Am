import { test, expect } from "bun:test"
import { Effect } from "effect"
import { ToolRegistry } from "../../src/tool/registry"
import { testEffect } from "../lib/effect"
import { Agent } from "../../src/agent/agent"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { BackgroundJob } from "@/background/job"
import { EventV2Bridge } from "@/event-v2-bridge"
import { Config } from "@/config/config"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { Session } from "@/session/session"
import { SessionProjector } from "@opencode-ai/core/session/projector"
import { SessionRunState } from "@/session/run-state"
import { SessionStatus } from "@/session/status"
import { Truncate } from "@/tool/truncate"
import { RuntimeFlags } from "@/effect/runtime-flags"

const layer = LayerNode.compile(
  LayerNode.group([
    Agent.node, BackgroundJob.node, EventV2Bridge.node, Config.node,
    CrossSpawnSpawner.node, Session.node, SessionProjector.node,
    SessionRunState.node, SessionStatus.node, Truncate.node,
    ToolRegistry.node, RuntimeFlags.node,
  ])
)

const t = testEffect(layer)

t.instance("verify task description", Effect.gen(function* () {
  const agents = yield* Agent.Service
  const buildAgent = yield* agents.get("build")
  if (!buildAgent) throw new Error("build agent not found")
  
  const registry = yield* ToolRegistry.Service
  const toolsInfo = yield* registry.tools({
     agent: buildAgent,
     modelID: "gpt-4",
     providerID: "openai",
     location: { workspaceID: "test" } as any,
  })
  
  const taskTool = toolsInfo.find((t: any) => t.id === "task")
  console.log("== TASK TOOL DESCRIPTION ==")
  console.log(taskTool?.description)
  console.log("===========================")
  expect(taskTool?.description).toContain("frontend")
}))
