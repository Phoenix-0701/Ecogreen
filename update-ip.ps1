# ================================================
# Ecogreen -- Auto-update LAN IP in config files
# Auto-creates .env files if missing
# Run: .\update-ip.ps1
# ================================================

# 1. Detect current LAN IP (prefer 192.168.x.x, then 10.x.x.x, then 172.x.x.x hotspot)
$allIps = Get-NetIPAddress -AddressFamily IPv4 |
          Where-Object {
              $_.IPAddress -notlike "127.*" -and
              $_.IPAddress -notlike "169.*" -and
              $_.IPAddress -notlike "172.23.*" -and
              $_.IPAddress -notlike "172.16.*" -and
              $_.InterfaceAlias -notlike "*Loopback*" -and
              $_.InterfaceAlias -notlike "*WSL*"
          }

# Priority: 192.168 > 10.x > 172.x (hotspot)
$ip = ($allIps | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1)
if (-not $ip) { $ip = ($allIps | Where-Object { $_.IPAddress -like "10.*" } | Select-Object -First 1) }
if (-not $ip) { $ip = ($allIps | Select-Object -First 1) }
$ip = $ip.IPAddress

if (-not $ip) {
    Write-Host "ERROR: No LAN IP found. Check your WiFi connection!" -ForegroundColor Red
    exit 1
}

Write-Host "OK  LAN IP detected: $ip" -ForegroundColor Green

# ── 2. server/.env ───────────────────────────────────────────────
$serverEnv = ".\ecogreen-server\.env"

if (-not (Test-Path $serverEnv)) {
    Write-Host "    MISSING: $serverEnv -- creating..." -ForegroundColor Yellow
    @"
# ================================
# ECOGREEN SERVER -- Environment Variables
# ================================

PORT=3001
HOST=0.0.0.0

# Database (PostgreSQL + Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecogreen_db"

# JWT
JWT_SECRET=ecogreen_super_secret_key_change_me_in_production_2026

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://${ip}:3001/v1/auth/google/callback

# Frontend URL
CLIENT_URL=http://${ip}:3000

# MQTT Broker
MQTT_URL=mqtt://broker.emqx.io:1883

# OpenWeather API (optional)
OPENWEATHER_API_KEY=your_openweather_api_key_here
"@ | Set-Content $serverEnv -Encoding UTF8
} else {
    (Get-Content $serverEnv) `
        -replace 'GOOGLE_CALLBACK_URL=http://[^/]+', "GOOGLE_CALLBACK_URL=http://${ip}:3001" `
        -replace 'CLIENT_URL=http://[^\r\n]+',        "CLIENT_URL=http://${ip}:3000" |
        Set-Content $serverEnv -Encoding UTF8
}
Write-Host "    Updated: $serverEnv" -ForegroundColor Cyan

# ── 3. client/.env.local ─────────────────────────────────────────
$clientEnv = ".\ecogreen-client\.env.local"

if (-not (Test-Path $clientEnv)) {
    Write-Host "    MISSING: $clientEnv -- creating..." -ForegroundColor Yellow
    @"
# ================================
# ECOGREEN CLIENT -- Environment Variables
# ================================

NEXT_PUBLIC_API_URL=http://${ip}:3001

# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
"@ | Set-Content $clientEnv -Encoding UTF8
} else {
    (Get-Content $clientEnv) `
        -replace 'NEXT_PUBLIC_API_URL=http://[^\r\n]+', "NEXT_PUBLIC_API_URL=http://${ip}:3001" |
        Set-Content $clientEnv -Encoding UTF8
}
Write-Host "    Updated: $clientEnv" -ForegroundColor Cyan

# ── 4. next.config.ts ────────────────────────────────────────────
$nextConfig = ".\ecogreen-client\next.config.ts"
$content = Get-Content $nextConfig -Raw

if ($content -match '"192\.168\.[^"]*"') {
    $content = $content -replace '"192\.\d+\.\d+\.\d+"', "`"$ip`""
} elseif ($content -match '"10\.\d+\.\d+\.\d+"') {
    $content = $content -replace '"10\.\d+\.\d+\.\d+"', "`"$ip`""
} elseif ($content -match '"172\.\d+\.\d+\.\d+"') {
    $content = $content -replace '"172\.\d+\.\d+\.\d+"', "`"$ip`""
} else {
    $content = $content -replace '(allowedDevOrigins:\s*\[)', "`$1`n    `"$ip`",  // current WiFi"
}

Set-Content $nextConfig $content -Encoding UTF8 -NoNewline
Write-Host "    Updated: $nextConfig" -ForegroundColor Cyan

# ── 5. Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "Done! New access addresses:" -ForegroundColor Green
Write-Host "   Frontend : http://${ip}:3000" -ForegroundColor Yellow
Write-Host "   Backend  : http://${ip}:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTE: Restart dev servers if they are running." -ForegroundColor DarkYellow
