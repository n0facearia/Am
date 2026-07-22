import { $ } from "bun"
import fs from "fs"
import path from "path"
import { resolveChannel } from "./utils"

const arg = process.argv[2]
const channel = arg === "dev" || arg === "beta" || arg === "prod" ? arg : resolveChannel("prod")

const src = `./icons/${channel}`
const dest = "resources/icons"

await $`rm -rf ${dest}`
await $`cp -R ${src} ${dest}`

const iconPng = path.join(dest, "icon.png")
if (fs.existsSync(iconPng)) {
  fs.copyFileSync(iconPng, path.join(dest, "512x512.png"))
  fs.copyFileSync(iconPng, path.join(dest, "256x256.png"))
  fs.copyFileSync(iconPng, path.join(dest, "am.desktop.png"))
  fs.copyFileSync(iconPng, path.join(dest, "am-desktop.png"))
  fs.copyFileSync(iconPng, path.join(dest, "am.desktop.dev.png"))
}

console.log(`Copied ${channel} icons from ${src} to ${dest}`)
