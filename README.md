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
  <a href="#how-am-differs-from-opencode">Differences from OpenCode</a> •
  <a href="#usage">Usage</a> •
  <a href="#configuration">Configuration</a>
</p>

---

## Overview

**AM** is a terminal-native AI coding agent that lives in your CLI and helps you build software. It understands your codebase, runs commands, edits files, and navigates your project — all from the terminal.

AM started as a fork of [OpenCode](https://github.com/anomalyco/opencode) and has been rebuilt with a focus on:

- **Custom agent architecture** — Built-in build, plan, and general agents with distinct permission models
- **Enhanced TUI** — Redesigned terminal UI with custom theming (light/dark palette support)
- **Local-first design** — First-class support for local models via Ollama
- **Streamlined branding** — Clean identity as `am-cli`

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

### Desktop App

Download from the [Releases](https://github.com/n0facearia/Am/releases) page.

---

## How AM Differs from OpenCode

AM is a fork of [OpenCode](https://github.com/anomalyco/opencode) by anomalyco. While it shares the same core engine, AM diverges in several key areas:

| Aspect | OpenCode | AM |
|--------|----------|----|
| **Identity** | `opencode` CLI, `opencode-ai` npm package | `am-cli` CLI, `am-cli` npm package |
| **Logo/Branding** | Original OpenCode wordmark | Custom ASCII logo and TUI branding |
| **Theme System** | Single dark theme | Light/dark palette with `LIGHT_PALETTE` and `FALLBACK_PALETTE` |
| **Agents** | Default agent set | Custom agent architecture with build/plan/general agents, custom skills |
| **Distribution** | Official OpenCode channels | Fork-specific releases, AUR, Homebrew tap |
| **Local Models** | Supported | Enhanced first-class support with auto-detection |
| **TUI Components** | Original components | Redesigned error, persona switcher, which-key components |
| **Configuration** | OpenCode defaults | Custom defaults, custom skills directory |

### Why AM?

AM is designed for users who want:
- A distinct identity separate from the upstream OpenCode project
- Custom agent behaviors and permission models
- Enhanced local model support
- A different visual and interactive experience in the terminal

---

## Usage

```bash
am-cli
```

Run `am-cli --help` for available commands.

## Documentation

For full documentation, see the [docs](https://opencode.ai/docs) (upstream OpenCode docs apply to core functionality).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Same as OpenCode.
