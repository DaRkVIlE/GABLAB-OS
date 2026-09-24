@echo off
set "SCRIPT_DIR=%~dp0"
set "KAIROS_ROOT=%SCRIPT_DIR%.."
node "%SCRIPT_DIR%dist\mcp-server.js"
