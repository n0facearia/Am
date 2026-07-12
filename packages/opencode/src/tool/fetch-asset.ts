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
  "api.unsplash.com",
  "raw.githubusercontent.com",
  "getdesign.md",
])

/** Map of approved domains to their asset category for cache organization. */
const DOMAIN_CATEGORY: Record<string, string> = {
  "ui.shadcn.com": "component",
  "ui.aceternity.com": "component",
  "magicui.design": "component",
  "radix-ui.com": "component",
  "lucide.dev": "icon",
  "heroicons.com": "icon",
  "fonts.google.com": "font",
  "undraw.co": "illustration",
  "api.unsplash.com": "illustration",
  "raw.githubusercontent.com": "reference",
  "getdesign.md": "reference",
}

interface CachedAssetMeta {
  readonly url: string
  readonly contentType: string
  readonly time: number
}

interface FetchResultMetadata {
  url: string
  category: string
  contentType: any
  size: number
  source: string
  servedUrl?: string
}

export const Parameters = Schema.Struct({
  url: Schema.String.annotate({ description: "The URL of the asset to fetch" }),
})

export const FetchAssetTool = Tool.define<typeof Parameters, FetchResultMetadata, never>(
  "fetch-asset",
  Effect.gen(function* () {
    const def: Tool.DefWithoutID<typeof Parameters, FetchResultMetadata> = {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<FetchResultMetadata>) =>
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
          const category = DOMAIN_CATEGORY[hostname] ?? "unknown"
          const cacheDir = path.resolve(instance.directory, ".am", "asset-cache")
          const categoryDir = path.join(cacheDir, category)
          const cacheKey = crypto.createHash("sha256").update(params.url).digest("hex")
          const cacheFilePath = path.join(categoryDir, cacheKey)
          const cacheMetaPath = path.join(categoryDir, `${cacheKey}.json`)

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
              if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true })
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
                output: `Asset fetched successfully (${contentType}, ${buffer.byteLength} bytes). Cached in .am/asset-cache/${category}/.`,
                metadata: {
                  url: params.url,
                  category,
                  contentType,
                  size: buffer.byteLength,
                  source: "network",
                  servedUrl: undefined,
                }
              }
            } catch (fetchErr: any) {
              console.warn(`[Fetch Asset] Fetch failed for ${params.url}: ${fetchErr.message}. Attempting cache fallback...`)

              // Phase 1: exact SHA-256 cache hit
              if (fs.existsSync(cacheFilePath) && fs.existsSync(cacheMetaPath)) {
                const meta = JSON.parse(fs.readFileSync(cacheMetaPath, "utf8"))
                const buffer = fs.readFileSync(cacheFilePath)
                return {
                  title: `Fetched asset (cached): ${params.url}`,
                  output: `Asset retrieved from local cache (${meta.contentType}, ${buffer.byteLength} bytes).`,
                  metadata: {
                    url: params.url,
                    category,
                    contentType: meta.contentType,
                    size: buffer.byteLength,
                    source: "cache",
                    servedUrl: undefined,
                  }
                }
              }

              // Phase 2: graceful local cache query — scan for best match by category
              if (fs.existsSync(categoryDir)) {
                const entries = fs.readdirSync(categoryDir, { withFileTypes: true })
                const metaFiles = entries
                  .filter((e) => e.isFile() && e.name.endsWith(".json"))
                  .map((e) => {
                    const metaPath = path.join(categoryDir, e.name)
                    try {
                      return { name: e.name, meta: JSON.parse(fs.readFileSync(metaPath, "utf8")) as CachedAssetMeta }
                    } catch { return null }
                  })
                  .filter(<T>(m: T | null): m is T => m !== null)
                  .sort((a, b) => b.meta.time - a.meta.time)

                if (metaFiles.length > 0) {
                  const best = metaFiles[0]
                  const dataPath = path.join(categoryDir, best.name.replace(".json", ""))
                  if (fs.existsSync(dataPath)) {
                    const buffer = fs.readFileSync(dataPath)
                    return {
                      title: `Fetched asset (closest cache match): ${params.url} → ${best.meta.url}`,
                      output:
                        `Network fetch failed for ${params.url}. ` +
                        `Serving closest cached ${category} asset: ${best.meta.url} (${best.meta.contentType}, ${buffer.byteLength} bytes). ` +
                        `Cached at ${new Date(best.meta.time).toISOString()}.`,
                      metadata: {
                        url: params.url,
                        servedUrl: best.meta.url,
                        contentType: best.meta.contentType,
                        size: buffer.byteLength,
                        source: "cache-fallback-query",
                        category,
                      },
                    }
                  }
                }
              }

              // Phase 3: no match at all — list available cache inventory
              const inventory: string[] = []
              const listCache = (dir: string, prefix: string) => {
                if (!fs.existsSync(dir)) return
                for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                  if (e.isDirectory()) {
                    listCache(path.join(dir, e.name), `${prefix}${e.name}/`)
                  } else if (e.isFile() && !e.name.endsWith(".json") && !e.name.endsWith(".md")) {
                    inventory.push(`${prefix}${e.name}`)
                  }
                }
              }
              listCache(cacheDir, "")
              const inventoryMsg = inventory.length > 0
                ? `Available cached assets:\n${inventory.map((f) => `  .am/asset-cache/${f}`).join("\n")}`
                : "No cached assets available."

              throw new Error(
                `Failed to fetch asset from network and no cached copy found. ` +
                `Original error: ${fetchErr.message}\n\n${inventoryMsg}`,
              )
            }
          })())
        }).pipe(Effect.orDie),
    }
    return def
  }),
)
