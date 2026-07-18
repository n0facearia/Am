import { expect, test } from "bun:test"
import type { Configuration } from "electron-builder"

const legacyDesktopEntry = "resources/linux/am-desktop.desktop"
const legacyOpenCodeDesktopEntry = "resources/linux/opencode-desktop.desktop"

const channels = [
  { channel: "dev", appId: "am.desktop.dev" },
  { channel: "beta", appId: "am.desktop.beta" },
  { channel: "prod", appId: "am.desktop" },
] as const

for (const channel of channels) {
  test(`uses one Linux desktop identity for ${channel.channel}`, async () => {
    const previous = process.env.OPENCODE_CHANNEL
    process.env.OPENCODE_CHANNEL = channel.channel

    const module = await import(`./electron-builder.config.ts?channel=${channel.channel}`)
    const config = module.default as Configuration

    if (previous === undefined) delete process.env.OPENCODE_CHANNEL
    else process.env.OPENCODE_CHANNEL = previous

    expect(config.appId).toBe(channel.appId)
    expect(config.extraMetadata?.desktopName).toBe(`${channel.appId}.desktop`)
    expect(config.linux?.executableName).toBe(channel.appId)
    expect(config.linux?.desktop?.entry?.StartupWMClass).toBe(channel.appId)
  })
}

test("keeps hidden prod launchers for old Linux pins", async () => {
  const previous = process.env.OPENCODE_CHANNEL
  process.env.OPENCODE_CHANNEL = "prod"

  const module = await import("./electron-builder.config.ts?compat=prod")
  const config = module.default as Configuration

  if (previous === undefined) delete process.env.OPENCODE_CHANNEL
  else process.env.OPENCODE_CHANNEL = previous

  // AM legacy launcher
  expect(config.deb?.fpm?.[0]).toEndWith(`${legacyDesktopEntry}=/usr/share/applications/am-desktop.desktop`)
  expect(config.rpm?.fpm?.[0]).toEndWith(`${legacyDesktopEntry}=/usr/share/applications/am-desktop.desktop`)

  const desktop = await Bun.file(legacyDesktopEntry).text()
  expect(desktop).toContain("Exec=/opt/AM/am.desktop %U")
  expect(desktop).toContain("Icon=am.desktop")
  expect(desktop).toContain("StartupWMClass=am.desktop")
  expect(desktop).toContain("NoDisplay=true")

  // OpenCode legacy launcher (backward compat for existing pins)
  expect(config.deb?.fpm?.[1]).toEndWith(`${legacyOpenCodeDesktopEntry}=/usr/share/applications/opencode-desktop.desktop`)
  expect(config.rpm?.fpm?.[1]).toEndWith(`${legacyOpenCodeDesktopEntry}=/usr/share/applications/opencode-desktop.desktop`)

  const openCodeDesktop = await Bun.file(legacyOpenCodeDesktopEntry).text()
  expect(openCodeDesktop).toContain("Exec=/opt/OpenCode/ai.opencode.desktop %U")
  expect(openCodeDesktop).toContain("Icon=ai.opencode.desktop")
  expect(openCodeDesktop).toContain("StartupWMClass=ai.opencode.desktop")
  expect(openCodeDesktop).toContain("NoDisplay=true")
})
