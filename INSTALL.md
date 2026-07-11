# Installation

Install AM CLI on your preferred platform.

## Quick Install (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install | bash
```

## Linux

### Via npm
```bash
npm install -g am-cli
```

### Via Binary
1. Download the latest release from the [Releases](https://github.com/n0facearia/Am/releases) page.
2. Extract and move to PATH:
   ```bash
   sudo mv am-cli /usr/local/bin/
   ```

### Via AUR (Arch Linux)
```bash
yay -S am-cli-bin
```

### Via Homebrew
```bash
brew install n0facearia/tap/am-cli
```

## macOS

### Via npm
```bash
npm install -g am-cli
```

### Via Homebrew
```bash
brew install n0facearia/tap/am-cli
```

### Via Binary
Download from the [Releases](https://github.com/n0facearia/Am/releases) page.

## Windows

### Via npm
```powershell
npm install -g am-cli
```

### Via Binary
Download from the [Releases](https://github.com/n0facearia/Am/releases) page.

---

## First Run & Configuration

On your first run, AM will prompt you to select a provider.

### Connecting a Cloud Provider
Choose a provider like **OpenAI**, **Anthropic**, or **Google** from the menu. You will be prompted to enter your API key.

### Connecting a Local Model (Ollama)
1. Ensure **Ollama** is installed and running.
2. In the AM provider menu, select your local runner.
3. AM will automatically detect running Ollama instances.

---

## Troubleshooting

**Command not found: `am-cli`**
- Ensure the installation directory is in your `PATH`.

**Permission Denied**
- Run `chmod +x am-cli` on the binary.

**Provider Error: "Connection Failed"**
- Verify your internet connection and API key.
- For local providers, ensure Ollama is running at `http://localhost:11434`.
