$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $projectRoot "frontend"
$backendJavaPath = Join-Path $projectRoot "backend-java"
$stockAssistantPath = Join-Path $projectRoot "stock-analysis-helper"
$stockAssistantFrontendPath = Join-Path $stockAssistantPath "stock-analysis-helper-frontend"
$envPath = Join-Path $projectRoot ".env"
$backendPort = "3000"
$stockAssistantApiUrl = "http://localhost:8081/api"
$stockAssistantUrl = "http://localhost:5174/index.html"

if (Test-Path -LiteralPath $envPath -PathType Leaf) {
    $envLines = Get-Content -LiteralPath $envPath
    $portLine = $envLines | Where-Object { $_ -match "^\s*PORT\s*=" } | Select-Object -First 1
    $assistantUrlLine = $envLines | Where-Object { $_ -match "^\s*VITE_STOCK_ASSISTANT_URL\s*=" } | Select-Object -First 1

    if ($portLine -and $portLine -match "^\s*PORT\s*=\s*(.+?)\s*$") {
        $backendPort = $Matches[1].Trim('"').Trim("'")
    }

    if ($assistantUrlLine -and $assistantUrlLine -match "^\s*VITE_STOCK_ASSISTANT_URL\s*=\s*(.+?)\s*$") {
        $stockAssistantUrl = $Matches[1].Trim('"').Trim("'")
    }
}

function ConvertTo-QuotedPowerShellLiteral {
    param([Parameter(Mandatory = $true)][string]$Value)
    return "'" + ($Value -replace "'", "''") + "'"
}

function Resolve-ToolPath {
    param(
        [Parameter(Mandatory = $true)][string[]]$Names,
        [string[]]$EnvVars = @(),
        [string[]]$RelativePaths = @()
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    foreach ($envVar in $EnvVars) {
        foreach ($scope in @("Process", "User", "Machine")) {
            $root = [Environment]::GetEnvironmentVariable($envVar, $scope)
            if (-not $root) {
                continue
            }

            foreach ($relativePath in $RelativePaths) {
                $candidate = Join-Path $root $relativePath
                if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                    return $candidate
                }
            }
        }
    }

    throw "Could not find $($Names -join '/') on PATH or via $($EnvVars -join '/')."
}

$mvn = Resolve-ToolPath `
    -Names @("mvn.cmd", "mvn") `
    -EnvVars @("MAVEN_HOME", "M2_HOME") `
    -RelativePaths @("bin\mvn.cmd", "bin\mvn")

$npm = Resolve-ToolPath `
    -Names @("npm.cmd", "npm") `
    -EnvVars @("NODE_HOME") `
    -RelativePaths @("npm.cmd", "npm")

$backendCommand = "Set-Location -LiteralPath $(ConvertTo-QuotedPowerShellLiteral $backendJavaPath); Remove-Item Env:DEBUG -ErrorAction SilentlyContinue; `$env:PORT='$backendPort'; & $(ConvertTo-QuotedPowerShellLiteral $mvn) spring-boot:run"
$frontendCommand = "Set-Location -LiteralPath $(ConvertTo-QuotedPowerShellLiteral $frontendPath); `$env:VITE_API_URL='http://localhost:$backendPort'; `$env:VITE_STOCK_ASSISTANT_URL=$(ConvertTo-QuotedPowerShellLiteral $stockAssistantUrl); & $(ConvertTo-QuotedPowerShellLiteral $npm) run dev"
$assistantBackendCommand = "Set-Location -LiteralPath $(ConvertTo-QuotedPowerShellLiteral $stockAssistantPath); `$env:STOCK_API_BASE_URL='http://localhost:$backendPort'; & $(ConvertTo-QuotedPowerShellLiteral $mvn) spring-boot:run"
$assistantFrontendCommand = "Set-Location -LiteralPath $(ConvertTo-QuotedPowerShellLiteral $stockAssistantFrontendPath); `$env:VITE_API_BASE_URL=$(ConvertTo-QuotedPowerShellLiteral $stockAssistantApiUrl); & $(ConvertTo-QuotedPowerShellLiteral $npm) run dev"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'StockPulse Backend'; $backendCommand"
)

Start-Sleep -Seconds 2

if ((Test-Path -LiteralPath $stockAssistantPath -PathType Container) -and
    (Test-Path -LiteralPath $stockAssistantFrontendPath -PathType Container)) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = 'StockPulse Assistant Backend'; $assistantBackendCommand"
    )

    Start-Sleep -Seconds 2
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'StockPulse Frontend'; $frontendCommand"
)

if ((Test-Path -LiteralPath $stockAssistantPath -PathType Container) -and
    (Test-Path -LiteralPath $stockAssistantFrontendPath -PathType Container)) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = 'StockPulse Assistant Frontend'; $assistantFrontendCommand"
    )
}

Write-Host "Started backend and frontend in separate PowerShell windows."
Write-Host "Backend: $mvn spring-boot:run (PORT=$backendPort)"
Write-Host "Frontend: $npm run dev (VITE_API_URL=http://localhost:$backendPort, VITE_STOCK_ASSISTANT_URL=$stockAssistantUrl)"
if ((Test-Path -LiteralPath $stockAssistantPath -PathType Container) -and
    (Test-Path -LiteralPath $stockAssistantFrontendPath -PathType Container)) {
    Write-Host "Assistant backend: $mvn spring-boot:run (STOCK_API_BASE_URL=http://localhost:$backendPort)"
    Write-Host "Assistant frontend: $npm run dev (VITE_API_BASE_URL=$stockAssistantApiUrl)"
}
