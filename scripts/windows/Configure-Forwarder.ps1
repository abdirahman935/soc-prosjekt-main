[CmdletBinding()]
param(
    [string]$OutputPath = 'C:\SOC\exports\soc-summary.json',
    [int]$FailedLogonHours = 1,
    [int]$GeneralHours = 24,
    [int]$RecentEventCount = 25,
    # Vi bruker variablen ComputerTargets som er definert her:
    [string[]]$ComputerTargets = @('Fariss-DC') 
)

# Dette skriptet leser Windows-hendelser og lager en JSON-fil som dashboardet kan vise.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-SafeEvents {
    param(
        [Parameter(Mandatory)][hashtable]$FilterHashtable,
        [int]$MaxEvents = 250
    )

    try {
        $events = Get-WinEvent -FilterHashtable $FilterHashtable -MaxEvents $MaxEvents -ErrorAction SilentlyContinue
        return if ($null -eq $events) { @() } else { @($events) }
    } catch {
        return @()
    }
}

function Convert-Event {
    param([Parameter(Mandatory)]$Event)

    $message = $Event.Message
    if (-not $message) { $message = '' }

    $singleLineMessage = ($message -replace '\r', ' ' -replace '\n', ' ').Trim()
    if ($singleLineMessage.Length -gt 240) {
        $singleLineMessage = $singleLineMessage.Substring(0, 240) + '...'
    }

    return [pscustomobject]@{
        timeCreated = $Event.TimeCreated.ToString('s')
        machine = $Event.MachineName
        log = $Event.LogName
        id = $Event.Id
        level = if ($Event.LevelDisplayName) { $Event.LevelDisplayName } else { 'Informasjon' }
        provider = $Event.ProviderName
        message = $singleLineMessage
    }
}

function Get-ServiceStatusForDashboard {
    param([string[]]$Targets)

    $serviceMap = [ordered]@{
        'DNS' = 'DNS'
        'DHCP' = 'DHCPServer'
        'FileServer' = 'LanmanServer'
        'Collector' = 'Wecsvc'
        'WinRM' = 'WinRM'
    }

    $results = @()
    foreach ($target in $Targets) {
        foreach ($entry in $serviceMap.GetEnumerator()) {
            try {
                $service = Get-Service -ComputerName $target -Name $entry.Value -ErrorAction Stop
                $results += [pscustomobject]@{
                    computer = $target
                    role = $entry.Key
                    service = $entry.Value
                    status = $service.Status.ToString()
                }
            } catch {
                continue
            }
        }
    }
    return $results
}

function New-Alert {
    param(
        [Parameter(Mandatory)][string]$Severity,
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$Description
    )
    return [pscustomobject]@{
        severity = $Severity
        title = $Title
        description = $Description
    }
}

function Get-LabEnvironment {
    param([string[]]$Targets)

    try {
        $computerSystem = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop
    } catch {
        $computerSystem = $null
    }

    $domainName = 'Ukjent'
    if ($computerSystem) {
        if ($computerSystem.PartOfDomain -and $computerSystem.Domain) {
            $domainName = $computerSystem.Domain
        } elseif ($computerSystem.Workgroup) {
            $domainName = $computerSystem.Workgroup
        }
    }

    return [pscustomobject]@{
        domain = $domainName
        collectorServer = $env:COMPUTERNAME
        monitoredComputers = $Targets
        source = 'Windows Event Logs via PowerShell'
        dataMode = 'live'
    }
}

function Get-MachineActivity {
    param([object[]]$Events)
    if ($null -eq $Events -or $Events.Count -eq 0) { return @() }

    return @(
        $Events |
            Group-Object -Property MachineName |
            Sort-Object -Property Count -Descending |
            Select-Object -First 5 |
            ForEach-Object {
                [pscustomobject]@{
                    machine = $_.Name
                    eventCount = $_.Count
                }
            }
    )
}

# --- Datainnsamling starter her ---

$failedStart = (Get-Date).AddHours(-1 * $FailedLogonHours)
$generalStart = (Get-Date).AddHours(-1 * $GeneralHours)

$failedLogons = Get-SafeEvents -FilterHashtable @{LogName='Security'; Id=4625; StartTime=$failedStart} -MaxEvents 500
$lockedAccounts = Get-SafeEvents -FilterHashtable @{LogName='Security'; Id=4740; StartTime=$generalStart}
$serviceFailures = Get-SafeEvents -FilterHashtable @{LogName='System'; Id=7031, 7034; StartTime=$generalStart}
$gpoIssues = Get-SafeEvents -FilterHashtable @{LogName='Microsoft-Windows-GroupPolicy/Operational'; Id=1058, 1030; StartTime=$generalStart}
$defenderAlerts = Get-SafeEvents -FilterHashtable @{LogName='Microsoft-Windows-Windows Defender/Operational'; Id=1116, 1117, 1118, 1119; StartTime=$generalStart}
$sysmonEvents = Get-SafeEvents -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1, 3, 11, 13, 22; StartTime=$generalStart} -MaxEvents 500

$allEvents = @($failedLogons; $lockedAccounts; $serviceFailures; $gpoIssues; $defenderAlerts; $sysmonEvents)

$recentEvents = $allEvents | Sort-Object -Property TimeCreated -Descending | Select-Object -First $RecentEventCount | ForEach-Object {
    Convert-Event -Event $_
}

$alerts = @()
if ($failedLogons.Count -ge 10) { $alerts += New-Alert -Severity 'high' -Title 'Mange mislykkede pålogginger' -Description "$($failedLogons.Count) feil siste $FailedLogonHours t." }
if ($lockedAccounts.Count -ge 1) { $alerts += New-Alert -Severity 'medium' -Title 'Låste kontoer' -Description "$($lockedAccounts.Count) kontoer låst." }
if ($defenderAlerts.Count -ge 1) { $alerts += New-Alert -Severity 'high' -Title 'Defender varsel' -Description "Sikkerhetstrussel funnet!" }

# --- DISSE TO LINJENE ER NÅ FIKSET ---
$serviceStatus = Get-ServiceStatusForDashboard -Targets $ComputerTargets
$labEnvironment = Get-LabEnvironment -Targets $ComputerTargets
# -------------------------------------

$machineActivity = Get-MachineActivity -Events $allEvents

$payload = [pscustomobject]@{
    generatedAt = (Get-Date).ToString('s')
    environment = $labEnvironment
    metrics = [pscustomobject]@{
        failedLogonsLastWindow = $failedLogons.Count
        lockedAccountsLastWindow = $lockedAccounts.Count
        serviceFailuresLastWindow = $serviceFailures.Count
        gpoIssuesLastWindow = $gpoIssues.Count
        defenderAlertsLastWindow = $defenderAlerts.Count
        sysmonEventsLastWindow = $sysmonEvents.Count
    }
    alerts = $alerts
    serverStatus = $serviceStatus
    machineActivity = $machineActivity
    recentEvents = $recentEvents
}

$outputDirectory = Split-Path -Path $OutputPath -Parent
if ($outputDirectory) { New-Item -Path $outputDirectory -ItemType Directory -Force | Out-Null }
$payload | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8

Write-Host "SOC-data er nå oppdatert i: $OutputPath" -ForegroundColor Green