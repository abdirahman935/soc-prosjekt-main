[CmdletBinding()]
param(
    [string]$CollectorName = $env:COMPUTERNAME, 
    [string]$ExportPath = 'C:\SOC\exports'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error 'Kjør PowerShell som administrator.'
    return
}

# Oppretter nødvendige mapper
New-Item -Path 'C:\SOC' -ItemType Directory -Force | Out-Null
New-Item -Path $ExportPath -ItemType Directory -Force | Out-Null

# Konfigurerer WinRM og Event Collector
& winrm quickconfig -q 2>$null
& wecutil qc /q 2>$null

Write-Host "Collector er klargjort på: $CollectorName" -ForegroundColor Green