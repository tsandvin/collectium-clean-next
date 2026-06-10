$ErrorActionPreference = "Stop"

$BaseUrl = "https://app.collectium.no"

$Tests = @(
  "$BaseUrl/api/system/migration/import-catalog-staging?mode=preview&source_key=norske_sedler&object_group=banknote&limit=5",
  "$BaseUrl/api/system/migration/import-catalog-staging?mode=preview&source_key=norske_mynter&object_group=coin&limit=5",
  "$BaseUrl/api/system/migration/import-catalog-staging?mode=import&source_key=norske_sedler&object_group=banknote&limit=50",
  "$BaseUrl/api/system/migration/import-catalog-staging?mode=import&source_key=norske_mynter&object_group=coin&limit=50"
)

foreach ($Url in $Tests) {
  Write-Host ""
  Write-Host "TEST:"
  Write-Host $Url
  try {
    $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing
    Write-Host "Status:" $Response.StatusCode
    $Response.Content
  } catch {
    Write-Host "FEIL:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
      Write-Host $_.ErrorDetails.Message
    }
  }
}
