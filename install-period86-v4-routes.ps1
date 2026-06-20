# Collectium Period86 V4 Routes Installer
# Kjor fra prosjektrot etter at SQL compatibility views er kjort i Neon.
$ErrorActionPreference = "Stop"

$Root = Get-Location
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $Root "_collectium_backups\period86-v4-$Stamp"

New-Item -ItemType Directory -Path $Backup -Force | Out-Null
New-Item -ItemType Directory -Path "app\api\period86\row1\nodes" -Force | Out-Null
New-Item -ItemType Directory -Path "app\api\period86\row3\nodes" -Force | Out-Null
New-Item -ItemType Directory -Path "app\api\period86\timeline" -Force | Out-Null

$targets = @(
  "app\api\period86\row1\nodes\route.ts",
  "app\api\period86\row3\nodes\route.ts",
  "app\api\period86\timeline\route.ts"
)

foreach ($t in $targets) {
  if (Test-Path $t) {
    Copy-Item $t (Join-Path $Backup (($t -replace '[\\/:*?"<>| ]','_') + ".bak")) -Force
  }
}

Copy-Item "period86-routes\app\api\period86\row1\nodes\route.ts" "app\api\period86\row1\nodes\route.ts" -Force
Copy-Item "period86-routes\app\api\period86\row3\nodes\route.ts" "app\api\period86\row3\nodes\route.ts" -Force
Copy-Item "period86-routes\app\api\period86\timeline\route.ts" "app\api\period86\timeline\route.ts" -Force

Write-Host "[OK] Installed Period86 V4 route files" -ForegroundColor Green
Write-Host "[OK] Backup: $Backup" -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "npm run build" -ForegroundColor Yellow
