# ================================================
# Ecogreen -- Stop all services
# Run: .\stop.ps1
# ================================================

Write-Host ""
Write-Host "=== ECOGREEN SHUTDOWN ===" -ForegroundColor Red
Write-Host ""

Write-Host "Stopping Docker containers (DB + MQTT)..." -ForegroundColor Cyan
Set-Location ".\ecogreen-server"
docker compose down
Set-Location ".."

Write-Host ""
Write-Host "Done. Frontend and Backend terminals must be closed manually (Ctrl+C)." -ForegroundColor Gray
