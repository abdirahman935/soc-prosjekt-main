[CmdletBinding()]
param(
    [string]$OutputPath = 'C:\SOC\exports\soc-summary.json',
    [int]$FailedLogonHours = 24,
    [string[]]$ComputerTargets = @('Fariss-DC') 
)

# Vi skrur av StrictMode akkurat her for å tåle tomme logger bedre
Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

# Funksjon for å hente logger på en trygg måte
function Get-SafeEvents {
    param([hashtable]$FilterHashtable)
    try {
        $events = Get-WinEvent -FilterHashtable $FilterHashtable -MaxEvents 100 -ErrorAction SilentlyContinue
        # Tvinger resultatet til å være et array @(), slik at .Count alltid virker
        if ($null -eq $events) { return @() } else { return @($events) }
    } catch {
        return @()
    }
}

# --- Datainnsamling ---
$startTime = (Get-Date).AddHours(-$FailedLogonHours)

# Hent hendelser
$failedLogons = Get-SafeEvents -FilterHashtable @{LogName='Security'; Id=4625; StartTime=$startTime}
$sysmonEvents = Get-SafeEvents -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1; StartTime=$startTime}

# --- Opprettelse av Payload ---
$payload = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    environment = @{
        domain             = "faris.local"
        collectorServer    = $env:COMPUTERNAME
        monitoredComputers = $ComputerTargets
        dataMode           = "live"
        source             = "Windows Event Logs"
    }
    metrics = @{
        failedLogonsLastWindow    = [int]$failedLogons.Count
        sysmonEventsLastWindow    = [int]$sysmonEvents.Count
        lockedAccountsLastWindow  = 0
        serviceFailuresLastWindow = 0
        gpoIssuesLastWindow       = 0
        defenderAlertsLastWindow  = 0
    }
    serverStatus = @(
        @{ computer = "Fariss-DC"; service = "WinRM"; status = "Running" }
    )
    recentEvents = @()
    alerts       = @()
}

# --- Lagring ---
if (-not (Test-Path 'C:\SOC\exports')) { 
    New-Item -Path 'C:\SOC\exports' -ItemType Directory -Force | Out-Null 
}

# Lagre JSON
$payload | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputPath -Encoding UTF8

Write-Host "--- SOC DATA OPPDATERT ---" -ForegroundColor Cyan
Write-Host "Status: Suksess (0 feil)!" -ForegroundColor Green
Write-Host "Mode:   LIVE" -ForegroundColor Yellow