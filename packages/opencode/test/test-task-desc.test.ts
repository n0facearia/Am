import { testEffect } from "./lib/effect";
import { Effect } from "effect";
import { Agent } from "../src/agent/agent";
import { ToolRegistry } from "../src/tool/registry";
import { Config } from "../src/config/config";
import { LayerNode } from "@opencode-ai/core/effect/layer-node";
import { BackgroundJob } from "../src/background/job";
import { EventV2Bridge } from "../src/event-v2-bridge";
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner";
import { Session } from "../src/session/session";
import { SessionProjector } from "@opencode-ai/core/session/projector";
import { SessionRunState } from "../src/session/run-state";
import { SessionStatus } from "../src/session/status";
import { Truncate } from "../src/tool/truncate";
import { RuntimeFlags } from "../src/effect/runtime-flags";
import { Skill } from "../src/skill/index";
import { Discovery } from "../src/skill/discovery";
import { FSUtil } from "@opencode-ai/core/fs-util";
import { Global } from "@opencode-ai/core/global";
import { test } from "bun:test";

const layer = LayerNode.compile(
  LayerNode.group([
    Agent.node, BackgroundJob.node, EventV2Bridge.node, Config.node,
    CrossSpawnSpawner.node, Session.node, SessionProjector.node,
    SessionRunState.node, SessionStatus.node, Truncate.node,
    ToolRegistry.node, RuntimeFlags.node, Skill.node,
    Discovery.node, FSUtil.node, Global.node
  ])
)

const t = testEffect(layer);
t.instance("verify task description", Effect.gen(function* () {
  const agents = yield* Agent.Service;
  const planAgent = yield* agents.get("plan");
  
  const registry = yield* ToolRegistry.Service;
  const toolsInfo = yield* registry.tools({
     agent: planAgent!,
     modelID: "gpt-4",
     providerID: "openai",
     location: { directory: process.cwd() } as any,
  });
  
  const taskTool = toolsInfo.find(t => t.id === "task");
  console.log("=== TASK TOOL DESCRIPTION (PLAN AGENT) ===");
  console.log(taskTool?.description);
  console.log("==========================================");
}), {
  config: () => require("../../../opencode.json")
}, 20000);
