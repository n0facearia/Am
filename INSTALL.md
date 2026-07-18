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

---

## Desktop App

The AM desktop app is an Electron-based GUI that wraps the same core as the CLI.

### Build & Install from Source (one command)

```bash
./install-desktop.sh
```

This builds the web app, Electron shell, and packages an AppImage, then installs it to `~/.local/bin/am-desktop`.

Options:
- `--channel dev|beta|prod` — set the build channel (default: `prod`)
- `INSTALL_DIR=/usr/local/bin` — change install location (requires sudo)

### Pre-built Releases

#### Linux

**AppImage (any distro):**
1. Download `am-desktop-linux-x86_64.AppImage` from the [Releases](https://github.com/n0facearia/Am/releases) page.
2. Make it executable and run:
   ```bash
   chmod +x am-desktop-linux-x86_64.AppImage
   ./am-desktop-linux-x86_64.AppImage
   ```

**Debian/Ubuntu (.deb):**
1. Download `am-desktop-linux-amd64.deb` from the [Releases](https://github.com/n0facearia/Am/releases) page.
2. Install and launch:
   ```bash
   sudo dpkg -i am-desktop-linux-amd64.deb
   sudo apt-get install -f   # fix any missing dependencies
   am.desktop.dev            # or find "AM Dev" in your app launcher
   ```

### macOS

1. Download `am-desktop-mac-x64.zip` from the [Releases](https://github.com/n0facearia/Am/releases) page.
2. Extract and drag to Applications:
   ```bash
   unzip am-desktop-mac-x64.zip
   cp -R "AM Dev.app" /Applications/
   ```
3. On first launch, macOS may block the app because it's unsigned. Go to **System Settings > Privacy & Security** and click **Open Anyway** next to the blocked message.

> A signed `.dmg` installer is not yet available. Building on a Mac with Apple Developer credentials will produce one in future releases.

### Windows

1. Download `am-desktop-win-x64.exe` from the [Releases](https://github.com/n0facearia/Am/releases) page.
2. Run the installer and follow the setup wizard. AM will be added to your Start Menu.

### First Run — Connecting a Provider

When you launch the desktop app for the first time:

1. **Cloud provider**: Open **Settings** (gear icon or `Ctrl+,`) and select a provider (OpenAI, Anthropic, Google, etc.). Paste your API key when prompted.
2. **Local Ollama**:
   - Install Ollama from [ollama.com](https://ollama.com) and start it (`ollama serve`).
   - In AM Settings, choose the local/ollama provider. AM auto-detects running Ollama instances and lists available models.
   - Pull a model if needed (`ollama pull llama3`) and select it in AM.

### Troubleshooting

**AppImage won't run on Wayland (blank window or crash):**
- Force X11 mode: `./am-desktop-linux-x86_64.AppImage --ozone-platform-hint=auto`

**"AM Dev" appears in app launcher but does nothing:**
- The desktop launcher may point to a stale install. Reinstall the `.deb` or re-extract the `.AppImage`.

**Windows SmartScreen warning:**
- Click **More info > Run anyway**. The installer is unsigned for now; a signed release is planned.
