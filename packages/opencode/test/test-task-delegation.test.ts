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
import { TaskTool, type TaskPromptOps } from "../src/tool/task";
import { test, expect } from "bun:test";

import { Database } from "@opencode-ai/core/database/database";
import { Ripgrep } from "@opencode-ai/core/ripgrep";

const layer = LayerNode.compile(
  LayerNode.group([
    Agent.node, BackgroundJob.node, EventV2Bridge.node, Config.node,
    CrossSpawnSpawner.node, Session.node, SessionProjector.node,
    SessionRunState.node, SessionStatus.node, Truncate.node,
    ToolRegistry.node, RuntimeFlags.node, Skill.node,
    Discovery.node, FSUtil.node, Global.node, Database.node, Ripgrep.node
  ])
)

const t = testEffect(layer);

function stubOps(opts?: { onPrompt?: (input: any) => void; text?: string }): TaskPromptOps {
  return {
    cancel: () => Effect.void,
    resolvePromptParts: (template) => Effect.succeed([{ type: "text" as const, text: template }]),
    prompt: (input: any) =>
      Effect.sync(() => {
        opts?.onPrompt?.(input)
        const id = MessageID.ascending()
        return {
          info: { id, sessionID: input.sessionID, role: "assistant" },
          parts: [{ id: "part-1", messageID: id, type: "text", text: opts?.text ?? "done" }]
        } as any
      }),
    loop: (input: any) =>
      Effect.sync(() => {
        const id = MessageID.ascending()
        return {
          info: { id, sessionID: input.sessionID, role: "assistant" },
          parts: [{ id: "part-1", messageID: id, type: "text", text: opts?.text ?? "done" }]
        } as any
      }),
  }
}

import { MessageID } from "../src/session/schema";
import { ProviderV2 } from "@opencode-ai/core/provider";
import { ModelV2 } from "@opencode-ai/core/model";
import type { SessionV1 } from "@opencode-ai/core/v1/session";

const ref = {
  providerID: ProviderV2.ID.make("test"),
  modelID: ModelV2.ID.make("test-model"),
}

const seed = Effect.fn("TaskToolTest.seed")(function* (title = "Pinned") {
  const session = yield* Session.Service
  const chat = yield* session.create({ title })
  const user = yield* session.updateMessage({
    id: MessageID.ascending(),
    role: "user",
    sessionID: chat.id,
    agent: "build",
    model: ref,
    time: { created: Date.now() },
  })
  const assistant: SessionV1.Assistant = {
    id: MessageID.ascending(),
    role: "assistant",
    parentID: user.id,
    sessionID: chat.id,
    mode: "build",
    agent: "build",
    cost: 0,
    path: { cwd: "/tmp", root: "/tmp" },
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    modelID: ref.modelID,
    providerID: ref.providerID,
    variant: "xhigh",
    time: { created: Date.now() },
  }
  yield* session.updateMessage(assistant)
  return { chat, assistant }
})

t.instance("verify frontend subagent delegation", Effect.gen(function* () {
  const sessions = yield* Session.Service;
  const tool = yield* TaskTool;
  const def = yield* tool.init();

  const { chat, assistant } = yield* seed();
  
  console.log("=== EXECUTING TASK TOOL WITH subagent_type: 'frontend' ===");
  const result = yield* def.execute(
    {
      description: "build frontend",
      prompt: "add a login form component",
      subagent_type: "frontend",
      background: false,
    },
    {
      sessionID: chat.id,
      messageID: assistant.id,
      agent: "build",
      abort: new AbortController().signal,
      extra: { promptOps: stubOps({ text: "subagent frontend task completed" }) },
      messages: [],
      metadata: () => Effect.void,
      ask: () => Effect.void,
    }
  );

  console.log("=== TASK TOOL RETURNED ===");
  console.log(JSON.stringify(result, null, 2));
  
  // Also verify that the newly created subagent session has agent: "frontend"
  const childSession = yield* sessions.get(result.metadata.sessionId);
  console.log("=== SUBAGENT SESSION INFO ===");
  console.log("Subagent ID:", childSession?.id);
  console.log("Subagent Agent ID:", childSession?.agent);
  console.log("==========================================================");

  expect(childSession?.agent).toBe("frontend");
}), {
  config: () => require("../../../opencode.json")
}, 20000);
