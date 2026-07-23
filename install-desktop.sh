#!/usr/bin/env bash
set -euo pipefail

# AM Desktop — one-line install script for macOS & Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install-desktop.sh | bash

REPO="n0facearia/Am"
VERSION="v1.0.0"

OS=""
ARCH=""

case "$(uname -s)" in
  Linux)  OS="linux" ;;
  Darwin) OS="darwin" ;;
  *)
    echo "FATAL: unsupported OS '$(uname -s)' — AM Desktop only supports macOS and Linux."
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "FATAL: unsupported architecture '$(uname -m)'"
    exit 1
    ;;
esac

TMP_DIR=$(mktemp -d)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ---- Download Desktop Binary ----
if [ "$OS" = "darwin" ]; then
  APP_DIR="/Applications"
  if [ ! -w "/Applications" ]; then
    APP_DIR="${HOME}/Applications"
  fi
  mkdir -p "$APP_DIR"

  echo "Downloading AM Desktop for macOS (${ARCH})..."
  DOWNLOAD_SUCCESS=false

  CANDIDATE_URLS=(
    "https://github.com/${REPO}/releases/latest/download/am-desktop-mac-${ARCH}.zip"
    "https://github.com/${REPO}/releases/latest/download/am-desktop-mac-x64.zip"
    "https://github.com/${REPO}/releases/download/${VERSION}/am-desktop-mac-${ARCH}.zip"
    "https://github.com/${REPO}/releases/download/${VERSION}/am-desktop-mac-x64.zip"
    "https://github.com/${REPO}/releases/download/v0.1.0/am-desktop-mac-x64.zip"
    "https://github.com/${REPO}/releases/download/v0.1.0/am-desktop-mac-arm64.zip"
  )

  for url in "${CANDIDATE_URLS[@]}"; do
    if curl -sSL -f -I "$url" &>/dev/null; then
      if curl -# -fL -o "${TMP_DIR}/am-mac.zip" "$url"; then
        DOWNLOAD_SUCCESS=true
        break
      fi
    fi
  done

  if [ "$DOWNLOAD_SUCCESS" = true ]; then
    echo "Extracting AM Desktop to ${APP_DIR}..."
    unzip -q -o "${TMP_DIR}/am-mac.zip" -d "$APP_DIR" 2>/dev/null || true
    if [ -d "${APP_DIR}/AM Desktop.app" ]; then
      touch "${APP_DIR}/AM Desktop.app" 2>/dev/null || true
      echo "✅ Installed AM Desktop to ${APP_DIR}/AM Desktop.app"
    elif [ -d "${APP_DIR}/AM Dev.app" ]; then
      touch "${APP_DIR}/AM Dev.app" 2>/dev/null || true
      echo "✅ Installed AM Desktop to ${APP_DIR}/AM Dev.app"
    fi
  else
    echo "Notice: Prebuilt desktop release asset not found on GitHub Releases."
    echo "Release packages will be available once published to https://github.com/${REPO}/releases."
  fi

else
  # Linux
  IS_DEBIAN=false
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "${ID:-}" in
      debian|ubuntu|linuxmint|pop|elementary|zorin) IS_DEBIAN=true ;;
    esac
  fi

  if [ "$IS_DEBIAN" = true ] && command -v sudo &>/dev/null; then
    DEB_CANDIDATES=(
      "https://github.com/${REPO}/releases/latest/download/am-desktop-linux-amd64.deb"
      "https://github.com/${REPO}/releases/download/${VERSION}/am-desktop-linux-amd64.deb"
      "https://github.com/${REPO}/releases/download/v0.1.0/am-desktop-linux-amd64.deb"
    )
    DEB_SUCCESS=false
    TMP_DEB="${TMP_DIR}/am-desktop.deb"
    for url in "${DEB_CANDIDATES[@]}"; do
      if curl -sSL -f -I "$url" &>/dev/null; then
        echo "Downloading AM Desktop .deb package..."
        if curl -# -fL -o "$TMP_DEB" "$url"; then
          DEB_SUCCESS=true
          break
        fi
      fi
    done

    if [ "$DEB_SUCCESS" = true ]; then
      echo "Installing via dpkg..."
      if ! sudo dpkg -i "$TMP_DEB" 2>/dev/null; then
        sudo apt-get install -f -y
        sudo dpkg -i "$TMP_DEB"
      fi
      echo "✅ AM Desktop installed via .deb!"
    else
      echo "Notice: Prebuilt .deb package not found on GitHub Releases."
    fi
  else
    APPIMAGE_CANDIDATES=(
      "https://github.com/${REPO}/releases/latest/download/am-desktop-linux-x86_64.AppImage"
      "https://github.com/${REPO}/releases/download/${VERSION}/am-desktop-linux-x86_64.AppImage"
      "https://github.com/${REPO}/releases/download/v0.1.0/am-desktop-linux-x86_64.AppImage"
    )
    DEST="${HOME}/.local/bin/am-desktop-bin"
    mkdir -p "${HOME}/.local/bin"
    APPIMAGE_SUCCESS=false
    for url in "${APPIMAGE_CANDIDATES[@]}"; do
      if curl -sSL -f -I "$url" &>/dev/null; then
        echo "Downloading AM Desktop AppImage..."
        if curl -# -fL -o "$DEST" "$url"; then
          chmod +x "$DEST"
          APPIMAGE_SUCCESS=true
          echo "✅ AM Desktop installed to ${DEST}"
          break
        fi
      fi
    done

    if [ "$APPIMAGE_SUCCESS" = false ]; then
      echo "Notice: Prebuilt AppImage not found on GitHub Releases."
    fi
  fi
fi

# ---- Create am-desktop CLI Launcher ----
BIN_DIR="${HOME}/.local/bin"
mkdir -p "$BIN_DIR"

cat << 'EOF' > "${BIN_DIR}/am-desktop"
#!/usr/bin/env bash
if [ -d "/Applications/AM Desktop.app" ]; then
  open -a "/Applications/AM Desktop.app" "$@"
elif [ -d "${HOME}/Applications/AM Desktop.app" ]; then
  open -a "${HOME}/Applications/AM Desktop.app" "$@"
elif [ -d "/Applications/AM Dev.app" ]; then
  open -a "/Applications/AM Dev.app" "$@"
elif [ -d "${HOME}/Applications/AM Dev.app" ]; then
  open -a "${HOME}/Applications/AM Dev.app" "$@"
elif [ -x "${HOME}/.local/bin/am-desktop-bin" ]; then
  exec "${HOME}/.local/bin/am-desktop-bin" "$@"
elif command -v am.desktop.dev &>/dev/null; then
  exec am.desktop.dev "$@"
else
  echo "Error: AM Desktop application not found."
  exit 1
fi
EOF
chmod +x "${BIN_DIR}/am-desktop"

# ---- PATH Setup ----
case ":${PATH}:" in
  *:"${BIN_DIR}":*) ;;
  *)
    SHELL_PROFILE=""
    if [ -n "${ZSH_VERSION:-}" ] || [ -f "${HOME}/.zshrc" ]; then
      SHELL_PROFILE="${HOME}/.zshrc"
    elif [ -f "${HOME}/.bashrc" ]; then
      SHELL_PROFILE="${HOME}/.bashrc"
    fi
    if [ -n "$SHELL_PROFILE" ]; then
      if ! grep -q 'export PATH=.*\.local/bin' "$SHELL_PROFILE" 2>/dev/null; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_PROFILE"
        echo "Added ${BIN_DIR} to PATH in ${SHELL_PROFILE}"
      fi
    fi
    ;;
esac

# ---- Sync Agents, Skills, Commands & Assets ----
CONFIG_AGENTS_DIRS=(
  "${HOME}/.config/opencode"
  "${HOME}/.opencode"
)

echo "Downloading and syncing custom agents, skills, commands, and assets..."

RAW_ZIP="${TMP_DIR}/am-repo.zip"
EXTRACT_DIR="${TMP_DIR}/am-repo"
mkdir -p "$EXTRACT_DIR"

if curl -# -fL -o "$RAW_ZIP" "https://github.com/${REPO}/archive/refs/heads/dev.zip" 2>/dev/null; then
  if unzip -q "$RAW_ZIP" -d "$EXTRACT_DIR" 2>/dev/null; then
    REPO_OPENCODE=$(find "$EXTRACT_DIR" -type d -name ".opencode" | head -n 1)
    if [ -d "$REPO_OPENCODE" ]; then
      for target in "${CONFIG_AGENTS_DIRS[@]}"; do
        mkdir -p "$target"
        cp -r "$REPO_OPENCODE"/* "$target/" 2>/dev/null || true
        
        mkdir -p "$target/agents" "$target/skills"
        if [ -d "$REPO_OPENCODE/agents" ]; then
          cp -r "$REPO_OPENCODE/agents"/* "$target/agents/" 2>/dev/null || true
        fi

        if [ -d "$REPO_OPENCODE/skills" ]; then
          cp -r "$REPO_OPENCODE/skills"/* "$target/skills/" 2>/dev/null || true
        fi

        if [ -d "$REPO_OPENCODE/agents-context" ]; then
          find "$REPO_OPENCODE/agents-context" -type f -name "SKILL.md" | while read -r skill_file; do
            skill_parent=$(dirname "$skill_file")
            skill_dir=$(basename "$skill_parent")
            mkdir -p "$target/skills/$skill_dir"
            cp -r "$skill_parent"/* "$target/skills/$skill_dir/" 2>/dev/null || true
          done
        fi
      done
      echo "✅ Synced all custom agents, skills, commands, and assets!"
    fi
  fi
fi

echo ""
echo "✅ AM Desktop setup complete!"
echo "   Terminal command: am-desktop"
echo "   Agents and skills configured identically in ~/.config/opencode/ & ~/.opencode/"
