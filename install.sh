#!/usr/bin/env bash
set -euo pipefail

# AM CLI — one-line install script
# Usage: curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install.sh | bash
#
# Supported platforms:
#   Linux (x86_64, arm64, x86_64-baseline) — glibc or musl
#   macOS (arm64, x64, x64-baseline)

REPO="n0facearia/Am"
VERSION="v0.1.0"
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
  ASSET="am-cli-${OS}-${ARCH}.zip"
  EXTRACT_CMD="unzip -q"
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"

# ---- Determine install directory ----
INSTALL_DIR="${HOME}/.local/bin"

# Create install dir if needed
mkdir -p "$INSTALL_DIR"

# ---- Download & install ----
echo "Downloading AM CLI ${VERSION} for ${OS}/${ARCH}${SUFFIX}..."
echo "  ${DOWNLOAD_URL}"

TMP_DIR=$(mktemp -d)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# Download with progress
if command -v curl &>/dev/null; then
  curl -fsSL --progress-bar -o "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL"
elif command -v wget &>/dev/null; then
  wget -q --show-progress -O "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL"
else
  echo "FATAL: neither curl nor wget found — install one of them first."
  exit 1
fi

echo "Extracting..."
if [ "$OS" = "linux" ]; then
  tar -xzf "${TMP_DIR}/${ASSET}" -C "$TMP_DIR"
else
  unzip -q "${TMP_DIR}/${ASSET}" -d "$TMP_DIR"
fi

# The archive contains the binary at the root
BINARY_SRC="${TMP_DIR}/am-cli"
if [ ! -f "$BINARY_SRC" ] && [ -f "${TMP_DIR}/am-cli.exe" ]; then
  BINARY_SRC="${TMP_DIR}/am-cli.exe"
fi

if [ ! -f "$BINARY_SRC" ]; then
  echo "FATAL: binary not found in archive — archive may be corrupt."
  ls -la "$TMP_DIR"
  exit 1
fi

install -m 755 "$BINARY_SRC" "${INSTALL_DIR}/${BINARY_NAME}"
echo "Installed to ${INSTALL_DIR}/${BINARY_NAME}"

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
      echo "export PATH=\"${INSTALL_DIR}:\$PATH\"" >> "$SHELL_CONFIG"
      echo "Added ${INSTALL_DIR} to PATH in ${SHELL_CONFIG}"
      echo "Restart your shell or run: export PATH=\"${INSTALL_DIR}:\$PATH\""
    else
      echo "Add ${INSTALL_DIR} to your PATH manually."
    fi
    ;;
esac

echo ""
echo "✅ AM CLI installed! Run 'am-cli --version' to verify."
echo "   Start a session:  am-cli"
echo "   Need help?        am-cli --help"
