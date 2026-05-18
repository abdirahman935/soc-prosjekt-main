[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SysmonZipPath,
    [Parameter(Mandatory)][string]$ConfigPath,
    [string]$InstallPath = 'C:\SOC\Tools\Sysmon'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error 'Kjør PowerShell som administrator for å installere Sysmon.'
    return
}

# Oppretter mappen hvis den ikke finnes
if (-not (Test-Path $InstallPath)) { New-Item -Path $InstallPath -ItemType Directory -Force | Out-Null }

# Pakker ut Sysmon-arkivet
Write-Host "Pakker ut Sysmon til $InstallPath..." -ForegroundColor Cyan
Expand-Archive -Path $SysmonZipPath -DestinationPath $InstallPath -Force

$sysmonExe = Join-Path $InstallPath 'Sysmon64.exe'

# Sjekker om Sysmon allerede er installert for å avgjøre om vi skal oppdatere eller nyinstallere
$existingService = Get-Service -Name 'Sysmon64' -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "Oppdaterer Sysmon-konfigurasjon..." -ForegroundColor Yellow
    & $sysmonExe -accepteula -c $ConfigPath
} else {
    Write-Host "Installerer Sysmon..." -ForegroundColor Green
    & $sysmonExe -accepteula -i $ConfigPath
}