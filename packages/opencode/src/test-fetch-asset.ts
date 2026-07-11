import { ToolRegistry } from "./tool/registry"
import { bootstrap } from "./cli/bootstrap"
import { Effect } from "effect"

await bootstrap(process.cwd(), async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const registry = yield* ToolRegistry.Service
      const tools = yield* registry.all()
      const fetchAsset = tools.find((t) => t.id === "fetch-asset")
      if (!fetchAsset) {
        console.error("fetch-asset tool not found in registry!")
        return
      }

      console.log("--- TEST 1: Approved Domain (lucide.dev) ---")
      try {
        const res1 = yield* fetchAsset.execute(
          { url: "https://lucide.dev/package.json" },
          {
            sessionID: "test-session",
            messageID: "test-message",
            agent: "test-agent",
            abort: new AbortController().signal,
            messages: [],
            metadata: () => Effect.void,
            ask: () => Effect.void,
          }
        )
        console.log("Result 1 Output:", res1.output)
        console.log("Result 1 Metadata:", res1.metadata)
      } catch (e: any) {
        console.error("Test 1 Failed:", e.message)
      }

      console.log("\n--- TEST 2: Refused Domain (google.com) ---")
      try {
        const res2 = yield* fetchAsset.execute(
          { url: "https://google.com/" },
          {
            sessionID: "test-session",
            messageID: "test-message",
            agent: "test-agent",
            abort: new AbortController().signal,
            messages: [],
            metadata: () => Effect.void,
            ask: () => Effect.void,
          }
        )
        console.log("Result 2 Output:", res2.output)
      } catch (e: any) {
        console.log("Test 2 Expected Failure (Refused):", e.message)
      }
    })
  )
})
