#!/bin/bash
echo "Testing am-desktop script:"
cat /home/n0face/.local/bin/am-desktop
echo "Executing am-desktop --version:"
/home/n0face/.local/bin/am-desktop --version
echo "Executing explicit --version:"
/home/n0face/Documents/Vscode\ projects/Am-Project/packages/desktop/dist/linux-unpacked/am.desktop.dev --version
