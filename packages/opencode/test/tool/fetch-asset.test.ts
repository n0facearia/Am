import { describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { httpClient } from "@opencode-ai/core/effect/app-node-platform"
import { Effect, Layer } from "effect"
import { FetchHttpClient, HttpClient } from "effect/unstable/http"
import { Agent } from "../../src/agent/agent"
import { Truncate } from "@/tool/truncate"
import { FetchAssetTool } from "../../src/tool/fetch-asset"
import { SessionID, MessageID } from "../../src/session/schema"
import { testEffect } from "../lib/effect"

const it = testEffect(
  LayerNode.compile(LayerNode.group([httpClient, Truncate.node, Agent.node]), [
    [httpClient, FetchHttpClient.layer as Layer.Layer<HttpClient.HttpClient>],
  ]),
)

const ctx = {
  sessionID: SessionID.make("ses_test"),
  messageID: MessageID.make("msg_message"),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => Effect.void,
  ask: () => Effect.void,
}

function exec(args: Record<string, unknown>) {
  return Effect.gen(function* () {
    const info = yield* FetchAssetTool
    const tool = yield* info.init()
    return yield* tool.execute(args as any, ctx as any)
  })
}

describe("tool.fetch-asset", () => {
  it.instance("fetches from approved domain", () =>
    Effect.gen(function* () {
      const result = yield* exec({ url: "https://lucide.dev/" })
      console.log("--- TEST 1: Approved Domain (lucide.dev) ---")
      console.log("Output:", result.output)
      console.log("Metadata:", JSON.stringify(result.metadata))
      expect(result.metadata.source).toBe("network")
    })
  )

  it.instance("refuses unlisted domain", () =>
    Effect.gen(function* () {
      console.log("\n--- TEST 2: Refused Domain (google.com) ---")
      const exit = yield* Effect.exit(exec({ url: "https://google.com/" }))
      expect(exit._tag).toBe("Failure")
      if (exit._tag === "Failure") {
        const errorMsg = String(exit.cause)
        console.log("Expected Refusal Error:", errorMsg)
        expect(errorMsg).toContain("not in the pre-approved list")
      }
    })
  )
})
