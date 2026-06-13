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

# --- OPTION 1: Local Docker Database (Active by default) ---
DATABASE_URL="postgresql://admin:admin123@localhost:5433/ecogreendb"
DIRECT_URL="postgresql://admin:admin123@localhost:5433/ecogreendb"

# --- OPTION 2: Supabase Cloud Database (Commented out) ---
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
# DATABASE_URL="postgresql://postgres.your_supabase_project:your_password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Connect to Postgres via the shared session-mode pooler (used for migrations)
# DIRECT_URL="postgresql://postgres.your_supabase_project:your_password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET=ecogreen_super_secret_key_change_me_in_production_2026

# Google OAuth 2.0
# Google OAuth credentials for authentication
GOOGLE_CLIENT_ID="your_google_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_CALLBACK_URL=http://localhost:3001/v1/auth/google/callback

# Frontend URL
# --- OPTION 1: Local Dev (localhost) ---
CLIENT_URL=http://localhost:3000

# --- OPTION 2: LAN IP Dev (for phone / external testing) ---
# CLIENT_URL=http://${ip}:3000

# MQTT Broker
MQTT_URL=mqtt://broker.emqx.io:1883

# Telegram Bot Token & OpenWeather API
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"
OPENWEATHER_API_KEY="your_openweather_api_key_here"

# Gemini AI API Key & Model Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# --- OPTION 1: Gemini 2.5 Flash Lite (Default, fast) ---
GEMINI_MODEL=gemini-2.5-flash-lite

# --- OPTION 2: Gemini 1.5 Flash 8B (High rate limits, backup) ---
# GEMINI_MODEL=gemini-1.5-flash-8b

# --- OPTION 3: Gemini 2.5 Flash (Smarter, fast) ---
# GEMINI_MODEL=gemini-2.5-flash

# --- OPTION 4: Gemini 1.5 Flash (Stable backup) ---
# GEMINI_MODEL=gemini-1.5-flash
"@ | Set-Content $serverEnv -Encoding UTF8
} else {
    $envContent = (Get-Content $serverEnv) -join "`n"
    
    # Check and append missing configuration keys
    if ($envContent -notmatch "DIRECT_URL") {
        $envContent += "`n`n# Direct connection for migrations`nDIRECT_URL=`"postgresql://admin:admin123@localhost:5433/ecogreendb`""
    }
    if ($envContent -notmatch "TELEGRAM_BOT_TOKEN") {
        $envContent += "`n`n# Telegram Bot Token`nTELEGRAM_BOT_TOKEN=`"your_telegram_bot_token_here`""
    }
    if ($envContent -notmatch "GEMINI_API_KEY") {
        $envContent += "`n`n# Gemini AI API Key`nGEMINI_API_KEY=your_gemini_api_key_here"
    }
    if ($envContent -notmatch "OPTION 1: Gemini 2.5 Flash Lite") {
        $geminiOptions = "`n# --- OPTION 1: Gemini 2.5 Flash Lite (Default, fast) ---`nGEMINI_MODEL=gemini-2.5-flash-lite`n`n# --- OPTION 2: Gemini 1.5 Flash 8B (High rate limits, backup) ---`n# GEMINI_MODEL=gemini-1.5-flash-8b`n`n# --- OPTION 3: Gemini 2.5 Flash (Smarter, fast) ---`n# GEMINI_MODEL=gemini-2.5-flash`n`n# --- OPTION 4: Gemini 1.5 Flash (Stable backup) ---`n# GEMINI_MODEL=gemini-1.5-flash"
        if ($envContent -match "GEMINI_MODEL=gemini-2.5-flash-lite") {
            $envContent = $envContent -replace 'GEMINI_MODEL=gemini-2.5-flash-lite', $geminiOptions
        } else {
            $envContent += "`n" + $geminiOptions
        }
    }
    
    # Update CLIENT_URL options structure if missing, otherwise update LAN IP
    if ($envContent -notmatch "OPTION 1: Local Dev") {
        $optionsBlock = "`n# --- OPTION 1: Local Dev (localhost) ---`nCLIENT_URL=http://localhost:3000`n`n# --- OPTION 2: LAN IP Dev (for phone / external testing) ---`n# CLIENT_URL=http://${ip}:3000"
        $envContent = $envContent -replace 'CLIENT_URL=http://[^\r\n]+', $optionsBlock
    } else {
        $envContent = $envContent -replace '(?m)^(#\s*)?CLIENT_URL=http://(?:\d{1,3}\.){3}\d{1,3}:3000', "`$1CLIENT_URL=http://${ip}:3000"
    }
    $envContent | Set-Content $serverEnv -Encoding UTF8
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

# --- OPTION 1: Local Dev (localhost) ---
NEXT_PUBLIC_API_URL=http://localhost:3001

# --- OPTION 2: LAN IP Dev (for phone / external testing) ---
# NEXT_PUBLIC_API_URL=http://${ip}:3001

# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
"@ | Set-Content $clientEnv -Encoding UTF8
} else {
    $envContent = (Get-Content $clientEnv) -join "`n"
    if ($envContent -notmatch "OPTION 1: Local Dev") {
        $optionsBlock = "`n# --- OPTION 1: Local Dev (localhost) ---`nNEXT_PUBLIC_API_URL=http://localhost:3001`n`n# --- OPTION 2: LAN IP Dev (for phone / external testing) ---`n# NEXT_PUBLIC_API_URL=http://${ip}:3001"
        $envContent = $envContent -replace 'NEXT_PUBLIC_API_URL=http://[^\r\n]+', $optionsBlock
    } else {
        $envContent = $envContent -replace '(?m)^(#\s*)?NEXT_PUBLIC_API_URL=http://(?:\d{1,3}\.){3}\d{1,3}:3001', "`$1NEXT_PUBLIC_API_URL=http://${ip}:3001"
    }
    $envContent | Set-Content $clientEnv -Encoding UTF8
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

try {
    Set-Content $nextConfig $content -Encoding UTF8 -NoNewline -ErrorAction Stop
} catch {
    # File bị lock bởi Next.js dev server — ghi qua temp file rồi move
    $tmp = "$nextConfig.tmp"
    Set-Content $tmp $content -Encoding UTF8 -NoNewline
    Move-Item $tmp $nextConfig -Force
}
Write-Host "    Updated: $nextConfig" -ForegroundColor Cyan

# ── 5. Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "Done! New access addresses:" -ForegroundColor Green
Write-Host "   Frontend : http://${ip}:3000" -ForegroundColor Yellow
Write-Host "   Backend  : http://${ip}:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTE: Restart dev servers if they are running." -ForegroundColor DarkYellow
