# Desktop Application Map (`DESKTOP_MAP.md`)

## 1. Source Folder

```
packages/desktop/
```

This is the sole package containing the desktop shell application wrapper.

### Directory Layout

```
packages/desktop/
├── icons/                         # Per-channel application icons
│   ├── dev/                       #   Dev channel icons (icns, ico, png, dock.png)
│   ├── beta/                      #   Beta channel icons
│   └── prod/                      #   Production channel icons
├── resources/
│   ├── entitlements.plist         # macOS code-signing entitlements
│   └── linux/                     # Linux .desktop entries
├── scripts/                       # Build/publish helper scripts
│   ├── predev.ts                  #   Pre-dev hook (copies assets)
│   ├── prebuild.ts                #   Pre-build hook
│   ├── copy-icons.ts              #   Copies channel-specific icons
│   ├── copy-bundles.ts            #   Copies WASM / binary bundles
│   ├── copy-metainfo.ts           #   Linux metainfo
│   └── finalize-*.ts              #   Release metadata finalizers
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               #   Main entry point (app lifecycle)
│   │   ├── sidecar.ts             #   Headless backend process entry
│   │   ├── server.ts              #   Sidecar spawner & health checks
│   │   ├── windows.ts             #   BrowserWindow creation & management
│   │   ├── ipc.ts                 #   IPC handler registration
│   │   ├── menu.ts                #   Native menu bar
│   │   ├── store.ts               #   electron-store persistence
│   │   ├── updater*.ts            #   Auto-update (electron-updater)
│   │   ├── logging.ts             #   Logging (electron-log)
│   │   ├── constants.ts           #   Channel & feature flags
│   │   ├── shell-env.ts           #   Shell environment capture
│   │   └── wsl/                   #   WSL server management (Windows)
│   ├── preload/
│   │   ├── index.ts               #   contextBridge API exposure
│   │   └── types.ts               #   Shared type definitions
│   └── renderer/
│       ├── index.html             #   HTML shell
│       ├── index.tsx              #   SolidJS app mount
│       ├── styles.css             #   Global styles
│       ├── initialization.ts      #   Sidecar credential fetching
│       ├── onboarding.tsx         #   First-launch onboarding
│       ├── webview-zoom.ts        #   Pinch zoom handling
│       └── wsl/                   #   WSL connection UI logic
├── package.json
├── electron.vite.config.ts
├── electron-builder.config.ts
├── electron-builder.config.test.ts
└── tsconfig.json
```

---

## 2. Platform Framework

**Electron** (v42.3.3), built via **electron-vite** (v5) and packaged via **electron-builder** (v26.15.2).

### Entry Points

| Role | Source | Build Output | Description |
|------|--------|-------------|-------------|
| Main process | `src/main/index.ts` | `out/main/index.js` | App lifecycle, window management, sidecar orchestration, IPC registration |
| Sidecar (backend) | `src/main/sidecar.ts` | `out/main/sidecar.js` | Headless HTTP server process; imports `@opencode-ai/server` via the virtual module `virtual:opencode-server` |
| Preload | `src/preload/index.ts` | `out/preload/index.js` | Secure bridge: exposes `window.api` via `contextBridge.exposeInMainWorld` |
| Renderer | `src/renderer/index.html` + `src/renderer/index.tsx` | `out/renderer/` | SolidJS web app (from `@opencode-ai/app`) mounted in an Electron `BrowserWindow` |

The main process declaration is in `package.json`:
```json
"main": "./out/main/index.js"
```

The electron-vite config (`electron.vite.config.ts`) defines three build targets:
- `main`: `src/main/index.ts` + `src/main/sidecar.ts`
- `preload`: `src/preload/index.ts`
- `renderer`: `src/renderer/index.html`

---

## 3. Backend Communication Model

```
┌──────────────────────────────────────────────────────────┐
│  Electron Main Process (index.ts)                        │
│                                                          │
│  1. Finds a free TCP port on 127.0.0.1                   │
│  2. Forks sidecar.js via utilityProcess.fork()            │
│  3. Posts { type: "start", hostname, port, password }     │
│  4. Waits for { type: "ready" } message from sidecar      │
│  5. Polls GET /global/health on the server until 200      │
│  6. Exposes url + password to renderer via IPC             │
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │  Sidecar Process (sidecar.js)                │        │
│  │                                              │        │
│  │  1. Receives start command via parentPort     │        │
│  │  2. Dynamically imports "virtual:opencode-    │        │
│  │     server" (resolved to packages/opencode/   │        │
│  │     dist/node/node.js at build time)          │        │
│  │  3. Calls Server.listen({ hostname, port,     │        │
│  │     username, password, cors })               │        │
│  │  4. Posts { type: "ready" } to parent          │        │
│  │  5. HTTP server listening on specified port    │        │
│  │     with Basic auth (opencode:<password>)      │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  Renderer Process (index.tsx)                             │
│    │                                                     │
│    ├── Calls window.api.awaitInitialization()             │
│    │   (IPC → main process → returns url + password)      │
│    │                                                     │
│    ├── Connects to sidecar HTTP server as a               │
│    │   ServerConnection (type: "sidecar")                 │
│    │   with HTTP Basic auth headers                       │
│    │                                                     │
│    └── All API calls go to the sidecar's HTTP server      │
│        (session management, agent execution, tools, etc.) │
└──────────────────────────────────────────────────────────┘
```

### Key IPC Channels (Main ↔ Renderer)

The preload script (`src/preload/index.ts`) exposes these via `window.api`:

| Category | Methods |
|----------|---------|
| **Server lifecycle** | `killSidecar()`, `awaitInitialization()`, `getDefaultServerUrl()`, `setDefaultServerUrl()` |
| **App lifecycle** | `relaunch()`, `getWindowCount()`, `getWindowID()`, `showWindow()` |
| **Onboarding** | `isFirstLaunchOnboardingPending()`, `finishFirstLaunchOnboarding()` |
| **File dialogs** | `openDirectoryPicker()`, `openFilePicker()`, `saveFilePicker()`, `readPickedFile()`, `releasePickedFiles()` |
| **System** | `openLink()`, `openPath()`, `readClipboardImage()`, `showNotification()` |
| **Window chrome** | `setTitlebar()`, `setBackgroundColor()`, `getZoomFactor()`, `setZoomFactor()`, `getPinchZoomEnabled()` |
| **Menu** | `onMenuCommand()`, `runDesktopMenuAction()` |
| **Updater** | `updater.subscribe()`, `updater.check()`, `updater.install()` |
| **WSL** | `wslServers.getState()`, `.subscribe()`, `.probeRuntime()`, `.refreshDistros()`, `.installDistro()`, `.addServer()`, `.startServer()`, etc. |
| **Storage** | `storeGet()`, `storeSet()`, `storeDelete()`, `storeClear()`, `storeKeys()`, `storeLength()` |
| **Debugging** | `exportDebugLogs()`, `recordFatalRendererError()` |

---

## 4. Configuration & Metadata Files

### `package.json` (Application Metadata)
| Field | Value |
|-------|-------|
| `name` | `@opencode-ai/desktop` |
| `version` | `1.17.15` |
| `license` | `MIT` |
| `main` | `./out/main/index.js` |
| `author` | OpenCode `<hello@opencode.ai>` |
| `homepage` | `https://opencode.ai` |

### `electron-builder.config.ts` (Bundle & Platform Config)
| Setting | Value / Location |
|---------|-----------------|
| **App IDs** (per channel) | `ai.opencode.desktop` (prod), `ai.opencode.desktop.beta`, `ai.opencode.desktop.dev` |
| **Product names** | `OpenCode` (prod), `OpenCode Beta`, `OpenCode Dev` |
| **macOS icon** | `resources/icons/icon.icns` → resolved per-channel via `icons/<channel>/icon.icns` |
| **Windows icon** | `resources/icons/icon.ico` → resolved per-channel via `icons/<channel>/icon.ico` |
| **Linux icons** | `resources/icons/` directory → resolved per-channel via `icons/<channel>/` |
| **macOS entitlements** | `resources/entitlements.plist` (JIT, unsigned memory, dyld env, audio, library validation) |
| **macOS category** | `public.app-category.developer-tools` |
| **Windows target** | `nsis` (one-click installer) |
| **Linux targets** | `AppImage`, `deb`, `rpm` |
| **Linux category** | `Development` |
| **Protocol schemes** | `opencode://` deep links |
| **Extra resources** | `native/` directory (macOS window native addon + Swift build) |

### `src/main/store-keys.ts` (Persistence Keys)
```
SETTINGS_STORE                      = "opencode.settings"
DEFAULT_SERVER_URL_KEY              = "defaultServerUrl"
FIRST_LAUNCH_ONBOARDING_COMPLETE_KEY = "firstLaunchOnboardingComplete"
WSL_SERVERS_KEY                     = "wslServers"
PINCH_ZOOM_ENABLED_KEY              = "pinchZoomEnabled"
WINDOW_IDS_KEY                      = "windowIds"
```

### `src/main/constants.ts` (Runtime Constants)
- `CHANNEL`: `"dev"` | `"beta"` | `"prod"` — set via `import.meta.env.OPENCODE_CHANNEL`
- `UPDATER_ENABLED`: `true` when packaged and channel !== `"dev"`

### Window Defaults (`src/main/windows.ts`)
| Setting | Value |
|---------|-------|
| Default window size | 1280 × 800 |
| macOS titlebar style | `hidden` (traffic light at `{ x: 14, y: 14 }`) |
| Windows titlebar style | `hidden` with `titleBarOverlay` (height: 40px) |
| Preload | `out/preload/index.js` |
| Context isolation | `true` |
| Node integration | `false` |
| Sandbox | `true` |
| Background color | Resolved from `oc-2` theme (`var(--background-base)`) |

### Build Configuration (`electron.vite.config.ts`)
- Server bundle resolved from `../opencode/dist/node` via a virtual module plugin
- WASM files copied from server dist into `out/main/chunks/`
- Sentry source map upload (if `SENTRY_AUTH_TOKEN` is set)
- `node-pty` resolved to platform-specific packages

### Icon Paths
```
icons/<channel>/icon.icns      # macOS .icns (processed via Image2Icon for Big Sur inset)
icons/<channel>/icon.ico       # Windows .ico
icons/<channel>/icon.png       # PNG fallback
icons/<channel>/dock.png       # macOS Dock icon (unpackaged dev mode, 128x128@2x extraction)
icons/<channel>/128x128.png    # Linux and misc sizes
icons/<channel>/128x128@2x.png
...
```

---

## 5. Local Development Command

```bash
bun run dev:desktop
```

This expands to `bun --cwd packages/desktop dev`, which runs:
```bash
cd packages/desktop
bun ./scripts/predev.ts    # pre-dev asset copy
electron-vite dev          # starts Vite dev server + Electron
```

During development:
- `ELECTRON_RENDERER_URL` is set to the Vite dev server (e.g. `http://localhost:5173`)
- The renderer loads from the Vite dev URL instead of the `oc://renderer` protocol
- Remote debugging is available on port `9222`
- The sidecar server dist is expected at `packages/opencode/dist/node/` (built separately via `bun run build` in `packages/opencode`)
- The dev channel (`"dev"`) is used by default (app ID `ai.opencode.desktop.dev`, product name `OpenCode Dev`)
