<#
COLLECTIUM FILE HEADER

Overskrift:
Install Min side React arkivmappe v1

Definering / formål:
Installerer Next.js/React-filer for Min side, tar backup av berørte filer,
lager manifest og kan rulle tilbake.

Bruksområde:
Kjøres lokalt i PowerShell fra nedlastet pakke.

Berørte sider / routes:
- /min-side

Berørte filer:
- app/min-side/page.tsx
- components/account/*

Versjon:
CT-SCRIPT-MINSIDE-0001 / CHANGE-2026-06-11-0001
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectRoot,

  [string]$PackageRoot = "",

  [switch]$DryRun,
  [switch]$Rollback,
  [string]$ManifestPath = "",
  [switch]$NoGit,
  [string]$BranchName = "feature/min-side-arkivmappe-react-v1"
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message" -ForegroundColor Cyan
}

function Assert-ProjectRoot($Root) {
  if (!(Test-Path $Root)) { throw "ProjectRoot finnes ikke: $Root" }
  if (!(Test-Path (Join-Path $Root "package.json"))) { throw "package.json mangler. Ikke riktig prosjektrot." }
  if (!(Test-Path (Join-Path $Root "app"))) { throw "app/ mangler. Ikke Next.js App Router-prosjektrot." }
  if (!(Test-Path (Join-Path $Root ".git"))) { throw ".git mangler. Ikke Git-repo." }
}

function Get-RelativePath($Base, $Path) {
  $baseFull = [System.IO.Path]::GetFullPath($Base).TrimEnd('\') + '\'
  $pathFull = [System.IO.Path]::GetFullPath($Path)
  return $pathFull.Substring($baseFull.Length).Replace('\','/')
}

Assert-ProjectRoot $ProjectRoot

if ([string]::IsNullOrWhiteSpace($PackageRoot)) {
  $PackageRoot = Split-Path -Parent $PSScriptRoot
}

if (!(Test-Path $PackageRoot)) { throw "PackageRoot finnes ikke: $PackageRoot" }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot "docs/backups/min-side-react-arkivmappe-v1/$timestamp"
$manifestDir = Join-Path $ProjectRoot "docs/deploy-manifests"
$manifestFile = Join-Path $manifestDir "min-side-react-arkivmappe-v1-$timestamp.json"

$files = @(
  "app/min-side/page.tsx",
  "components/account/MinSideShell.tsx",
  "components/account/MinSideArchiveTabs.tsx",
  "components/account/MinSideOverview.tsx",
  "components/account/MinSidePanel.tsx",
  "components/account/MinSide.module.css",
  "components/account/min-side-data.ts",
  "components/account/min-side-types.ts",
  "docs/README-min-side-react-arkivmappe-v1.md"
)

if ($Rollback) {
  if ([string]::IsNullOrWhiteSpace($ManifestPath)) { throw "Rollback krever -ManifestPath" }
  if (!(Test-Path $ManifestPath)) { throw "Manifest finnes ikke: $ManifestPath" }

  Write-Step "Leser rollback-manifest"
  $manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json

  foreach ($file in $manifest.files) {
    $target = Join-Path $ProjectRoot $file.relativePath
    if ($file.hadBackup -eq $true) {
      $backup = Join-Path $ProjectRoot $file.backupRelativePath
      Write-Host "Gjenoppretter: $($file.relativePath)"
      if (!$DryRun) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
        Copy-Item -Force $backup $target
      }
    } else {
      Write-Host "Sletter ny fil: $($file.relativePath)"
      if (!$DryRun -and (Test-Path $target)) {
        Remove-Item -Force $target
      }
    }
  }

  if (!$NoGit) {
    Write-Step "Git status etter rollback"
    git -C $ProjectRoot status --short
  }

  Write-Host "Rollback ferdig." -ForegroundColor Green
  exit 0
}

Write-Step "Installerer Min side React arkivmappe v1"
Write-Host "ProjectRoot: $ProjectRoot"
Write-Host "PackageRoot: $PackageRoot"
Write-Host "DryRun: $DryRun"

$manifestItems = @()

foreach ($relative in $files) {
  $source = Join-Path $PackageRoot $relative
  $target = Join-Path $ProjectRoot $relative
  if (!(Test-Path $source)) { throw "Kildefil mangler i pakken: $relative" }

  $hadBackup = $false
  $backupRelative = $null

  if (Test-Path $target) {
    $hadBackup = $true
    $backupTarget = Join-Path $backupRoot $relative
    $backupRelative = Get-RelativePath $ProjectRoot $backupTarget
    Write-Host "Backup: $relative"
    if (!$DryRun) {
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backupTarget) | Out-Null
      Copy-Item -Force $target $backupTarget
    }
  }

  Write-Host "Kopierer: $relative"
  if (!$DryRun) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
    Copy-Item -Force $source $target
  }

  $manifestItems += [ordered]@{
    relativePath = $relative
    hadBackup = $hadBackup
    backupRelativePath = $backupRelative
  }
}

$manifest = [ordered]@{
  name = "min-side-react-arkivmappe-v1"
  createdAt = (Get-Date).ToString("o")
  projectRoot = $ProjectRoot
  branchName = $BranchName
  files = $manifestItems
  rollbackCommand = "powershell -ExecutionPolicy Bypass -File scripts/install-min-side-react-arkivmappe-v1.ps1 -ProjectRoot `"$ProjectRoot`" -Rollback -ManifestPath `"$manifestFile`""
}

Write-Step "Skriver manifest"
if (!$DryRun) {
  New-Item -ItemType Directory -Force -Path $manifestDir | Out-Null
  ($manifest | ConvertTo-Json -Depth 8) | Set-Content -Encoding UTF8 $manifestFile
}
Write-Host $manifestFile

if (!$NoGit) {
  Write-Step "Git branch/status"
  if (!$DryRun) {
    git -C $ProjectRoot checkout -B $BranchName
    git -C $ProjectRoot add app/min-side components/account docs/README-min-side-react-arkivmappe-v1.md docs/deploy-manifests
    git -C $ProjectRoot commit -m "Add Min side React archive folder design v1"
    git -C $ProjectRoot push -u origin $BranchName
  } else {
    git -C $ProjectRoot status --short
  }
}

Write-Host "Installasjon ferdig." -ForegroundColor Green
Write-Host "Rollback-manifest: $manifestFile"
