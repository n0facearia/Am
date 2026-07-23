# AM Desktop — Windows one-line install script
# Usage: irm https://raw.githubusercontent.com/n0facearia/Am/dev/install-desktop.ps1 | iex

$Repo = "n0facearia/Am"
$Version = "v1.0.0"

$Arch = switch ($env:PROCESSOR_ARCHITECTURE) {
  "AMD64" { "x64" }
  "ARM64" { "arm64" }
  default { "x64" }
}

$Asset = "am-desktop-win-$Arch.exe"
$DownloadUrl = "https://github.com/$Repo/releases/download/$Version/$Asset"
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\AM Desktop"

Write-Host "Downloading AM Desktop for Windows ($Arch)..." -ForegroundColor Cyan

$TmpDir = Join-Path $env:TEMP "am-desktop-install-$(Get-Random)"
New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null
$InstallerPath = Join-Path $TmpDir $Asset

try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $DownloadUrl -OutFile $InstallerPath -UseBasicParsing -ErrorAction SilentlyContinue
  if (Test-Path $InstallerPath) {
    Write-Host "Installing AM Desktop..." -ForegroundColor Green
    Start-Process -FilePath $InstallerPath -ArgumentList "/S" -Wait
    Write-Host "✅ Installed AM Desktop to $InstallDir" -ForegroundColor Green
  } else {
    Write-Host "Notice: Prebuilt desktop release ($Asset) not found on GitHub Releases." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Notice: Prebuilt desktop installer not available on GitHub Releases yet." -ForegroundColor Yellow
}

# ---- Sync Agents, Skills, Commands & Assets ----
$ConfigDirs = @(
  (Join-Path $env:USERPROFILE ".config\opencode"),
  (Join-Path $env:USERPROFILE ".opencode")
)

Write-Host "Syncing all agents, skills, commands, and assets..." -ForegroundColor Cyan

$ZipUrl = "https://github.com/$Repo/archive/refs/heads/dev.zip"
$ZipFile = Join-Path $TmpDir "dev.zip"
$ExtractPath = Join-Path $TmpDir "extracted"

try {
  Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile -UseBasicParsing -ErrorAction SilentlyContinue
  if (Test-Path $ZipFile) {
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractPath -Force -ErrorAction SilentlyContinue
    $OpencodeFolder = Get-ChildItem -Path $ExtractPath -Recurse -Directory -Filter ".opencode" | Select-Object -First 1
    if ($OpencodeFolder) {
      foreach ($target in $ConfigDirs) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path "$($OpencodeFolder.FullName)\*" -Destination $target -Recurse -Force -ErrorAction SilentlyContinue
        
        $AgentsTarget = Join-Path $target "agents"
        $SkillsTarget = Join-Path $target "skills"
        New-Item -ItemType Directory -Path $AgentsTarget -Force | Out-Null
        New-Item -ItemType Directory -Path $SkillsTarget -Force | Out-Null

        if (Test-Path "$($OpencodeFolder.FullName)\agents") {
          Copy-Item -Path "$($OpencodeFolder.FullName)\agents\*" -Destination $AgentsTarget -Recurse -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path "$($OpencodeFolder.FullName)\agent") {
          Copy-Item -Path "$($OpencodeFolder.FullName)\agent\*" -Destination $AgentsTarget -Recurse -Force -ErrorAction SilentlyContinue
        }
      }
      Write-Host "✅ Synced all agents, skills, commands, and assets!" -ForegroundColor Green
    }
  }
} catch {
  Write-Host "Warning: Asset sync encountered an issue, proceeding..." -ForegroundColor Yellow
}

Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ AM Desktop setup complete!" -ForegroundColor Green
Write-Host "   Custom agents and skills configured in $env:USERPROFILE\.config\opencode & $env:USERPROFILE\.opencode"
