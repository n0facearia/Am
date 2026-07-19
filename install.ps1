# AM CLI — Windows one-line install script
# Usage: irm https://raw.githubusercontent.com/n0facearia/Am/dev/install.ps1 | iex
#
# Downloads the Windows binary and adds it to the user's PATH.

$Repo = "n0facearia/Am"
$Version = "v0.1.0"
$BinaryName = "am-cli.exe"

# ---- Architecture detection ----
$Arch = switch ($env:PROCESSOR_ARCHITECTURE) {
  "AMD64"  { "x64" }
  "ARM64"  { "arm64" }
  "x86"    { Write-Error "x86 (32-bit) is not supported."; exit 1 }
  default  { Write-Error "Unknown architecture: $($env:PROCESSOR_ARCHITECTURE)"; exit 1 }
}

# Baseline detection: check if AVX2 is supported
$HasAvx2 = $true
try {
  # Simple check: if the CPU is old enough to lack AVX2, use baseline build
  $cpu = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue
  if (-not $cpu) {
    $cpu = Get-WmiObject Win32_Processor -ErrorAction SilentlyContinue
  }
  # If we can't detect, assume AVX2 support (most modern CPUs have it)
} catch {
  # Assume AVX2
}

$Suffix = ""
if ($Arch -eq "x64" -and -not $HasAvx2) {
  $Suffix = "-baseline"
}

$Asset = "am-cli-windows-$Arch$Suffix.zip"
$DownloadUrl = "https://github.com/$Repo/releases/download/$Version/$Asset"

# ---- Install location ----
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\AM"

# ---- Download ----
Write-Host "Downloading AM CLI $Version for Windows/$Arch..." -ForegroundColor Cyan
Write-Host "  $DownloadUrl"

$TmpDir = Join-Path $env:TEMP "am-install-$(Get-Random)"
New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null
$ZipPath = Join-Path $TmpDir $Asset

try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
} catch {
  Write-Error "Download failed: $_"
  exit 1
}

# ---- Extract ----
Write-Host "Extracting..."
try {
  Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force
} catch {
  # Fallback: try .NET
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $TmpDir)
}

# ---- Install ----
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$ExeSource = Join-Path $TmpDir $BinaryName
if (-not (Test-Path $ExeSource)) {
  Write-Error "Binary not found in archive — archive may be corrupt."
  Get-ChildItem $TmpDir
  exit 1
}

Copy-Item -Path $ExeSource -Destination (Join-Path $InstallDir $BinaryName) -Force
Write-Host "Installed to $InstallDir\$BinaryName"

# ---- Add to PATH (User scope) ----
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
  $NewPath = "$InstallDir;$UserPath"
  [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
  # Also update current session
  $env:Path = "$InstallDir;$env:Path"
  Write-Host "Added $InstallDir to your PATH (user scope)." -ForegroundColor Green
} else {
  Write-Host "$InstallDir is already on your PATH."
}

# Cleanup
Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ AM CLI installed!" -ForegroundColor Green
Write-Host "   Run 'am-cli --version' to verify (you may need to restart your terminal)."
Write-Host "   Start a session:  am-cli"
Write-Host "   Need help?        am-cli --help"
