<p align="center">
  <picture>
    <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
    <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
    <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="AM logo">
  </picture>
</p>

<p align="center">
  <code>░║██████████   ░║██████████</code><br>
  <code>░║█      ░║█   ░║█      ░║█</code><br>
  <code>░║█      ░║█   ░║█ ░║██ ░║█</code><br>
  <code>░║█░║████░║█   ░║█ ░║██ ░║█</code><br>
  <code>░║█      ░║█   ░║█ ░║██ ░║█</code><br>
  <code>░║█      ░║█   ░║█ ░║██ ░║█</code><br>
  <code>░║█      ░║█   ░║█      ░║█</code>
</p>

<p align="center">
  <strong>AM</strong> — A terminal-first AI coding agent. Forked from OpenCode, rebuilt for a different workflow.
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-am-differs-from-opencode">Differences from OpenCode</a> •
  <a href="#features">Features</a> •
  <a href="#agent-system">Agent System</a> •
  <a href="#development">Development</a>
</p>

---

## Overview

**AM** ("Artificial Machine") is a terminal-native AI coding agent that lives in your CLI and helps you build software. It understands your codebase, runs commands, edits files, navigates your project, and interacts with your Git workflow — all from the terminal with a rich TUI (Terminal User Interface).

AM started as a fork of [OpenCode](https://github.com/anomalyco/opencode) by anomalyco and has been rebuilt with a focus on custom agent architecture, enhanced local model support, redesigned theming, and a distinct visual identity.

### Why "AM"?

AM is designed for users who want:
- A **distinct identity** separate from the upstream OpenCode project
- **Custom agent behaviors** with build/plan/general agents and custom permission models
- **Enhanced local model support** with automatic Ollama detection
- A **different visual and interactive experience** in the terminal with light/dark palette support
- **Fine-grained control** over the development workflow through specialized agents

---

## Installation

### Quick Install (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install | bash
```

### npm

```bash
npm install -g am-cli
```

### Homebrew (macOS/Linux)

```bash
brew install n0facearia/tap/am-cli
```

### AUR (Arch Linux)

```bash
yay -S am-cli-bin
```

### Binary Release

Download the latest binary from the [Releases](https://github.com/n0facearia/Am/releases) page.

### Docker

```bash
docker pull ghcr.io/n0facearia/am-cli:latest
```

### Desktop App (Electron)

Download from the [Releases](https://github.com/n0facearia/Am/releases) page. The desktop app provides a standalone windowed experience with the full TUI.

---

## Quick Start

### First Run

Run AM from your project directory:

```bash
am-cli
```

On the first run, AM will prompt you to select an AI provider:

1. **Cloud Provider**: Choose from OpenAI, Anthropic, Google, Groq, Mistral, and more. You'll be prompted to enter your API key.
2. **Local Model (Ollama)**: If you have Ollama installed and running, AM will auto-detect it. Select your local runner from the provider menu.

### Basic Usage

Once a provider is configured, you can start coding immediately:

```
am-cli
```

Then in the TUI, type your request — for example:
- "Create a new React component"
- "Fix the bug in src/parser.ts"
- "Explain how the authentication flow works"
- "Run the tests and fix failures"

### Key Commands

| Command | Description |
|---------|-------------|
| `am-cli` | Launch interactive TUI |
| `am-cli --mini` | Start in compact mode |
| `am-cli -s <session_id>` | Resume a previous session |
| `am-cli serve` | Start headless API server |
| `am-cli --help` | Show all available commands |

---

## Features

### Core Capabilities

- **Codebase Awareness**: AM reads and understands your entire project structure, not just open files
- **File Editing**: Create, modify, and refactor files with precise, context-aware edits
- **Command Execution**: Run shell commands, scripts, and build tools directly from the agent
- **Git Integration**: Stage changes, commit, create branches, and push — all through natural language
- **Multi-file Refactoring**: Coordinate changes across files with full project context

### Agent System

AM ships with multiple specialized agents:

| Agent | Role | Permission Model |
|-------|------|------------------|
| **Build** | Default development agent with full tool access | All tools allowed by default |
| **Plan** | Architectural planning and design | Read-only except `.opencode/plans/*.md` |
| **General** | Research and information gathering | Read-only, no file modifications |
| **Chat** | General conversation (no project changes) | No project file access by default |

Each agent has a distinct accent color in the TUI for quick visual identification.

### Terminal User Interface (TUI)

- **Custom ASCII Logo**: AM displays its own brand identity on startup
- **Mascot**: An animated AI mascot that shows state (idle, thinking, success, error)
- **Multiple Themes**: 30+ built-in themes including dracula, tokyonight, catppuccin, one-dark, and more
- **Light/Dark Mode**: Automatic detection of terminal color scheme with proper palette support
- **Persona Switcher**: Quick agent switching from within the TUI
- **Error Component**: Redesigned error display with clear context and recovery options

### Provider Support

AM supports a wide range of AI model providers:

**Cloud Providers:**
- OpenAI (GPT-4, GPT-4o, o1, o3)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Google (Gemini 1.5 Pro, Gemini 2.0 Flash)
- Groq, Mistral, Together AI, DeepInfra
- Perplexity, Cohere, Cerebras, xAI (Grok)
- Azure OpenAI, Amazon Bedrock, Google Vertex
- OpenRouter (aggregator with many models)
- And more via the Vercel AI SDK

**Local Providers:**
- Ollama (auto-detected on localhost:11434)
- OpenAI-compatible local endpoints

### Local-First Design

AM gives first-class support to local models:
- Automatic Ollama instance detection at startup
- Optimized prompt batching for local inference
- Configurable model parameters per provider

---

## How AM Differs from OpenCode

AM is a fork of [OpenCode](https://github.com/anomalyco/opencode). While it shares the same core engine and architecture, AM diverges significantly in several areas:

### Identity & Branding

| Aspect | OpenCode | AM |
|--------|----------|----|
| **CLI Name** | `opencode` | `am-cli` |
| **npm Package** | `opencode` | `am-cli` |
| **Binary** | `opencode` | `am-cli` |
| **Logo** | OpenCode wordmark | Custom ASCII "AM" blocks with ornate SVG |
| **Tagline** | "AI-powered development tool" | "Artificial Machine" |

### Terminal UI

| Aspect | OpenCode | AM |
|--------|----------|----|
| **Splash Screen** | Original OpenCode banner | Custom "AM" ASCII art with brand tagline |
| **Mascot** | None | Animated mascot with idle/thinking/success/error states |
| **Startup Logo** | Original ASCII art | Redesigned logo.ts with distinct block characters |
| **Error Component** | Original | Redesigned with clearer context and recovery |
| **Theme System** | Single dark mode | Light/dark palette with `LIGHT_PALETTE` and `FALLBACK_PALETTE` |
| **Persona Switcher** | None | New component for quick agent switching |

### Agent Architecture

| Aspect | OpenCode | AM |
|--------|----------|----|
| **Default Agents** | Basic agent set | Build, Plan, General, and Chat agents |
| **Agent System Prompt** | Standard OpenCode prompts | Custom agent definitions with explicit role and permission models |
| **Permission Model** | Single permission system | Per-agent permission models (build=full, plan=restricted, general=read-only) |
| **Plan Mode** | Basic planning | Enhanced plan mode with restricted editing (only `.opencode/plans/*.md`) |
| **Agent Accent Colors** | Default | Color-coded agents: plan=yellow, build=green, chat=blue, frontend=pink, etc. |

### Configuration & Customization

| Aspect | OpenCode | AM |
|--------|----------|----|
| **Configuration File** | `opencode.jsonc` | Custom `.opencode/opencode.jsonc` with AM-specific settings |
| **Skills Directory** | Standard | Custom skills including `am-standards`, `design-guidance`, `simple-test-policy` |
| **Agent Context** | Standard | Custom agent context files for frontend, backend, documentation, mascot, style guide |
| **Design Tokens** | Not available | Formalized design tokens (colors, type scale, transitions, mascot states) |
| **Brand Config** | None | `brand.config.json` with product name, tagline, accent colors by mode |

### Distribution

| Aspect | OpenCode | AM |
|--------|----------|----|
| **Release Channel** | Official OpenCode | Fork-specific releases on GitHub |
| **Package Managers** | npm, Homebrew | npm, Homebrew tap, AUR, Docker |
| **Install Script** | `opencode.ai/install` | Raw GitHub install script |
| **Desktop Build** | OpenCode Desktop | AM Desktop (Electron, rebranded) |

### Philosophy

**OpenCode** aims to be a universal AI coding assistant with a focus on the OpenCode ecosystem (OpenCode Zen, OpenCode Go subscription services).

**AM** is focused on providing a **self-hosted, customizable** experience with:
- No dependency on subscription services
- Custom agent behaviors tailored to individual workflows
- Enhanced local model support for privacy and offline use
- A distinct, customizable visual identity

### Migration Status

AM is in active development. The following areas still carry OpenCode branding and are being progressively migrated:

- Some internal package names (`@opencode-ai/*`)
- Translation files (i18n)
- Desktop app configuration
- Console app branding assets
- Some provider-facing documentation URLs

These are cosmetic references to the upstream origin and do not affect functionality.

---

## Agent System

AM's agent system is the core of its workflow customization. Each agent is defined with:

### Build Agent

The default development agent with unrestricted tool access. Used for implementing features, fixing bugs, and managing the codebase. It follows the `simple-test-policy` skill for completion reporting.

**Color**: Green (`#10B981`)  
**Permissions**: All tools allowed  
**System Prompt**: Full development context with version control awareness

### Plan Agent

The architectural planning agent. It analyzes codebases, proposes changes, and creates implementation plans — but is restricted from making direct code changes (except for plan files).

**Color**: Yellow (`#EAB308`)  
**Permissions**: Read-only except `.opencode/plans/*.md`  
**Use Case**: "Plan the migration from Express to Hono"

### General Agent

The research and exploration agent. It searches codebases, reads documentation, and answers questions without modifying any files.

**Color**: Blue (`#3B82F6`)  
**Permissions**: Read-only  
**Use Case**: "How does the authentication flow work?"

### Chat Agent

A general-purpose conversational assistant that does not read project files by default. It can be switched to "project-aware" mode to answer questions about the codebase, but never writes or executes anything.

**Context Mode**: "general" (default), can switch to "project-aware"  
**Permissions**: No project file access by default

---

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.14
- Node.js >= 22

### Setup

```bash
git clone https://github.com/n0facearia/Am.git
cd Am
bun install
```

### Development Commands

Run from the repository root:

| Command | Description |
|---------|-------------|
| `bun run dev` | Start AM in development mode (TUI) |
| `bun run dev:desktop` | Start desktop app in development mode |
| `bun run dev:web` | Start web UI development server |
| `bun run dev:console` | Start management console |
| `bun run typecheck` | Run TypeScript type checking across all packages |
| `bun run lint` | Run linting with oxlint |

### Package Structure

The monorepo is organized under `packages/`:

| Package | Description |
|---------|-------------|
| `packages/opencode` | Main CLI entry point, command routing, TUI compilation |
| `packages/core` | Central engine: agent loop, database, permissions, shell |
| `packages/tui` | Terminal User Interface (SolidJS + OpenTUI) |
| `packages/server` | HTTP API server for headless mode |
| `packages/llm` | AI model provider integration layer |
| `packages/schema` | Database, agent, model, and event schemas |
| `packages/protocol` | Standardized message schemas and API definitions |
| `packages/app` | Web interface (React/Vite) |
| `packages/desktop` | Desktop shell (Electron) |
| `packages/console` | Web-based management console |
| `packages/plugin` | Plugin system for extending AM |
| `packages/client` | Auto-generated HTTP API client |

### Architecture

```
┌─────────────────────────────────────────────────┐
│                   am-cli (CLI)                   │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  TUI/Term  │  │  Server  │  │  Web/Desktop  │  │
│  │  (opentui) │  │  (Hono)  │  │  (React/Elect)│  │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        │              │               │           │
│  ┌─────┴──────────────┴───────────────┴───────┐  │
│  │                 Core Engine                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐   │  │
│  │  │  Session  │ │  Agent   │ │  Permission │   │  │
│  │  │  Manager  │ │  Runner  │ │  System     │   │  │
│  │  └─────┬────┘ └────┬─────┘ └──────┬──────┘   │  │
│  │        │           │              │           │  │
│  │  ┌─────┴───────────┴──────────────┴───────┐  │  │
│  │  │          Tool Registry                  │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                        │                            │
│  ┌─────────────────────┴─────────────────────────┐ │
│  │              LLM Provider Layer                │ │
│  │  OpenAI  Anthropic  Google  Ollama  ...         │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Configuration

AM is configured through `.opencode/opencode.jsonc` in your project root:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {},
  "permission": {},
  "references": {},
  "mcp": {},
  "agent": {}
}
```

### Key Configuration Options

- **Provider**: Set your AI model provider and API keys
- **Permissions**: Control what files and commands AM can access
- **References**: Link documentation repositories for agent context
- **MCP**: Configure Model Context Protocol servers
- **Agent**: Override agent descriptions, context modes, and behaviors

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Code style and conventions
- Testing requirements
- Pull request process
- Agent system modifications

### Project Conventions

- Use **Bun** for package management and scripts
- Follow the **Effect** pattern for async code (`Effect.gen`, `pipe`, layers)
- Use snake_case for database schema field names
- Avoid `try/catch` — use Effect's error handling
- Keep things in one function unless composable or reusable

---

## Roadmap

- [ ] Full OpenCode branding removal across all assets
- [ ] Enhanced agent customization UI in TUI
- [ ] Plugin marketplace for community agents and skills
- [ ] Improved local model fine-tuning integration
- [ ] Web-based dashboard for session management
- [ ] Team collaboration features (shared sessions, reviews)

---

## License

Same as OpenCode (MIT).

---

*AM is not affiliated with anomalyco or the OpenCode project. It is an independent fork.*
