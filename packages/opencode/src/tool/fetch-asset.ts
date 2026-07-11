import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./fetch-asset.txt"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { InstanceState } from "@/effect/instance-state"

const APPROVED_DOMAINS = new Set([
  "ui.shadcn.com",
  "ui.aceternity.com",
  "magicui.design",
  "radix-ui.com",
  "lucide.dev",
  "heroicons.com",
  "fonts.google.com",
  "undraw.co",
  "api.unsplash.com"
])

export const Parameters = Schema.Struct({
  url: Schema.String.annotate({ description: "The URL of the asset to fetch" }),
})

export const FetchAssetTool = Tool.define(
  "fetch-asset",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          // Parse domain
          let parsedUrl: URL
          try {
            parsedUrl = new URL(params.url)
          } catch (e) {
            throw new Error("Invalid URL format")
          }

          const hostname = parsedUrl.hostname.toLowerCase()
          if (!APPROVED_DOMAINS.has(hostname)) {
            throw new Error(`Domain ${hostname} is not in the pre-approved list. Refusing request.`)
          }

          // Ask permission
          yield* ctx.ask({
            permission: "fetch-asset",
            patterns: [params.url],
            always: ["*"],
            metadata: {
              url: params.url,
            },
          })

          const instance = yield* InstanceState.context
          const cacheDir = path.resolve(instance.directory, ".am", "asset-cache")
          const cacheKey = crypto.createHash("sha256").update(params.url).digest("hex")
          const cacheFilePath = path.join(cacheDir, cacheKey)
          const cacheMetaPath = path.join(cacheDir, `${cacheKey}.json`)

          // Attempt to fetch inside an Effect.promise wrapper to resolve TypeScript async/await error
          return yield* Effect.promise(() => (async () => {
            try {
              console.log(`[Fetch Asset] Fetching ${params.url}...`)
              const response = await fetch(params.url, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
                }
              })

              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
              }

              const arrayBuffer = await response.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              const contentType = response.headers.get("content-type") || "application/octet-stream"

              // Save to cache
              if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true })
              }
              fs.writeFileSync(cacheFilePath, buffer)
              fs.writeFileSync(cacheMetaPath, JSON.stringify({
                url: params.url,
                contentType,
                time: Date.now()
              }, null, 2))

              console.log(`[Fetch Asset] Successfully fetched and cached: ${params.url}`)

              return {
                title: `Fetched asset: ${params.url}`,
                output: `Asset fetched successfully (${contentType}, ${buffer.byteLength} bytes). Cached in .am/asset-cache/.`,
                metadata: {
                  url: params.url,
                  contentType,
                  size: buffer.byteLength,
                  source: "network"
                }
              }
            } catch (fetchErr: any) {
              console.warn(`[Fetch Asset] Fetch failed for ${params.url}: ${fetchErr.message}. Attempting cache fallback...`)

              // Fallback to cache
              if (fs.existsSync(cacheFilePath) && fs.existsSync(cacheMetaPath)) {
                const meta = JSON.parse(fs.readFileSync(cacheMetaPath, "utf8"))
                const buffer = fs.readFileSync(cacheFilePath)
                return {
                  title: `Fetched asset (cached): ${params.url}`,
                  output: `Asset retrieved from local cache (${meta.contentType}, ${buffer.byteLength} bytes).`,
                  metadata: {
                    url: params.url,
                    contentType: meta.contentType,
                    size: buffer.byteLength,
                    source: "cache"
                  }
                }
              }

              throw new Error(`Failed to fetch asset from network and no cached copy found. Original error: ${fetchErr.message}`)
            }
          })())
        }).pipe(Effect.orDie),
    }
  }),
)
