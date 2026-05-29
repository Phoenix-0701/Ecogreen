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
Write-Host "[1/5] Starting Database and MQTT broker (Docker)..." -ForegroundColor Cyan
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

# -- 2. Wait for DB to be ready (health-check loop) --
Write-Host "[2/5] Waiting for database to be ready..." -ForegroundColor Cyan
$maxRetries = 30
$retries = 0
do {
    $result = docker exec ecogreen-postgres pg_isready -U postgres -d ecogreendb 2>$null
    if ($result -match "accepting connections") { break }
    $retries++
    if ($retries -ge $maxRetries) {
        Write-Host "ERROR: Database not ready after $maxRetries attempts. Aborting." -ForegroundColor Red
        exit 1
    }
    Write-Host "      Waiting... ($retries/$maxRetries)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
} while ($true)
Write-Host "      Database is ready!" -ForegroundColor Green

# -- 3. Install dependencies --
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Cyan

Set-Location ".\ecogreen-server"
Write-Host "      Installing server deps..." -ForegroundColor Gray
npm install 2>&1 | Out-Null
Write-Host "      Server deps OK" -ForegroundColor Green
Set-Location ".."

Set-Location ".\ecogreen-client"
Write-Host "      Installing client deps..." -ForegroundColor Gray
npm install 2>&1 | Out-Null
Write-Host "      Client deps OK" -ForegroundColor Green
Set-Location ".."

# -- 4. Run Prisma migrate + generate --
Write-Host "[4/5] Running Prisma migrate..." -ForegroundColor Cyan
Set-Location ".\ecogreen-server"
npx prisma generate | Out-Null

$rootDir = $PSScriptRoot
$migrateJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location "$dir"
    npx prisma migrate deploy 2>&1
} -ArgumentList "$rootDir\ecogreen-server"
$done = Wait-Job $migrateJob -Timeout 30
if (-not $done) {
    Remove-Job $migrateJob -Force
    Write-Host "WARN: migrate deploy timed out, trying db push..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss
} else {
    $output = Receive-Job $migrateJob
    Write-Host $output
    Remove-Job $migrateJob
}
Set-Location ".."

# -- 5. Start Backend + Frontend in new terminal windows --
Write-Host "[5/5] Starting Backend and Frontend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'BACKEND - NestJS (port 3001)' -ForegroundColor Green; npm run start:dev"
) -WorkingDirectory "$rootDir\ecogreen-server"

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'FRONTEND - Next.js (port 3000)' -ForegroundColor Cyan; npm run dev"
) -WorkingDirectory "$rootDir\ecogreen-client"

# -- Done --
Write-Host ""
Write-Host "=== ALL SERVICES STARTING ===" -ForegroundColor Green
Write-Host ""
Write-Host "[Localhost Access]" -ForegroundColor Cyan
Write-Host "   Frontend  : http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend   : http://localhost:3001" -ForegroundColor Yellow
Write-Host "   API Docs  : http://localhost:3001/api-docs" -ForegroundColor Yellow
Write-Host "   Database  : localhost:5433 (ecogreendb)" -ForegroundColor Gray
Write-Host ""
Write-Host "[Network Access (WiFi/LAN)]" -ForegroundColor Cyan
Write-Host "   Frontend  : http://${ip}:3000" -ForegroundColor Yellow
Write-Host "   Backend   : http://${ip}:3001" -ForegroundColor Yellow
Write-Host "   API Docs  : http://${ip}:3001/api-docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "2 new terminal windows have been opened for Backend and Frontend." -ForegroundColor Gray
Write-Host "To stop: run .\stop.ps1 or Ctrl+C in each window + docker compose down" -ForegroundColor Gray
