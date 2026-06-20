$ErrorActionPreference = "Continue"

$BaseUrl = "https://app.collectium.no"
$Endpoints = @(
  "/api/period86/row1/nodes?master=Norge&type=konge&from=1507&to=2024&limit=200",
  "/api/period86/row1/nodes?master=Norge&type=statsoverhode&from=1507&to=2024&limit=200",
  "/api/period86/row1/nodes?master=Norge&type=union&from=1507&to=2024&limit=200",
  "/api/period86/row2/nodes?master=Norge&type=nasjonale_perioder&from=1507&to=2024&limit=200",
  "/api/period86/row3/nodes?master=Norge&type=krig_konflikt&from=1507&to=2024&limit=200",
  "/api/period86/timeline?master=Norge&object_group=banknote&from=1507&to=2024"
)

foreach ($Endpoint in $Endpoints) {
  $Url = $BaseUrl + $Endpoint
  Write-Host ""
  Write-Host "GET $Url" -ForegroundColor Cyan

  try {
    $Response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 30
    $Json = $Response | ConvertTo-Json -Depth 20

    $Count = 0
    if ($Response.items) { $Count = $Response.items.Count }
    elseif ($Response.nodes) { $Count = $Response.nodes.Count }
    elseif ($Response.rows) { $Count = $Response.rows.Count }
    elseif ($Response.data) { $Count = $Response.data.Count }

    Write-Host "[OK] Response. Count guess: $Count" -ForegroundColor Green

    if ($Json -notmatch "start_year") {
      Write-Host "[ERROR] Missing start_year" -ForegroundColor Red
    }

    if ($Json -notmatch "end_year") {
      Write-Host "[ERROR] Missing end_year" -ForegroundColor Red
    }

    $OutFile = Join-Path (Get-Location) ("period86-api-v2-" + (($Endpoint -replace '[^a-zA-Z0-9]+','-').Trim('-')) + ".json")
    Set-Content -Path $OutFile -Value $Json -Encoding UTF8
    Write-Host "[OK] Saved $OutFile" -ForegroundColor Green
  } catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  }
}
