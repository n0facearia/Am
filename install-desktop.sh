#!/usr/bin/env bash
set -euo pipefail

# AM Desktop — one-line install script (Linux only)
# Usage: curl -fsSL https://raw.githubusercontent.com/n0facearia/Am/dev/install-desktop.sh | bash
#
# Downloads and installs the AM Desktop application on Linux.
# Uses AppImage (universal) or .deb (Debian/Ubuntu).

REPO="n0facearia/Am"
VERSION="v0.1.0"

# ---- Distro detection ----
IS_DEBIAN=false
if [ -f /etc/os-release ]; then
  . /etc/os-release
  case "$ID" in
    debian|ubuntu|linuxmint|pop|elementary|zorin) IS_DEBIAN=true ;;
  esac
fi

install_appimage() {
  local dest="${HOME}/.local/bin/am-desktop"
  mkdir -p "${HOME}/.local/bin"

  local url="https://github.com/${REPO}/releases/download/${VERSION}/am-desktop-linux-x86_64.AppImage"
  echo "Downloading AM Desktop AppImage..."
  curl -fL --progress-bar -o "$dest" "$url"
  chmod +x "$dest"

  # Desktop entry
  local apps_dir="${HOME}/.local/share/applications"
  local icon_dir="${HOME}/.local/share/icons/hicolor/256x256/apps"
  mkdir -p "$icon_dir" "$apps_dir"

  # Generate a simple icon
  cat > "${icon_dir}/am-desktop.svg" << 'ICONEOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect width="256" height="256" rx="40" fill="#a78bfa"/>
  <text x="128" y="168" font-family="system-ui, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">AM</text>
</svg>
ICONEOF

  cat > "${apps_dir}/am-desktop.desktop" << DESKTOPFILE
[Desktop Entry]
Name=AM Desktop
Comment=AI-powered coding assistant
Exec=${dest}
Icon=${icon_dir}/am-desktop.svg
Terminal=false
Type=Application
Categories=Development;
StartupWMClass=am.desktop
DESKTOPFILE

  update-desktop-database "$apps_dir" 2>/dev/null || true

  echo ""
  echo "✅ AM Desktop installed to ${dest}"
  echo "   Run with: am-desktop"
  echo "   Or launch from your application menu."
}

install_deb() {
  local url="https://github.com/${REPO}/releases/download/${VERSION}/am-desktop-linux-amd64.deb"
  local tmp_deb="/tmp/am-desktop.deb"

  echo "Downloading AM Desktop .deb package..."
  curl -fL --progress-bar -o "$tmp_deb" "$url"

  echo "Installing via dpkg..."
  if ! sudo dpkg -i "$tmp_deb" 2>/dev/null; then
    echo "dpkg failed — trying to fix dependencies..."
    sudo apt-get install -f -y
    sudo dpkg -i "$tmp_deb"
  fi

  rm -f "$tmp_deb"

  echo ""
  echo "✅ AM Desktop installed via .deb!"
  echo "   Run with: am-desktop"
  echo "   Or launch from your application menu."
}

# Main: prefer .deb on Debian/Ubuntu, AppImage everywhere else
if [ "$IS_DEBIAN" = true ] && command -v sudo &>/dev/null; then
  install_deb
else
  install_appimage
fi
