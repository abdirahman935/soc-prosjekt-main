[CmdletBinding()]
param(
    # Vi legger til DataPath her slik at PowerShell kjenner den igjen
    [string]$DataPath = 'C:\SOC\exports\soc-summary.json',
    [string]$ProjectRoot = "C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$backendPath = Join-Path $ProjectRoot "backend"

Write-Host "Starter SOC Dashboard med live data fra: $DataPath" -ForegroundColor Cyan

# Starter backend-serveren og sender med stien til din live JSON-fil
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; python server.py --data '$DataPath'"

Write-Host "Backend-serveren kjører nå i et eget blått vindu." -ForegroundColor Green
Write-Host "Du kan nå åpne frontend\index.html for å se live data fra Fariss-DC!" -ForegroundColor Yellow