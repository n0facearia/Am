import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { AppNodeBuilder } from "@opencode-ai/core/effect/app-node-builder"
import { httpClient } from "@opencode-ai/core/effect/app-node-platform"
import { Effect, Layer, Schema, Context, Stream } from "effect"
import { serviceUse } from "@opencode-ai/core/effect/service-use"
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http"
import { withTransientReadRetry } from "@/util/effect-http-client"
import { errorMessage } from "@/util/error"
import { ChildProcess } from "effect/unstable/process"
import { AppProcess } from "@opencode-ai/core/process"
import path from "path"
import { makeRuntime } from "@opencode-ai/core/effect/runtime"
import semver from "semver"
import { InstallationChannel, InstallationVersion } from "@opencode-ai/core/installation/version"
import { NpmConfig } from "@opencode-ai/core/npm-config"
import { InstallationEvent } from "@opencode-ai/schema/installation-event"

export type Method = "curl" | "npm" | "yarn" | "pnpm" | "bun" | "brew" | "scoop" | "choco" | "unknown"

export type ReleaseType = "patch" | "minor" | "major"

export const Event = InstallationEvent

export function getReleaseType(current: string, latest: string): ReleaseType {
  const currMajor = semver.major(current)
  const currMinor = semver.minor(current)
  const newMajor = semver.major(latest)
  const newMinor = semver.minor(latest)

  if (newMajor > currMajor) return "major"
  if (newMinor > currMinor) return "minor"
  return "patch"
}

export const Info = Schema.Struct({
  version: Schema.String,
  latest: Schema.String,
}).annotate({ identifier: "InstallationInfo" })
export type Info = Schema.Schema.Type<typeof Info>

export function userAgent(client = "cli") {
  return `opencode/${InstallationChannel}/${InstallationVersion}/${client}`
}

export const USER_AGENT = userAgent()

export function isPreview() {
  return InstallationChannel !== "latest"
}

export function isLocal() {
  return InstallationChannel === "local"
}

export class UpgradeFailedError extends Schema.TaggedErrorClass<UpgradeFailedError>()("UpgradeFailedError", {
  stderr: Schema.String,
}) {
  override get message() {
    return this.stderr
  }
}

// Response schemas for external version APIs
const GitHubRelease = Schema.Struct({
  tag_name: Schema.String,
  draft: Schema.optional(Schema.Boolean),
  prerelease: Schema.optional(Schema.Boolean),
})
const NpmPackage = Schema.Struct({ version: Schema.String })
const BrewFormula = Schema.Struct({ versions: Schema.Struct({ stable: Schema.String }) })
const BrewInfoV2 = Schema.Struct({
  formulae: Schema.Array(Schema.Struct({ versions: Schema.Struct({ stable: Schema.String }) })),
})
const ChocoPackage = Schema.Struct({
  d: Schema.Struct({ results: Schema.Array(Schema.Struct({ Version: Schema.String })) }),
})
const ScoopManifest = NpmPackage

export interface Interface {
  readonly info: () => Effect.Effect<Info>
  readonly method: () => Effect.Effect<Method>
  readonly latest: (method?: Method) => Effect.Effect<string>
  readonly upgrade: (method: Method, target: string) => Effect.Effect<void, UpgradeFailedError>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/Installation") {}

export const use = serviceUse(Service)

const layer: Layer.Layer<Service, never, HttpClient.HttpClient | AppProcess.Service> = Layer.effect(
  Service,
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const httpOk = HttpClient.filterStatusOk(withTransientReadRetry(http))
    const appProcess = yield* AppProcess.Service

    const text = Effect.fnUntraced(
      function* (cmd: string[], opts?: { cwd?: string; env?: Record<string, string> }) {
        const result = yield* appProcess.run(
          ChildProcess.make(cmd[0], cmd.slice(1), {
            cwd: opts?.cwd,
            env: opts?.env,
            extendEnv: true,
          }),
        )
        return result.stdout.toString("utf8")
      },
      Effect.catch(() => Effect.succeed("")),
    )

    const run = Effect.fnUntraced(
      function* (cmd: string[], opts?: { cwd?: string; env?: Record<string, string> }) {
        const result = yield* appProcess.run(
          ChildProcess.make(cmd[0], cmd.slice(1), {
            cwd: opts?.cwd,
            env: opts?.env,
            extendEnv: true,
          }),
        )
        return {
          code: result.exitCode,
          stdout: result.stdout.toString("utf8"),
          stderr: result.stderr.toString("utf8"),
        }
      },
      Effect.catch((err) => Effect.succeed({ code: 1, stdout: "", stderr: errorMessage(err) })),
    )

    const getBrewFormula = Effect.fnUntraced(function* () {
      const tapFormula = yield* text(["brew", "list", "--formula", "n0facearia/tap/am"])
      if (tapFormula.includes("am")) return "n0facearia/tap/am"
      const coreFormula = yield* text(["brew", "list", "--formula", "am"])
      if (coreFormula.includes("am")) return "am"
      return "am"
    })

    const upgradeFailure = (method: Method, result?: { code: number; stdout: string; stderr: string }) => {
      if (method === "choco") return "not running from an elevated command shell"
      if (result) return `Upgrade failed for ${method} (exit code ${result.code}).`
      return `Upgrade failed for ${method}.`
    }

    const upgradeScriptShell = Effect.fnUntraced(function* () {
      const bashVersion = yield* text(["bash", "--version"])
      if (bashVersion) return "bash"
      return "sh"
    })

    const upgradeBinary = Effect.fnUntraced(
      function* (m: Method, target: string) {
        const response = yield* httpOk.execute(
          HttpClientRequest.get("https://api.github.com/repos/n0facearia/Am/releases").pipe(
            HttpClientRequest.acceptJson,
          ),
        )
        const responseText = yield* response.text
        let release: any = null
        try {
          const parsed = JSON.parse(responseText)
          const list = Array.isArray(parsed) ? parsed : [parsed]
          release =
            list.find((r: any) => r.tag_name === target || r.tag_name === `v${target}`) ||
            list.find((r: any) => !r.draft)
        } catch {
          // ignore
        }

        if (!release || !Array.isArray(release.assets)) {
          if (responseText.includes("install") || responseText.includes("#!")) {
            const bodyBytes = new TextEncoder().encode(responseText)
            const shell = yield* upgradeScriptShell()
            const scriptResult = yield* appProcess.run(
              ChildProcess.make(shell, [], {
                stdin: Stream.make(bodyBytes),
                env: { VERSION: target },
                extendEnv: true,
              }),
            )
            return {
              code: scriptResult.exitCode,
              stdout: scriptResult.stdout.toString("utf8"),
              stderr: scriptResult.stderr.toString("utf8"),
            }
          }
          return { code: 1, stdout: "", stderr: upgradeFailure(m) }
        }

        const targetOS = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "darwin" : "linux"
        const targetArch = process.arch === "arm64" ? "arm64" : "x64"
        const targetExt = process.platform === "linux" ? ".tar.gz" : ".zip"

        const asset =
          release.assets.find(
            (a: any) =>
              typeof a.name === "string" &&
              a.name.startsWith(`am-cli-${targetOS}-${targetArch}`) &&
              a.name.endsWith(targetExt),
          ) ||
          release.assets.find(
            (a: any) => typeof a.name === "string" && a.name.includes(`am-cli`) && a.name.endsWith(targetExt),
          )

        if (!asset || !asset.browser_download_url) {
          return { code: 1, stdout: "", stderr: `No matching release asset found for platform ${process.platform} ${process.arch}` }
        }

        const assetResponse = yield* httpOk.execute(HttpClientRequest.get(asset.browser_download_url))
        const bodyBytes = yield* assetResponse.arrayBuffer

        const fs = yield* Effect.promise(() => import("fs/promises"))
        const tmp = yield* Effect.promise(() => import("os")).pipe(Effect.map((os) => os.tmpdir()))
        const tmpDir = path.join(tmp, `am-update-${Date.now()}`)
        yield* Effect.promise(() => fs.mkdir(tmpDir, { recursive: true }))

        const archivePath = path.join(tmpDir, asset.name)
        yield* Effect.promise(() => fs.writeFile(archivePath, Buffer.from(bodyBytes)))

        let extractResult: { code: number; stdout: string; stderr: string }
        if (asset.name.endsWith(".tar.gz")) {
          extractResult = yield* run(["tar", "-xzf", archivePath, "-C", tmpDir])
        } else {
          if (process.platform === "win32") {
            extractResult = yield* run([
              "powershell",
              "-Command",
              `Expand-Archive -Path '${archivePath}' -DestinationPath '${tmpDir}' -Force`,
            ])
          } else {
            extractResult = yield* run(["unzip", "-o", archivePath, "-d", tmpDir])
          }
        }

        if (extractResult.code !== 0) {
          yield* Effect.promise(() => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}))
          return extractResult
        }

        const exeName = process.platform === "win32" ? "am.exe" : "am"
        const findFile = async (dir: string): Promise<string | null> => {
          const entries = await fs.readdir(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isFile() && entry.name === exeName) return fullPath
            if (entry.isDirectory()) {
              const res = await findFile(fullPath)
              if (res) return res
            }
          }
          return null
        }

        const foundExe = yield* Effect.promise(() => findFile(tmpDir))

        if (!foundExe) {
          yield* Effect.promise(() => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}))
          return { code: 1, stdout: "", stderr: `Extracted archive did not contain ${exeName}` }
        }

        const destPath = process.execPath
        const tmpDestPath = `${destPath}.tmp-${Date.now()}`

        try {
          yield* Effect.promise(async () => {
            await fs.copyFile(foundExe, tmpDestPath)
            if (process.platform !== "win32") {
              await fs.chmod(tmpDestPath, 0o755)
            }
            await fs.rename(tmpDestPath, destPath)
          })
        } catch (e) {
          yield* Effect.promise(() => fs.rm(tmpDestPath, { force: true }).catch(() => {}))
          yield* Effect.promise(() => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}))
          return { code: 1, stdout: "", stderr: `Failed to replace binary at ${destPath}: ${errorMessage(e)}` }
        }

        yield* Effect.promise(() => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}))

        return { code: 0, stdout: "Successfully updated AM binary", stderr: "" }
      },
      Effect.mapError(() => new UpgradeFailedError({ stderr: upgradeFailure("curl") })),
    )

    const result: Interface = {
      info: Effect.fn("Installation.info")(function* () {
        return {
          version: InstallationVersion,
          latest: yield* result.latest(),
        }
      }),
      method: Effect.fn("Installation.method")(function* () {
        if (process.execPath.includes(path.join(".opencode", "bin"))) return "curl" as Method
        if (process.execPath.includes(path.join(".am", "bin"))) return "curl" as Method
        if (process.execPath.includes(path.join(".local", "bin"))) return "curl" as Method
        const exec = process.execPath.toLowerCase()

        const checks: Array<{ name: Method; command: () => Effect.Effect<string> }> = [
          { name: "npm", command: () => text(["npm", "list", "-g", "--depth=0"]) },
          { name: "yarn", command: () => text(["yarn", "global", "list"]) },
          { name: "pnpm", command: () => text(["pnpm", "list", "-g", "--depth=0"]) },
          { name: "bun", command: () => text(["bun", "pm", "ls", "-g"]) },
          { name: "brew", command: () => text(["brew", "list", "--formula", "am"]) },
          { name: "scoop", command: () => text(["scoop", "list", "am"]) },
          { name: "choco", command: () => text(["choco", "list", "--limit-output", "am"]) },
        ]

        checks.sort((a, b) => {
          const aMatches = exec.includes(a.name)
          const bMatches = exec.includes(b.name)
          if (aMatches && !bMatches) return -1
          if (!aMatches && bMatches) return 1
          return 0
        })

        for (const check of checks) {
          const output = yield* check.command()
          const installedName = check.name === "brew" || check.name === "choco" || check.name === "scoop" ? "am" : "am"
          if (output.includes(installedName)) {
            return check.name
          }
        }

        return "unknown" as Method
      }),
      latest: Effect.fn("Installation.latest")(function* (installMethod?: Method) {
        const detectedMethod = installMethod || (yield* result.method())

        if (detectedMethod === "brew") {
          const formula = yield* getBrewFormula()
          if (formula.includes("/")) {
            const infoJson = yield* text(["brew", "info", "--json=v2", formula])
            if (infoJson) {
              try {
                const parsed = JSON.parse(infoJson)
                if (parsed?.formulae?.[0]?.versions?.stable) {
                  return parsed.formulae[0].versions.stable
                }
              } catch {
                // ignore
              }
            }
          }
        }

        const response = yield* httpOk.execute(
          HttpClientRequest.get("https://api.github.com/repos/n0facearia/Am/releases").pipe(
            HttpClientRequest.acceptJson,
          ),
        )
        const responseText = yield* response.text

        if (responseText) {
          try {
            const parsed = JSON.parse(responseText)
            if (parsed?.versions?.stable) {
              return parsed.versions.stable
            }
            const list = Array.isArray(parsed) ? parsed : [parsed]
            const latestRelease = list.find((r: any) => !r.draft && r.tag_name)
            if (latestRelease && typeof latestRelease.tag_name === "string") {
              return latestRelease.tag_name.replace(/^v/, "")
            }
          } catch {
            // ignore
          }
        }

        return InstallationVersion
      }, Effect.orDie),
      upgrade: Effect.fn("Installation.upgrade")(function* (m: Method, target: string) {
        let upgradeResult: { code: number; stdout: string; stderr: string } | undefined
        switch (m) {
          case "curl":
          case "unknown":
            upgradeResult = yield* upgradeBinary(m, target)
            break
          case "npm":
            upgradeResult = yield* run(["npm", "install", "-g", `am@${target}`])
            break
          case "pnpm":
            upgradeResult = yield* run(["pnpm", "install", "-g", `am@${target}`])
            break
          case "bun":
            upgradeResult = yield* run(["bun", "install", "-g", `am@${target}`])
            break
          case "brew": {
            const formula = yield* getBrewFormula()
            const env = { HOMEBREW_NO_AUTO_UPDATE: "1" }
            upgradeResult = yield* run(["brew", "upgrade", formula], { env })
            break
          }
          default:
            upgradeResult = yield* upgradeBinary(m, target)
            break
        }
        if (!upgradeResult || upgradeResult.code !== 0) {
          return yield* new UpgradeFailedError({ stderr: upgradeFailure(m, upgradeResult) })
        }
        yield* Effect.logInfo("upgraded", {
          method: m,
          target,
          stdout: upgradeResult.stdout,
          stderr: upgradeResult.stderr,
        })
      }),
    }

    return Service.of(result)
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [httpClient, AppProcess.node] })

const { runPromise } = makeRuntime(Service, AppNodeBuilder.build(node))

export const latest = (...args: Parameters<Interface["latest"]>) => runPromise((s) => s.latest(...args))
export const method = () => runPromise((s) => s.method())
export const upgrade = (...args: Parameters<Interface["upgrade"]>) => runPromise((s) => s.upgrade(...args))

export * as Installation from "."
