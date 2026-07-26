#!/usr/bin/env bash
set -euo pipefail

# AM Desktop — one-command build & install for Linux
# Usage: ./install-desktop.sh [--channel dev|beta|prod]

CHANNEL="${AM_CHANNEL:-${OPENCODE_CHANNEL:-prod}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --channel) CHANNEL="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_DIR="$REPO_ROOT/packages/desktop"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

echo "==> Building AM Desktop (channel: $CHANNEL)"

# Step 1: Build the web app that the desktop shell embeds
echo "    [1/3] Building web app..."
(cd "$REPO_ROOT/packages/app" && bun run build)

# Step 2: Build the Electron shell (triggers prebuild → node binary + icons)
echo "    [2/3] Building Electron app..."
(cd "$DESKTOP_DIR" && AM_CHANNEL="$CHANNEL" OPENCODE_CHANNEL="$CHANNEL" bun run build)

# Step 3: Package into AppImage
echo "    [3/3] Packaging AppImage..."
(cd "$DESKTOP_DIR" && AM_CHANNEL="$CHANNEL" OPENCODE_CHANNEL="$CHANNEL" bun run package:linux)

# Find the produced AppImage
APPIMAGE=$(find "$DESKTOP_DIR/dist" -maxdepth 1 -name '*.AppImage' | head -1)
if [[ -z "$APPIMAGE" ]]; then
  echo "ERROR: No AppImage found in $DESKTOP_DIR/dist"
  exit 1
fi

# Install
mkdir -p "$INSTALL_DIR"
cp "$APPIMAGE" "$INSTALL_DIR/am-desktop"
chmod +x "$INSTALL_DIR/am-desktop"

echo ""
echo "==> Installed! Run with:"
echo "    am-desktop"
echo ""
echo "    AppImage kept at: $APPIMAGE"
echo "    To uninstall: rm $INSTALL_DIR/am-desktop"
