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

## Install

### Prerequisites

- **Linux** (x86_64) — tested on Arch Linux
- **macOS** (arm64, x64) — build targets exist but **untested** in this environment
- **Windows** (arm64, x64) — build targets exist but **untested**
- [Bun](https://bun.sh) v1.3+ (runtime)

### One-line install (Linux x86_64)

```bash
# Install am-cli (TUI) and am-desktop (Electron app)
curl -fsSL https://github.com/n0facearia/Am/releases/latest/download/install.sh | bash
```

> **Note**: The install script above is a placeholder until the first release is cut. See [Build from source](#build-from-source) below for now.

### Desktop AppImage

The desktop build produces a self-contained AppImage at:

```
packages/desktop/dist/am-desktop-linux-x86_64.AppImage
```

Install it:

```bash
# After building (see Build from source)
cp packages/desktop/dist/am-desktop-linux-x86_64.AppImage ~/.local/bin/am-desktop
chmod +x ~/.local/bin/am-desktop
```

### Build from source

```bash
git clone https://github.com/n0facearia/Am.git
cd Am
bun install

# Build the CLI binary
bun run --cwd packages/opencode build

# Build the Desktop app (requires Electron build deps)
bash install-desktop.sh
```

Build outputs:
- `packages/opencode/dist/am-cli-linux-x64/bin/am-cli` — TUI binary
- `packages/desktop/dist/am-desktop-linux-x86_64.AppImage` — Desktop app
- `packages/desktop/dist/am-desktop-linux-amd64.deb` — Debian package

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
