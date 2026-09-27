# SKORTEX Launcher — OpenClaw 2.0 Meta-Orchestrator
# Uso: .\Launch-SKORTEX.ps1 [-Mode setup|chat|daemon|status]

param(
    [ValidateSet("setup","chat","daemon","status")]
    [string]$Mode = "chat"
)

$ErrorActionPreference = "Stop"
$KAIROS_ROOT = "C:\Users\Usuario\Documents\My KAIROS"
$SKORTEX_DIR = "$KAIROS_ROOT\skortex"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   SKORTEX - Sovereign Autonomous Meta-Orchestrator" -ForegroundColor Cyan
Write-Host "   OpenClaw 2026.9.6 | KAIROX MCP v3.2 | 33 tools  " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Verifica Node.js >= 24
try {
    $nodeVersion = (node -v) -replace 'v',''
    $major = [int]($nodeVersion -split '\.')[0]
    if ($major -lt 24) {
        Write-Host "ERRO: Node.js $nodeVersion detectado. SKORTEX requer Node >= 24." -ForegroundColor Red
        Write-Host "Execute: winget install --id OpenJS.NodeJS.LTS" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "OK Node.js v$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Node.js nao encontrado no PATH." -ForegroundColor Red
    exit 1
}

Write-Host "OK Workspace: $SKORTEX_DIR" -ForegroundColor Green

# Verifica build do kairox-mcp-server
$mcpDist = "$KAIROS_ROOT\kairox-mcp-server\dist\mcp-server.js"
if (-not (Test-Path $mcpDist)) {
    Write-Host "AVISO: KAIROX MCP dist nao encontrado. Compilando..." -ForegroundColor Yellow
    Push-Location "$KAIROS_ROOT\kairox-mcp-server"
    npm run build
    Pop-Location
}
Write-Host "OK KAIROX MCP: $mcpDist" -ForegroundColor Green
Write-Host ""

Set-Location $SKORTEX_DIR

if ($Mode -eq "setup") {
    Write-Host "Rodando setup interativo do SKORTEX..." -ForegroundColor Yellow
    openclaw onboard --workspace-target $SKORTEX_DIR
}
elseif ($Mode -eq "chat") {
    Write-Host "Abrindo sessao de chat local com o SKORTEX..." -ForegroundColor Cyan
    openclaw chat
}
elseif ($Mode -eq "daemon") {
    Write-Host "Iniciando Gateway do SKORTEX em background..." -ForegroundColor Magenta
    openclaw gateway run --force
}
elseif ($Mode -eq "status") {
    Write-Host "Status dos Modelos e Autenticacao:" -ForegroundColor White
    openclaw models status
    Write-Host ""
    Write-Host "Servidores MCP Registrados:" -ForegroundColor White
    openclaw mcp list
}
