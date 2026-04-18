$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $projectRoot "frontend"
$backendJavaPath = Join-Path $projectRoot "backend-java"
$backendPort = "3002"

$mvn = Get-Command mvn -ErrorAction SilentlyContinue
if (-not $mvn) {
    throw "Global Maven was not found. Open a new terminal and run 'mvn -version' first."
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    throw "npm was not found on PATH."
}

$backendCommand = "Set-Location '$backendJavaPath'; `$env:PORT='$backendPort'; mvn spring-boot:run"
$frontendCommand = "Set-Location '$frontendPath'; `$env:VITE_API_URL='http://localhost:$backendPort'; npm run dev"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "$Host.UI.RawUI.WindowTitle = 'StockPulse Backend'; $backendCommand"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "$Host.UI.RawUI.WindowTitle = 'StockPulse Frontend'; $frontendCommand"
)

Write-Host "Started backend and frontend in separate PowerShell windows."
Write-Host "Backend: mvn spring-boot:run (PORT=$backendPort)"
Write-Host "Frontend: npm run dev (VITE_API_URL=http://localhost:$backendPort)"
