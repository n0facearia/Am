# AM CLI — Windows one-line install script
# Usage: irm https://raw.githubusercontent.com/n0facearia/Am/dev/install.ps1 | iex

$Repo = "n0facearia/Am"
$Version = "v1.0.0"
$BinaryName = "am-cli.exe"

$Arch = switch ($env:PROCESSOR_ARCHITECTURE) {
  "AMD64"  { "x64" }
  "ARM64"  { "arm64" }
  default  { "x64" }
}

$Asset = "am-cli-windows-$Arch.zip"
$DownloadUrl = "https://github.com/$Repo/releases/download/$Version/$Asset"
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\AM"

Write-Host "Downloading AM CLI $Version for Windows/$Arch..." -ForegroundColor Cyan

$TmpDir = Join-Path $env:TEMP "am-install-$(Get-Random)"
New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null
$ZipPath = Join-Path $TmpDir $Asset

$DownloadSuccess = $false
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing -ErrorAction SilentlyContinue
  if (Test-Path $ZipPath) {
    $DownloadSuccess = $true
  }
} catch {
  Write-Host "Notice: Prebuilt release asset ($Asset) not found on GitHub Releases." -ForegroundColor Yellow
}

if ($DownloadSuccess) {
  Write-Host "Extracting..."
  try {
    Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force
  } catch {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $TmpDir)
  }

  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  $ExeSource = Join-Path $TmpDir $BinaryName
  if (Test-Path $ExeSource) {
    Copy-Item -Path $ExeSource -Destination (Join-Path $InstallDir $BinaryName) -Force
    Write-Host "Installed binary to $InstallDir\$BinaryName" -ForegroundColor Green
  }
} else {
  Write-Host "Proceeding with agent and skill configuration setup..." -ForegroundColor Cyan
}

# ---- Add to PATH (User scope) ----
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
  $NewPath = "$InstallDir;$UserPath"
  [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
  $env:Path = "$InstallDir;$env:Path"
}

# ---- Sync Agents, Skills, Commands & Assets ----
$ConfigDirs = @(
  (Join-Path $env:USERPROFILE ".config\am")
)

$ProgressPreference = 'Continue'
Write-Host "Downloading and syncing all agents, skills, commands, and assets..." -ForegroundColor Cyan

$AssetsUrl = "https://github.com/$Repo/releases/latest/download/am-assets.zip"
$AssetsZip = Join-Path $TmpDir "am-assets.zip"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/dev.zip"
$ZipFile = Join-Path $TmpDir "dev.zip"
$ExtractPath = Join-Path $TmpDir "extracted"

try {
  Invoke-WebRequest -Uri $AssetsUrl -OutFile $AssetsZip -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
  if (Test-Path $AssetsZip) {
    Expand-Archive -Path $AssetsZip -DestinationPath $ExtractPath -Force -ErrorAction SilentlyContinue
  } else {
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile -UseBasicParsing -ErrorAction SilentlyContinue
    if (Test-Path $ZipFile) {
      Expand-Archive -Path $ZipFile -DestinationPath $ExtractPath -Force -ErrorAction SilentlyContinue
    }
  }
  if (Test-Path $ExtractPath) {
    $AmAssetsFolder = Get-ChildItem -Path $ExtractPath -Recurse -Directory -Filter ".opencode" | Select-Object -First 1
    if ($AmAssetsFolder) {
      foreach ($target in $ConfigDirs) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path "$($AmAssetsFolder.FullName)\*" -Destination $target -Recurse -Force -ErrorAction SilentlyContinue
        
        $AgentsTarget = Join-Path $target "agents"
        $SkillsTarget = Join-Path $target "skills"
        New-Item -ItemType Directory -Path $AgentsTarget -Force | Out-Null
        New-Item -ItemType Directory -Path $SkillsTarget -Force | Out-Null

        if (Test-Path "$($AmAssetsFolder.FullName)\agents") {
          Copy-Item -Path "$($AmAssetsFolder.FullName)\agents\*" -Destination $AgentsTarget -Recurse -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path "$($AmAssetsFolder.FullName)\agent") {
          $AgentTargetSingle = Join-Path $target "agent"
          New-Item -ItemType Directory -Path $AgentTargetSingle -Force | Out-Null
          Copy-Item -Path "$($AmAssetsFolder.FullName)\agent\*" -Destination $AgentTargetSingle -Recurse -Force -ErrorAction SilentlyContinue
        }
      }
      Write-Host "✅ Synced all agents, skills, commands, and assets!" -ForegroundColor Green
    }
  }
} catch {
  Write-Host "Warning: Asset sync encountered an issue, proceeding..." -ForegroundColor Yellow
}

# Cleanup
Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ AM setup complete!" -ForegroundColor Green
Write-Host "   Custom agents and skills installed to $env:USERPROFILE\.config\am"
