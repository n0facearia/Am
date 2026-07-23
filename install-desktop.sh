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
  ASSET="am-desktop-mac-${ARCH}.zip"
  DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"
  APP_DIR="${HOME}/Applications"
  mkdir -p "$APP_DIR"
  
  echo "Downloading AM Desktop for macOS (${ARCH})..."
  DOWNLOAD_SUCCESS=false
  if curl -sSL -f -I "$DOWNLOAD_URL" &>/dev/null || curl -sSL -f -I "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}" &>/dev/null; then
    if curl -# -fL -o "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL" 2>/dev/null || curl -# -fL -o "${TMP_DIR}/${ASSET}" "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"; then
      DOWNLOAD_SUCCESS=true
    fi
  fi

  if [ "$DOWNLOAD_SUCCESS" = true ]; then
    echo "Extracting AM Desktop to ${APP_DIR}..."
    unzip -q -o "${TMP_DIR}/${ASSET}" -d "$APP_DIR" 2>/dev/null || true
    echo "✅ Installed AM Desktop to ${APP_DIR}/AM Desktop.app"
  else
    echo "Notice: Prebuilt desktop release asset (${ASSET}) not found on GitHub Releases."
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
    DEB_ASSET="am-desktop-linux-amd64.deb"
    DEB_URL="https://github.com/${REPO}/releases/download/${VERSION}/${DEB_ASSET}"
    TMP_DEB="${TMP_DIR}/${DEB_ASSET}"
    if curl -sSL -f -I "$DEB_URL" &>/dev/null; then
      echo "Downloading AM Desktop .deb package..."
      if curl -# -fL -o "$TMP_DEB" "$DEB_URL"; then
        echo "Installing via dpkg..."
        if ! sudo dpkg -i "$TMP_DEB" 2>/dev/null; then
          sudo apt-get install -f -y
          sudo dpkg -i "$TMP_DEB"
        fi
        echo "✅ AM Desktop installed via .deb!"
      fi
    else
      echo "Notice: Prebuilt .deb package not found on GitHub Releases."
    fi
  else
    APPIMAGE_ASSET="am-desktop-linux-x86_64.AppImage"
    APPIMAGE_URL="https://github.com/${REPO}/releases/download/${VERSION}/${APPIMAGE_ASSET}"
    DEST="${HOME}/.local/bin/am-desktop"
    mkdir -p "${HOME}/.local/bin"
    if curl -sSL -f -I "$APPIMAGE_URL" &>/dev/null; then
      echo "Downloading AM Desktop AppImage..."
      if curl -# -fL -o "$DEST" "$APPIMAGE_URL"; then
        chmod +x "$DEST"
        echo "✅ AM Desktop installed to ${DEST}"
      fi
    else
      echo "Notice: Prebuilt AppImage not found on GitHub Releases."
    fi
  fi
fi

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
echo "   Agents and skills configured identically in ~/.config/opencode/ & ~/.opencode/"
