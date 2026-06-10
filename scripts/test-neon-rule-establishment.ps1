# COLLECTIUM SCRIPT HEADER
# Overskrift: Test Neon Rule Establishment API
# Formål: Tester at /api/system/neon-rule-establishment svarer etter deploy.
# Bruk: Kjør fra prosjektrot etter deploy til Vercel.

$Url = "https://app.collectium.no/api/system/neon-rule-establishment"
Write-Host "Tester: $Url" -ForegroundColor Cyan

try {
  $Response = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 30
  Write-Host "API OK" -ForegroundColor Green
  Write-Host "Scope: $($Response.source_key) / $($Response.object_group)"
  Write-Host "Canonical table: $($Response.canonical_neon_table)"
  Write-Host "Truth status: $($Response.rule_gate.truth_status)"
  Write-Host "Migration allowed: $($Response.rule_gate.migration_allowed)"
  Write-Host ""
  Write-Host "Svar til ChatGPT:" -ForegroundColor Yellow
  Write-Host $Response.svar_til_chatgpt
} catch {
  Write-Host "API FEIL" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}
