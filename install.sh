#!/usr/bin/env bash
set -euo pipefail

# AM CLI — one-line install script
# Usage: curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install.sh | bash
#
# Supported platforms:
#   Linux (x86_64, arm64, x86_64-baseline) — glibc or musl
#   macOS (arm64, x64, x64-baseline)

REPO="n0facearia/Am"
VERSION="v1.0.0"
BINARY_NAME="am-cli"

# ---- Platform detection ----
OS=""
ARCH=""
MUSL=false

case "$(uname -s)" in
  Linux)  OS="linux" ;;
  Darwin) OS="darwin" ;;
  *)
    echo "FATAL: unsupported OS '$(uname -s)' — AM CLI only supports Linux and macOS."
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

# Detect musl on Linux
if [ "$OS" = "linux" ]; then
  if ldd --version 2>&1 | grep -qi musl; then
    MUSL=true
  fi
fi

# ---- Derive asset name ----
# Pattern: am-cli-{os}-{arch}[{-baseline}][{-musl}].tar.gz (Linux) or .zip (macOS)
SUFFIX=""
if [ "$OS" = "linux" ]; then
  # On Linux x64, prefer the regular build over baseline unless the CPU lacks AVX2
  # We detect baseline-needing CPUs by checking for avx2 flag
  HAS_AVX2=false
  if grep -q avx2 /proc/cpuinfo 2>/dev/null; then
    HAS_AVX2=true
  fi
  if [ "$ARCH" = "x64" ] && [ "$HAS_AVX2" = false ]; then
    SUFFIX="-baseline"
  fi
  if [ "$MUSL" = true ]; then
    SUFFIX="${SUFFIX}-musl"
  fi
  ASSET="am-cli-${OS}-${ARCH}${SUFFIX}.tar.gz"
  EXTRACT_CMD="tar -xzf"
else
  # macOS — all Intel Macs support AVX2 (Haswell 2013+), but offer baseline for Rosetta edge cases
  # Just use the standard build for macOS
  ASSET="am-cli-${OS}-${ARCH}.tar.gz"
  EXTRACT_CMD="tar -xzf"
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"

# ---- Determine install directory ----
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "$INSTALL_DIR"

# ---- Download & install binary ----
echo "Downloading AM CLI release binary (${ASSET})..."

TMP_DIR=$(mktemp -d)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

DOWNLOAD_SUCCESS=false

# Quietly check if binary URL exists
if curl -sSL -f --connect-timeout 5 -I "$DOWNLOAD_URL" &>/dev/null || curl -sSL -f --connect-timeout 5 -I "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}" &>/dev/null; then
  echo "Downloading binary asset..."
  if command -v curl &>/dev/null; then
    curl -sSL -f --connect-timeout 5 -o "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL" 2>/dev/null || curl -sSL -f --connect-timeout 5 -o "${TMP_DIR}/${ASSET}" "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"
    DOWNLOAD_SUCCESS=true
  elif command -v wget &>/dev/null; then
    wget --connect-timeout=5 -q -O "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL" 2>/dev/null || wget --connect-timeout=5 -q -O "${TMP_DIR}/${ASSET}" "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"
    DOWNLOAD_SUCCESS=true
  fi
fi

if [ "$DOWNLOAD_SUCCESS" = true ]; then
  echo "Extracting binary..."
  tar -xzf "${TMP_DIR}/${ASSET}" -C "$TMP_DIR" 2>/dev/null || true
  BINARY_SRC="${TMP_DIR}/am-cli"
  if [ ! -f "$BINARY_SRC" ] && [ -f "${TMP_DIR}/opencode" ]; then
    BINARY_SRC="${TMP_DIR}/opencode"
  fi
  if [ ! -f "$BINARY_SRC" ] && [ -f "${TMP_DIR}/am-cli.exe" ]; then
    BINARY_SRC="${TMP_DIR}/am-cli.exe"
  fi
  if [ -f "$BINARY_SRC" ]; then
    install -m 755 "$BINARY_SRC" "${INSTALL_DIR}/${BINARY_NAME}"
    echo "✅ Installed binary to ${INSTALL_DIR}/${BINARY_NAME}"
  fi
else
  echo "Notice: Prebuilt release binary (${ASSET}) not found on GitHub Releases."
  echo "Release binaries will be available once published to https://github.com/${REPO}/releases."
  echo "Proceeding with agent and skill configuration setup..."
fi

# ---- Install default global agents, skills, commands, and assets ----
CONFIG_AGENTS_DIRS=(
  "${HOME}/.config/am"
)

echo "Downloading and syncing agents, skills, commands, and assets..."

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
RAW_ZIP="/tmp/am-repo-$$.zip"
EXTRACT_DIR="/tmp/am-repo-$$"
mkdir -p "$EXTRACT_DIR"
REPO_AM_ASSETS=""

ASSET_TAR="${TMP_DIR}/am-assets.tar.gz"
ASSETS_URL="https://github.com/${REPO}/releases/latest/download/am-assets.tar.gz"

if curl -sSL -f --connect-timeout 5 -o "$ASSET_TAR" "$ASSETS_URL" 2>/dev/null || \
   curl -sSL -f --connect-timeout 5 -o "$ASSET_TAR" "https://github.com/${REPO}/releases/download/${VERSION}/am-assets.tar.gz" 2>/dev/null; then
  if tar -xzf "$ASSET_TAR" -C "$EXTRACT_DIR" 2>/dev/null; then
    REPO_AM_ASSETS=$(find "$EXTRACT_DIR" -maxdepth 3 -type d -name ".opencode" | head -n 1)
  fi
fi

if [ -z "$REPO_AM_ASSETS" ] || [ ! -d "$REPO_AM_ASSETS" ]; then
  if curl -sSL -f --connect-timeout 5 -o "$RAW_ZIP" "https://github.com/${REPO}/archive/refs/heads/dev.zip" 2>/dev/null; then
    if unzip -q "$RAW_ZIP" -d "$EXTRACT_DIR" 2>/dev/null; then
      REPO_AM_ASSETS=$(find "$EXTRACT_DIR" -maxdepth 3 -type d -name ".opencode" | head -n 1)
    fi
  fi
fi

if [ -z "$REPO_AM_ASSETS" ] || [ ! -d "$REPO_AM_ASSETS" ]; then
  if [ -d "$SCRIPT_DIR/.opencode" ]; then
    REPO_AM_ASSETS="$SCRIPT_DIR/.opencode"
  fi
fi

if [ -n "$REPO_AM_ASSETS" ] && [ -d "$REPO_AM_ASSETS" ]; then
  for target in "${CONFIG_AGENTS_DIRS[@]}"; do
    mkdir -p "$target"
    cp -r "$REPO_AM_ASSETS"/* "$target/" 2>/dev/null || true
    
    # Ensure agents directory has all agent markdown files (primary & subagents)
    mkdir -p "$target/agents" "$target/skills"
    if [ -d "$REPO_AM_ASSETS/agents" ]; then
      cp -r "$REPO_AM_ASSETS/agents"/* "$target/agents/" 2>/dev/null || true
    fi
    if [ -d "$REPO_AM_ASSETS/agent" ]; then
      mkdir -p "$target/agent"
      cp -r "$REPO_AM_ASSETS/agent"/* "$target/agent/" 2>/dev/null || true
    fi

    # Ensure skills directory has all standalone skills from skills/
    if [ -d "$REPO_AM_ASSETS/skills" ]; then
      cp -r "$REPO_AM_ASSETS/skills"/* "$target/skills/" 2>/dev/null || true
    fi

    # Copy all skill folders recursively (including references, resources, scripts, and .md files) from agents-context into skills/
    if [ -d "$REPO_AM_ASSETS/agents-context" ]; then
      find "$REPO_AM_ASSETS/agents-context" -type f -name "SKILL.md" | while read -r skill_file; do
        skill_parent=$(dirname "$skill_file")
        skill_dir=$(basename "$skill_parent")
        mkdir -p "$target/skills/$skill_dir"
        cp -r "$skill_parent"/* "$target/skills/$skill_dir/" 2>/dev/null || true
      done
    fi
  done
  echo "✅ Synced all agents, skills, commands, and .md assets!"
fi
rm -rf "$RAW_ZIP" "$EXTRACT_DIR"

# ---- Ensure on PATH ----
case ":${PATH}:" in
  *:"${INSTALL_DIR}":*) ;;
  *)
    SHELL_CONFIG=""
    case "${SHELL:-}" in
      */zsh) SHELL_CONFIG="${HOME}/.zshrc" ;;
      */bash) SHELL_CONFIG="${HOME}/.bashrc" ;;
      */fish) SHELL_CONFIG="${HOME}/.config/fish/config.fish" ;;
    esac
    if [ -n "$SHELL_CONFIG" ]; then
      mkdir -p "$(dirname "$SHELL_CONFIG")"
      echo "export PATH=\"${INSTALL_DIR}:\$PATH\"" >> "$SHELL_CONFIG"
      echo "Added ${INSTALL_DIR} to PATH in ${SHELL_CONFIG}"
      echo "Restart your shell or run: export PATH=\"${INSTALL_DIR}:\$PATH\""
    else
      echo "Add ${INSTALL_DIR} to your PATH manually."
    fi
    ;;
esac

echo ""
echo "✅ AM setup complete!"
echo "   Custom agents and skills installed to ~/.config/am/"

