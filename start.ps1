# ================================================
# Ecogreen -- Start all services
# Run: .\start.ps1
# ================================================

Write-Host ""
Write-Host "=== ECOGREEN STARTUP ===" -ForegroundColor Green
Write-Host ""

# -- Fetch LAN IP --
$allIps = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.*" -and
    $_.IPAddress -notlike "172.23.*" -and
    $_.IPAddress -notlike "172.16.*" -and
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.InterfaceAlias -notlike "*WSL*"
}
$ipObj = ($allIps | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1)
if (-not $ipObj) { $ipObj = ($allIps | Where-Object { $_.IPAddress -like "10.*" } | Select-Object -First 1) }
if (-not $ipObj) { $ipObj = ($allIps | Select-Object -First 1) }
$ip = if ($ipObj) { $ipObj.IPAddress } else { "127.0.0.1" }

# -- 1. Start Database + MQTT via Docker --
Write-Host "[1/4] Starting Database and MQTT broker (Docker)..." -ForegroundColor Cyan
Set-Location ".\ecogreen-server"
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker failed. Is Docker Desktop running?" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Write-Host "      PostgreSQL : localhost:5433" -ForegroundColor Gray
Write-Host "      MQTT       : localhost:1883" -ForegroundColor Gray
Set-Location ".."

# -- 2. Wait for DB to be ready --
Write-Host "[2/4] Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# -- 3. Run Prisma migrate + generate --
Write-Host "[3/4] Running Prisma migrate..." -ForegroundColor Cyan
Set-Location ".\ecogreen-server"
npx prisma generate | Out-Null
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARN: migrate deploy failed, trying db push..." -ForegroundColor Yellow
    npx prisma db push
}
Set-Location ".."

# -- 4. Start Backend in new terminal window --
Write-Host "[4/4] Starting Backend and Frontend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'BACKEND - NestJS (port 3001)' -ForegroundColor Green; Set-Location 'C:\Users\ASUS\Desktop\Ecogreen\ecogreen-server'; npm run start:dev"
)

Start-Sleep -Seconds 2

# -- 5. Start Frontend in new terminal window --
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'FRONTEND - Next.js (port 3000)' -ForegroundColor Cyan; Set-Location 'C:\Users\ASUS\Desktop\Ecogreen\ecogreen-client'; npm run dev"
)

# -- Done --
Write-Host ""
Write-Host "=== ALL SERVICES STARTING ===" -ForegroundColor Green
Write-Host ""
Write-Host "[Localhost Access]" -ForegroundColor Cyan
Write-Host "   Frontend  : http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend   : http://localhost:3001" -ForegroundColor Yellow
Write-Host "   API Docs  : http://localhost:3001/api-docs" -ForegroundColor Yellow
Write-Host "   Database  : localhost:5433 (ecogreendb)" -ForegroundColor Yellow
Write-Host ""
Write-Host "[Network Access (WiFi/LAN)]" -ForegroundColor Cyan
Write-Host "   Frontend  : http://${ip}:3000" -ForegroundColor Yellow
Write-Host "   Backend   : http://${ip}:3001" -ForegroundColor Yellow
Write-Host "   API Docs  : http://${ip}:3001/api-docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "2 new terminal windows have been opened for Backend and Frontend." -ForegroundColor Gray
Write-Host "To stop: run .\stop.ps1 or Ctrl+C in each window + docker compose down" -ForegroundColor Gray
