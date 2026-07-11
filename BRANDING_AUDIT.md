# OpenCode Branding Audit (`BRANDING_AUDIT.md`)

This document lists all detected instances of the words **"opencode"**, **"OpenCode"**, and **"OpenCode Zen"** (along with related brand names and logo files) in the repository, organized under three distinct categories.

---

## 1. User-Facing Text

This category includes startup banners, window or terminal titles, help text, interactive prompts, and client/desktop interface translation labels.

### Terminal UI (TUI) & Console Logs
*   [`packages/tui/src/app.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/app.tsx)
    *   Line 457: `renderer.setTerminalTitle("OpenCode")` — Sets terminal title on launch
    *   Line 464: `renderer.setTerminalTitle("OpenCode")` — Resets terminal title on session end
    *   Line 1073: ``Successfully updated to OpenCode v${result.data.version}. Please restart the application.`` — Update completion message
*   [`packages/tui/src/attention.ts`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/attention.ts)
    *   Line 41: `const DEFAULT_TITLE = "opencode"`
    *   Line 48: `name: "OpenCode Default"` — TUI default audio notifications pack name
*   [`packages/tui/src/component/dialog-provider.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/component/dialog-provider.tsx)
    *   Line 374: `"OpenCode Zen gives you access to all the best coding models..."` — Service descriptions in connection dialog
    *   Line 385: `"OpenCode Go is a $10 per month subscription..."` — Provider options details
    *   Line 389: `"Go to https://opencode.ai/go and enable OpenCode Go"` — Subscription action instruction
*   [`packages/tui/src/feature-plugins/home/tips-view.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/feature-plugins/home/tips-view.tsx)
    *   Line 236: `"Create a plugin to prevent OpenCode from reading sensitive files"` — Hint tips
    *   Line 241: `"Run {highlight}opencode serve{/highlight} for headless API access to OpenCode"`
    *   Line 278: `"Use {highlight}/connect{/highlight} with OpenCode Zen for curated, tested models"`
*   [`packages/tui/src/feature-plugins/sidebar/footer.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/feature-plugins/sidebar/footer.tsx)
    *   Line 56: `"OpenCode includes free models so you can start immediately."` — Sidebar footer text
*   [`packages/tui/src/routes/session/permission.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/routes/session/permission.tsx)
    *   Line 144: `This will allow ... until OpenCode is restarted.` — Permission warning title
    *   Line 148: `This will allow the following patterns until OpenCode is restarted`
    *   Line 486: `Tell OpenCode what to do differently` — Interactive edit input prompt placeholder

### CLI Operations & Splash Screens
*   [`packages/opencode/src/cli/cmd/run/footer.permission.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/src/cli/cmd/run/footer.permission.tsx)
    *   Line 103: `placeholder="Tell OpenCode what to do differently"` — Edit prompt input label
    *   Line 287: `Tell OpenCode what to do differently` — Inline instructions label
*   [`packages/opencode/src/cli/cmd/run/footer.prompt.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/src/cli/cmd/run/footer.prompt.tsx)
    *   Line 420: `description: "close OpenCode"` — Slash command help text
*   [`packages/opencode/src/cli/cmd/run/permission.shared.ts`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/src/cli/cmd/run/permission.shared.ts)
    *   Lines 128, 132: `"until OpenCode is restarted."` — Permission guidelines description
*   [`packages/opencode/src/cli/cmd/run/splash.ts`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/src/cli/cmd/run/splash.ts)
    *   Line 197: `push(lines, body_left, top, "OpenCode", right, ...)` — Terminal splash screen header
*   [`packages/opencode/src/cli/cmd/uninstall.ts`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/src/cli/cmd/uninstall.ts)
    *   Line 58: `prompts.intro("Uninstall OpenCode")` — Interactive uninstall helper intro
    *   Line 232: `prompts.log.success("Thank you for using OpenCode!")` — Success footer

### Translations & i18n
*   **Web Client App:** [`packages/app/src/i18n/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/app/src/i18n)
    *   Arab translation (`ar.ts` line 128): `"يمنحك OpenCode Zen الوصول..."`
    *   English translation (`en.ts` line 140): `"OpenCode Zen gives you access..."`
    *   Spanish translation (`es.ts` line 140): `"OpenCode Zen te da acceso..."`
    *   Chinese translation (`zh.ts` line 132 & 165): `"使用 OpenCode Zen 或 API 密钥连接"` / `"OpenCode Zen 为你提供..."`
    *   *(Also referenced in all other translations: `br.ts`, `bs.ts`, `da.ts`, `de.ts`, `fr.ts`, `ja.ts`, `ko.ts`, `no.ts`, `pl.ts`, `ru.ts`, `th.ts`, `tr.ts`, `uk.ts`, `zht.ts`)*
*   **Management Console:** [`packages/console/app/src/i18n/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/console/app/src/i18n)
    *   English translation (`en.ts` line 90, 191, 196): `"opencode zen"` / `"OpenCode Zen | A curated set..."` / `"What is OpenCode Zen?"`
    *   *(Similar instances across all other translations in console-app translation files)*
*   **Desktop Shell UI:** [`packages/desktop/src/renderer/i18n/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/desktop/src/renderer/i18n)
    *   English translation (`en.ts` line 14, 19, 24): `"You are already using the latest version of OpenCode"`, `"Version {{version}} of OpenCode has been downloaded..."`, `"CLI installed to {{path}}... Restart your terminal to use the 'opencode' command."`
    *   *(Similar updater and path warning strings across all other translations in desktop translation files)*

### Desktop App Windows & Menus
*   [`packages/desktop/src/renderer/index.html`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/desktop/src/renderer/index.html)
    *   Line 6: `<title>OpenCode</title>` — Desktop shell browser main title
*   [`packages/desktop/resources/linux/opencode-desktop.desktop`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/desktop/resources/linux/opencode-desktop.desktop)
    *   Line 2: `Name=OpenCode` — Desktop entry file shortcut name
    *   Line 3: `Exec=/opt/OpenCode/ai.opencode.desktop %U` — Launcher path shortcut

---

## 2. Package Names & CLI Command Names

This category identifies names specified inside package metadata (`package.json`) and the actual command mappings exposed to shells.

### Monorepo package.json Names
*   **Repository Root:** [`package.json`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/package.json)
    *   Line 3: `"name": "opencode"`
*   **Primary CLI Package:** [`packages/opencode/package.json`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/package.json)
    *   Line 4: `"name": "opencode"`
*   **Desktop Package:** [`packages/desktop/package.json`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/desktop/package.json)
    *   Line 14: `"name": "OpenCode"` (under `build` configurations)
*   **Internal Monorepo Modules (Scoped Packages):**
    *   `packages/app/package.json`: `"name": "@opencode-ai/app"`
    *   `packages/cli/package.json`: `"name": "@opencode-ai/cli"`
    *   `packages/client/package.json`: `"name": "@opencode-ai/client"`
    *   `packages/codemode/package.json`: `"name": "@opencode-ai/codemode"`
    *   `packages/core/package.json`: `"name": "@opencode-ai/core"`
    *   `packages/desktop/package.json`: `"name": "@opencode-ai/desktop"`
    *   `packages/plugin/package.json`: `"name": "@opencode-ai/plugin"`
    *   `packages/protocol/package.json`: `"name": "@opencode-ai/protocol"`
    *   `packages/schema/package.json`: `"name": "@opencode-ai/schema"`
    *   `packages/sdk-next/package.json`: `"name": "@opencode-ai/sdk-next"`
    *   `packages/sdk/js/package.json`: `"name": "@opencode-ai/sdk"`
    *   `packages/server/package.json`: `"name": "@opencode-ai/server"`
    *   `packages/tui/package.json`: `"name": "@opencode-ai/tui"`
    *   `packages/ui/package.json`: `"name": "@opencode-ai/ui"`
    *   `packages/web/package.json`: `"name": "@opencode-ai/web"`

### Command Line Binaries & Command Mappings
*   [`packages/opencode/package.json`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/package.json)
    *   Line 19: `"opencode": "./bin/opencode"` — Primary terminal script executable mapping
*   [`packages/core/package.json`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/core/package.json)
    *   Line 16: `"opencode": "./bin/opencode"` — Internal execution script wrapper mapping

---

## 3. Logo & Icon Image Files

This category lists vector assets (SVGs), raster assets (PNGs), code-based ASCII representations, and styling/components associated with the visual brand.

### Brand Asset Archives & Direct Images
*   **Branding Archives:**
    *   [`packages/console/app/public/opencode-brand-assets.zip`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/console/app/public/opencode-brand-assets.zip)
    *   [`packages/console/app/src/asset/brand/opencode-brand-assets.zip`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/console/app/src/asset/brand/opencode-brand-assets.zip)
*   **Console Brand Logos & Wordmarks:** [`packages/console/app/src/asset/brand/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/console/app/src/asset/brand)
    *   `opencode-logo-dark.png` / `opencode-logo-dark.svg`
    *   `opencode-logo-light.png` / `opencode-logo-light.svg`
    *   `opencode-logo-dark-square.png` / `opencode-logo-dark-square.svg`
    *   `opencode-logo-light-square.png` / `opencode-logo-light-square.svg`
    *   `opencode-wordmark-dark.png` / `opencode-wordmark-dark.svg`
    *   `opencode-wordmark-light.png` / `opencode-wordmark-light.svg`
    *   `opencode-wordmark-simple-dark.png` / `opencode-wordmark-simple-dark.svg`
    *   `opencode-wordmark-simple-light.png` / `opencode-wordmark-simple-light.svg`
    *   *(Includes preview PNG variants `preview-opencode-...` of all wordmarks/logos)*
*   **Console App Lander Assets:** [`packages/console/app/src/asset/lander/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/console/app/src/asset/lander)
    *   `opencode-desktop-icon.png` — Desktop shortcut launcher icon
    *   `opencode-logo-dark.svg` / `opencode-logo-light.svg`
    *   `opencode-wordmark-dark.svg` / `opencode-wordmark-light.svg`
    *   `logo-ornate-dark.svg` / `logo-ornate-light.svg`
    *   `logo.svg`
*   **Transactional Emails Branding:** [`packages/console/mail/emails/templates/static/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/console/mail/emails/templates/static)
    *   `logo.png` — Email header brand logo
    *   `zen-logo.png` — Email header Zen brand logo
*   **Provider Icons (Shared UI Library):** [`packages/ui/src/assets/icons/provider/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/ui/src/assets/icons/provider)
    *   `opencode.svg` — OpenCode provider connection logo
    *   `opencode-go.svg` — OpenCode Go subscription connection logo
*   **Social & Lander Share Previews:**
    *   [`packages/ui/src/assets/images/social-share.png`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/ui/src/assets/images/social-share.png)
    *   [`packages/ui/src/assets/images/social-share-black.png`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/ui/src/assets/images/social-share-black.png)
    *   [`packages/ui/src/assets/images/social-share-zen.png`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/ui/src/assets/images/social-share-zen.png)
*   **Web Lander Logos:** [`packages/web/src/assets/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/web/src/assets)
    *   `logo-dark.svg` / `logo-light.svg`
    *   `logo-ornate-dark.svg` / `logo-ornate-light.svg`
*   **Telemetry Panel Branding:** [`packages/stats/app/src/asset/`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/stats/app/src/asset)
    *   `logo-ornate-dark.svg` / `logo-ornate-light.svg`

### ASCII Art Logos & Code components
*   **TUI ASCII Art Banners:**
    *   [`packages/tui/src/logo.ts`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/logo.ts) — Stores ASCII text segments for "OpenCode" terminal banners (Lines 1-4)
    *   [`packages/opencode/src/cli/logo.ts`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/opencode/src/cli/logo.ts) — Re-exports TUI ASCII banner
*   **SolidJS Logo Primitives:**
    *   [`packages/tui/src/component/logo.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/tui/src/component/logo.tsx) — Component rendering the ASCII blocks inside TUI
    *   [`packages/ui/src/components/logo.tsx`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/ui/src/components/logo.tsx) — Render component for web pages
    *   [`packages/ui/src/components/logo.css`](file:///home/n0face/Documents/Vscode%20projects/Am-Project/packages/ui/src/components/logo.css) — CSS styles matching the Web logo component
