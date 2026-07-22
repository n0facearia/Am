# AM

**Autonomous agent for your terminal and desktop.** AM is an LLM-powered coding assistant that works in your project directory — it reads files, runs commands, writes code, and manages multi-step tasks through subagent delegation.

AM is a fork of [OpenCode](https://github.com/anthropics/opencode) with its own isolated data paths and a public release build pipeline.

---

## Features

- **Terminal UI (TUI)** — interactive chat session with your project, run with `am-cli`
- **Desktop app** — Electron shell with the same chat interface, packaged as AppImage (Linux)
- **Agents** — configurable agent profiles (Build, Architect, Ask, Custom) that control tool access and model selection
- **Subagent delegation** — a session can spawn child sessions with their own agent profile and context
- **Provider adapters** — Google, OpenAI, Anthropic, AWS Bedrock, Ollama, and custom endpoints
- **Tool registry** — file read/write, command execution, search, and extensible MCP tool support
- **Skill library** — downloadable `.opencode/skills/` and reference library for teaching agents project conventions
- **OpenCode session import** — read-only display of existing OpenCode sessions (see compatibility note below)

---

## Working with this Fork

### Key Differences from OpenCode

1. **Isolated Data & Namespace**: AM operates in full isolation from OpenCode using its own dedicated storage and configuration paths:
   - Data & Databases: `~/.local/share/am/` (`am.db`, `am-{channel}.db`)
   - Configuration: `~/.config/am/` (`tui.json`, `config.json`)
   - State & Cache: `~/.local/state/am/`, `~/.cache/am/`
2. **Standalone Installation & Distribution**: Custom one-line release installers (`install.sh`, `install-desktop.sh`, `install.ps1`) publish standalone binaries (`am-cli`, `am-desktop`) for Linux, macOS, and Windows with progress bars and desktop integration.
3. **Structured Agent System**: AM provides pre-configured, permission-scoped primary agents and subagents tailored for structured multi-agent workflows:
   - **Primary Agents** (User-selectable in TUI / Desktop):
     - `build` — Default agent with full read/write/execution permissions.
     - `plan` — Read-only architecture planning mode; disallows file edits outside plan documents.
     - `frontend` — UI & client specialist restricted to frontend packages (`packages/app`, `packages/ui`, `packages/tui`, `packages/web`, etc.).
     - `backend` — Server & core specialist restricted to backend packages (`packages/server`, `packages/core`, `packages/schema`, etc.).
     - `documentation` — Documentation specialist for Mdx and Markdown guides.
     - `orchestrator` — Pure coordinator agent that delegates tasks to `frontend`, `backend`, and `documentation` subagents without directly editing code.
   - **Subagents & Utilities**:
     - `general` — General-purpose subagent for parallel background tasks.
     - `explore` — Fast codebase search and pattern matching subagent.
     - `compaction`, `title`, `summary` — Internal session context helpers.
4. **Default New UI Layout**: Both Desktop and Web UI launch with the refreshed layout design system enabled by default (`newLayoutDesignsDefault = true`).
5. **Read-Only Session Interoperability**: Discovers historical OpenCode sessions from `opencode.db` and lists them under "From OpenCode" in read-only mode without mutating OpenCode databases.
6. **`dev` Branch as Primary Target**: Active development and pull requests target `origin/dev` rather than `main`.

---

## Development & Contribution Guidelines

### Branch Naming
Use short branch names of at most three words, separated by hyphens (e.g. `session-recovery`, `fix-scroll-state`). Do **not** use slashes or type prefixes such as `feat/` or `fix/`.

### Commits & PR Titles
Follow Conventional Commits: `type(scope): summary` (e.g. `fix(tui): simplify thinking toggle styling`, `feat(app): enable new layout by default`). Valid types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

### Package Scoped Commands
- **Install**: Run `bun install` from the repository root.
- **Typechecking**: Always run `bun typecheck` from individual package directories (e.g., `packages/opencode`), never `tsc` directly or from the root.
- **Protocol & API Codegen**: After modifying public Protocol or Server `HttpApi`, run `bun run generate` from `packages/client`. Do not edit `src/generated` directly.
- **SDK Regeneration**: To rebuild the legacy JavaScript SDK, run `./packages/sdk/js/script/build.ts`.

---

## Install

AM provides standalone binaries with no runtime dependencies — no Bun, Node, or Python required.

> **Tested platforms**: ✅ Linux (x86_64) install tested in-session.  
> **Untested platforms**: macOS, Windows — the build artifacts exist but have not been verified in this environment. Commands are provided as written.

---

### TUI (am-cli) — Terminal app

#### Linux / macOS

```bash
curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install.sh | bash
```

The script detects your OS (Linux/macOS) and architecture (x64/arm64), downloads the correct binary from the [latest release](https://github.com/n0facearia/Am/releases), and places `am-cli` in `~/.local/bin/`. If `~/.local/bin` is not on your PATH, the script adds it to your shell config.

✅ **Tested**: Linux x86_64 — confirmed working via real run.  
❓ **Untested**: macOS arm64/x64 — script is written and should work, but not verified in this environment.

#### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/n0facearia/Am/dev/install.ps1 | iex
```

Downloads the Windows binary, places it in `%LOCALAPPDATA%\Programs\AM`, and adds it to your user PATH.

❓ **Untested**: Windows — script is written but not verified in this environment.

---

### Desktop (am-desktop) — Electron app

#### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install-desktop.sh | bash
```

On Debian/Ubuntu, installs the `.deb` package via `dpkg`. On other Linux distros (Fedora, Arch, etc.), downloads the AppImage to `~/.local/bin/am-desktop` and creates a desktop entry.

✅ **Tested**: Linux (Arch Linux) — confirmed AppImage download + install via real run.  
❓ **Untested**: Debian/Ubuntu `.deb` path — script logic is written but not verified in this environment.

#### Direct AppImage download (zero install — just download and run)

You can always download the latest AppImage directly — no script, no setup:

```bash
# Download
curl -fsSL -o ~/.local/bin/am-desktop https://github.com/n0facearia/Am/releases/download/v0.1.0/am-desktop-linux-x86_64.AppImage

# Make executable
chmod +x ~/.local/bin/am-desktop

# Run
am-desktop
```

Or download from the [release page](https://github.com/n0facearia/Am/releases/tag/v0.1.0) manually.

#### macOS

A macOS build exists (`am-desktop-mac-x64.zip`, 361MB) attached to the [release](https://github.com/n0facearia/Am/releases/tag/v0.1.0), but it is **unsigned** — Gatekeeper will block it unless you right-click → Open. No one-line install command is provided because the build hasn't been tested or notarized.

#### Windows

A Windows build exists (`am-desktop-win-x64.exe`, 120MB) attached to the [release](https://github.com/n0facearia/Am/releases/tag/v0.1.0), but it is **unsigned** — SmartScreen will show a warning. No one-line install command is provided because the build hasn't been tested.

---

### Build from source

If you prefer to build from source or need to modify the code:

```bash
git clone https://github.com/n0facearia/Am.git
cd Am
bun install

# Build the CLI binary (output: packages/opencode/dist/)
bun run --cwd packages/opencode build --single

# Build the Desktop app (requires Electron build deps)
bash install-desktop.sh
```

---

## Usage

### TUI (terminal)

```bash
# Start a new session in the current directory
am-cli

# Specify a project directory
am-cli /path/to/project

# Continue the last session
am-cli --continue

# Use a specific model
am-cli --model opencode/big-pickle
```

Once inside the TUI:

| Key | Action |
|---|---|
| `Ctrl+X then L` | List all sessions (includes imported OpenCode sessions) |
| `Ctrl+X then N` | New session |
| `Ctrl+X then S` | View status |
| `Ctrl+P` | Command palette |
| `Tab` | Switch agent |
| `Ctrl+X then E` | Open external editor |

### Desktop

```bash
am-desktop
```

The desktop app embeds the same chat interface in an Electron shell.

---

## OpenCode Compatibility

AM stores all data in its own isolated directories:

| Path | Contents |
|---|---|
| `~/.local/share/am/` | Databases (`am.db`, `am-{channel}.db`) |
| `~/.config/am/` | User configuration (`tui.json`, `config.json`) |
| `~/.cache/am/` | Cached provider data |
| `~/.local/state/am/` | Runtime state |

If you also have [OpenCode](https://github.com/anthropics/opencode) installed, AM will **read-only display** your OpenCode sessions in the TUI session list under a "From OpenCode" section. These sessions are shown for reference only — they cannot be opened, edited, or deleted from AM. AM never writes to the OpenCode database.

On first launch, AM migrates any channel-specific development databases (`opencode-{channel}.db` → `am-{channel}.db`) if they exist. The production `opencode.db` is never touched.

---

## Configuration

AM reads configuration from:

- `~/.config/am/tui.json` — TUI settings (keybindings, theme, UI options)
- `~/.config/am/config.json` — provider config, agent profiles, tool permissions

System-wide managed config (if present):
- **Linux**: `/etc/am/config.json`
- **macOS**: `/Library/Application Support/am/config.json`

---

## Project Structure

| Package | Description |
|---|---|
| `packages/core` | Session management, database, agent/model runtime, tool execution |
| `packages/tui` | Terminal UI (SolidJS + custom terminal renderer) |
| `packages/desktop` | Electron desktop shell |
| `packages/opencode` | CLI entrypoint, server, build scripts |
| `packages/server` | HTTP API server (embedded) |
| `packages/sdk` | Generated TypeScript SDK |
| `packages/schema` | Wire format contracts (Effect Schema) |
| `packages/app` | Web UI bundle (embedded in Desktop) |

---

## License

MIT
