$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Resolve-MavenPath {
    foreach ($name in @("mvn.cmd", "mvn")) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    foreach ($envVar in @("MAVEN_HOME", "M2_HOME")) {
        foreach ($scope in @("Process", "User", "Machine")) {
            $root = [Environment]::GetEnvironmentVariable($envVar, $scope)
            if (-not $root) {
                continue
            }

            foreach ($relativePath in @("bin\mvn.cmd", "bin\mvn")) {
                $candidate = Join-Path $root $relativePath
                if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                    return $candidate
                }
            }
        }
    }

    throw "Maven was not found on PATH or via MAVEN_HOME/M2_HOME."
}

Push-Location $projectRoot
try {
    $mvn = Resolve-MavenPath
    & $mvn spring-boot:run
} finally {
    Pop-Location
}
