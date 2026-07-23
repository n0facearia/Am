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

if command -v curl &>/dev/null; then
  if curl -sSL -f --progress-bar -o "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL" 2>/dev/null || curl -sSL -f --progress-bar -o "${TMP_DIR}/${ASSET}" "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}" 2>/dev/null; then
    DOWNLOAD_SUCCESS=true
  fi
elif command -v wget &>/dev/null; then
  if wget -q -O "${TMP_DIR}/${ASSET}" "$DOWNLOAD_URL" 2>/dev/null || wget -q -O "${TMP_DIR}/${ASSET}" "https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}" 2>/dev/null; then
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

# ---- Install default global agents and skills ----
CONFIG_AGENTS_DIRS=(
  "${HOME}/.config/opencode/agents"
  "${HOME}/.opencode/agents"
)
CONFIG_SKILLS_DIRS=(
  "${HOME}/.config/opencode/skills"
  "${HOME}/.opencode/skills"
)

for d in "${CONFIG_AGENTS_DIRS[@]}"; do
  mkdir -p "$d"
done

for d in "${CONFIG_SKILLS_DIRS[@]}"; do
  mkdir -p "$d"
done

RAW_BASE="https://raw.githubusercontent.com/${REPO}/dev/.opencode"

echo "Installing custom agents..."
for agent in backend build documentation frontend orchestrator; do
  echo "  - ${agent}"
  for d in "${CONFIG_AGENTS_DIRS[@]}"; do
    curl -fsSL "${RAW_BASE}/agents/${agent}.md" -o "${d}/${agent}.md" 2>/dev/null || true
  done
done

echo "Installing custom skills..."
for skill in am-standards asset-sources effect; do
  echo "  - ${skill}"
  for d in "${CONFIG_SKILLS_DIRS[@]}"; do
    mkdir -p "${d}/${skill}"
    curl -fsSL "${RAW_BASE}/skills/${skill}/SKILL.md" -o "${d}/${skill}/SKILL.md" 2>/dev/null || true
  done
done

# Extra context skills
CONTEXT_SKILLS=(
  "frontend/frontend-ui-ux-pro-max"
  "frontend/frontend-html-projects"
  "frontend/frontend-css-projects"
  "frontend/frontend-javascript-projects"
  "global/global-vibe-coding"
  "global/global-claude-code"
  "global/global-full-stack"
  "backend/backend-nodejs-projects"
  "documentation/content-skills"
)

for path_skill in "${CONTEXT_SKILLS[@]}"; do
  skill_name=$(basename "$path_skill")
  for d in "${CONFIG_SKILLS_DIRS[@]}"; do
    mkdir -p "${d}/${skill_name}"
    curl -fsSL "${RAW_BASE}/agents-context/${path_skill}/SKILL.md" -o "${d}/${skill_name}/SKILL.md" 2>/dev/null || true
  done
done

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
echo "✅ AM setup complete!"
echo "   Custom agents and skills installed to ~/.config/opencode/ & ~/.opencode/"

