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
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ⚡ SKORTEX — Sovereign Autonomous Meta-Orchestrator   ║" -ForegroundColor Cyan
Write-Host "║   OpenClaw $((openclaw --version) -replace 'OpenClaw ','') | KAIROX MCP v3.2 | 33 tools  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verifica Node.js >= 24
$nodeVersion = (node -v) -replace 'v',''
$major = [int]($nodeVersion -split '\.')[0]
if ($major -lt 24) {
    Write-Host "❌ Node.js $nodeVersion detectado. SKORTEX requer Node >= 24." -ForegroundColor Red
    Write-Host "   Execute: winget install --id OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js v$nodeVersion" -ForegroundColor Green
Write-Host "✅ Workspace: $SKORTEX_DIR" -ForegroundColor Green

# Verifica build do kairox-mcp-server
$mcpDist = "$KAIROS_ROOT\kairox-mcp-server\dist\mcp-server.js"
if (-not (Test-Path $mcpDist)) {
    Write-Host ""
    Write-Host "⚠️  KAIROX MCP dist não encontrado. Compilando..." -ForegroundColor Yellow
    Push-Location "$KAIROS_ROOT\kairox-mcp-server"
    npm run build
    Pop-Location
}
Write-Host "✅ KAIROX MCP Server: $mcpDist" -ForegroundColor Green

Write-Host ""

switch ($Mode) {
    "setup" {
        Write-Host "🔧 Rodando setup interativo do SKORTEX..." -ForegroundColor Yellow
        Set-Location $SKORTEX_DIR
        openclaw onboard --workspace-target $SKORTEX_DIR
    }
    "chat" {
        Write-Host "💬 Abrindo sessão de chat local com o SKORTEX..." -ForegroundColor Cyan
        Set-Location $SKORTEX_DIR
        openclaw chat
    }
    "daemon" {
        Write-Host "🌐 Iniciando Gateway do SKORTEX em background..." -ForegroundColor Magenta
        Set-Location $SKORTEX_DIR
        openclaw gateway run --force
    }
    "status" {
        Write-Host "📡 Status do SKORTEX..." -ForegroundColor White
        Write-Host ""
        openclaw status
        Write-Host ""
        openclaw mcp list
    }
}
