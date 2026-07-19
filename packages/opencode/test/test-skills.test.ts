import { testEffect } from "./lib/effect";
import { Effect } from "effect";
import { Agent } from "../src/agent/agent";
import { ToolRegistry } from "../src/tool/registry";
import { Skill } from "../src/skill/index";

import { LayerNode } from "@opencode-ai/core/effect/layer-node";
import { BackgroundJob } from "../src/background/job";
import { EventV2Bridge } from "../src/event-v2-bridge";
import { Config } from "../src/config/config";
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner";
import { Session } from "../src/session/session";
import { SessionProjector } from "@opencode-ai/core/session/projector";
import { SessionRunState } from "../src/session/run-state";
import { SessionStatus } from "../src/session/status";
import { Truncate } from "../src/tool/truncate";
import { RuntimeFlags } from "../src/effect/runtime-flags";
import { Discovery } from "../src/skill/discovery";
import { FSUtil } from "@opencode-ai/core/fs-util";
import { Global } from "@opencode-ai/core/global";

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
t.instance("verify skill load", Effect.gen(function* () {
  const skills = yield* Skill.Service;
  const all = yield* skills.all();
  console.log("Loaded " + all.length + " skills!");
  
  const frontendSkills = yield* skills.available(
    (yield* (yield* Agent.Service).get("frontend"))!
  );
  console.log("Frontend available skills: ", frontendSkills.map(s => s.name).join(", "));
}), {
  config: () => require("../../../opencode.json")
});
