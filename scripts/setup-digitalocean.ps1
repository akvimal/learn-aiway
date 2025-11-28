# DigitalOcean App Platform Setup Script (PowerShell)
#
# This script automates the setup of your app on DigitalOcean
#
# Prerequisites:
#   - doctl installed and authenticated
#   - GitHub repository configured
#
# Usage:
#   .\scripts\setup-digitalocean.ps1
#

$ErrorActionPreference = "Stop"

Write-Host "🚀 DigitalOcean App Platform Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if doctl is installed
if (!(Get-Command doctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ doctl is not installed" -ForegroundColor Red
    Write-Host "Please install doctl first:"
    Write-Host "  choco install doctl"
    Write-Host "  or download from: https://github.com/digitalocean/doctl/releases"
    exit 1
}

# Check if authenticated
try {
    doctl account get | Out-Null
} catch {
    Write-Host "❌ Not authenticated with DigitalOcean" -ForegroundColor Red
    Write-Host "Please run: doctl auth init"
    exit 1
}

Write-Host "✅ doctl is installed and authenticated" -ForegroundColor Green
Write-Host ""

# Get configuration
Write-Host "📝 Configuration" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow
$GitHubRepo = Read-Host "Enter your GitHub repository (format: username/repo)"
$Region = Read-Host "Enter region (default: nyc1)"
if ([string]::IsNullOrEmpty($Region)) { $Region = "nyc1" }

Write-Host ""
Write-Host "Creating DigitalOcean resources..." -ForegroundColor Yellow
Write-Host ""

# 1. Create PostgreSQL Database
Write-Host "1️⃣  Creating PostgreSQL database cluster..." -ForegroundColor Cyan
$DbId = doctl databases create ai-learning-db `
    --engine pg `
    --version 16 `
    --region $Region `
    --size db-s-1vcpu-1gb `
    --num-nodes 1 `
    --format ID `
    --no-header

Write-Host "✅ Database cluster created: $DbId" -ForegroundColor Green

# Wait for database
Write-Host "   Waiting for database to be ready - this takes 5-10 minutes..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 30
    $DbStatus = doctl databases get $DbId --format Status --no-header
    Write-Host "   Status: $DbStatus" -ForegroundColor Yellow
} while ($DbStatus -ne "online")

Write-Host "✅ Database is online" -ForegroundColor Green

# Create database
Write-Host "   Creating database 'ai_learning'..." -ForegroundColor Yellow
doctl databases db create $DbId ai_learning
Write-Host "✅ Database created" -ForegroundColor Green

$DbUrl = doctl databases connection $DbId --format URI --no-header
Write-Host "   Connection: $DbUrl" -ForegroundColor Gray

Write-Host ""

# 2. Create Redis
Write-Host "2️⃣  Creating Redis cluster..." -ForegroundColor Cyan
$RedisId = doctl databases create ai-learning-redis `
    --engine redis `
    --version 7 `
    --region $Region `
    --size db-s-1vcpu-1gb `
    --num-nodes 1 `
    --format ID `
    --no-header

Write-Host "✅ Redis cluster created: $RedisId" -ForegroundColor Green

# Wait for Redis
Write-Host "   Waiting for Redis to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 30
    $RedisStatus = doctl databases get $RedisId --format Status --no-header
    Write-Host "   Status: $RedisStatus" -ForegroundColor Yellow
} while ($RedisStatus -ne "online")

Write-Host "✅ Redis is online" -ForegroundColor Green

$RedisUrl = doctl databases connection $RedisId --format URI --no-header
Write-Host "   Connection: $RedisUrl" -ForegroundColor Gray

Write-Host ""

# 3. Create Registry
Write-Host "3️⃣  Creating container registry..." -ForegroundColor Cyan
$RegistryName = "ai-learning"
try {
    doctl registry create $RegistryName 2>$null
} catch {
    Write-Host "   Registry already exists" -ForegroundColor Yellow
}
Write-Host "✅ Registry: $RegistryName" -ForegroundColor Green

Write-Host ""

# 4. Update app.yaml
Write-Host "4️⃣  Updating app.yaml configuration..." -ForegroundColor Cyan
(Get-Content .do\app.yaml) -replace 'YOUR_GITHUB_USERNAME/ai-learning', $GitHubRepo | Set-Content .do\app.yaml
Write-Host "✅ App spec updated" -ForegroundColor Green

Write-Host ""

# 5. Create App
Write-Host "5️⃣  Creating app on DigitalOcean..." -ForegroundColor Cyan
$AppId = doctl apps create --spec .do\app.yaml --format ID --no-header
Write-Host "✅ App created: $AppId" -ForegroundColor Green

Write-Host "   Waiting for initial deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host ""

# 6. Generate secrets
Write-Host "6️⃣  Generating JWT secrets..." -ForegroundColor Cyan
$JwtSecret = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
$JwtRefreshSecret = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
Write-Host "✅ Secrets generated" -ForegroundColor Green

Write-Host ""

# Display instructions
Write-Host "📋 GitHub Secrets to Add" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://github.com/$GitHubRepo/settings/secrets/actions"
Write-Host ""
Write-Host "Add these secrets:" -ForegroundColor Cyan
Write-Host ""
Write-Host "DIGITALOCEAN_TOKEN" -ForegroundColor Yellow
Write-Host "  Value: (your DigitalOcean API token)"
Write-Host ""
Write-Host "REGISTRY_NAME" -ForegroundColor Yellow
Write-Host "  Value: $RegistryName"
Write-Host ""
Write-Host "APP_ID" -ForegroundColor Yellow
Write-Host "  Value: $AppId"
Write-Host ""
Write-Host "Add this variable:" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEPLOY_PLATFORM" -ForegroundColor Yellow
Write-Host "  Value: digitalocean"
Write-Host ""

Write-Host "📋 App Environment Variables to Add" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://cloud.digitalocean.com/apps/$AppId/settings"
Write-Host ""
Write-Host "Add these encrypted variables:" -ForegroundColor Cyan
Write-Host ""
Write-Host "JWT_SECRET" -ForegroundColor Yellow
Write-Host "  Value: $JwtSecret"
Write-Host ""
Write-Host "JWT_REFRESH_SECRET" -ForegroundColor Yellow
Write-Host "  Value: $JwtRefreshSecret"
Write-Host ""

# Get App URL
$AppUrl = doctl apps get $AppId --format DefaultIngress --no-header

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app will be available at: https://$AppUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add GitHub Secrets (see above)"
Write-Host "2. Add App Environment Variables (see above)"
Write-Host "3. Wait for deployment to complete"
Write-Host "4. Visit your app!"
Write-Host ""
Write-Host "To check deployment status:" -ForegroundColor Cyan
Write-Host "  doctl apps list-deployments $AppId"
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  doctl apps logs $AppId --type run --follow"
Write-Host ""

# Save configuration
$ConfigInfo = @"
DigitalOcean Setup Information
==============================

App ID: $AppId
Database ID: $DbId
Redis ID: $RedisId
Registry: $RegistryName
Region: $Region

Database URL: $DbUrl
Redis URL: $RedisUrl

JWT Secret: $JwtSecret
JWT Refresh Secret: $JwtRefreshSecret

App URL: https://$AppUrl

GitHub Repository: $GitHubRepo

Setup Date: $(Get-Date)
"@

$ConfigInfo | Out-File -FilePath .do\setup-info.txt -Encoding UTF8
Write-Host "Configuration saved to: .do\setup-info.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ All done! Your app is deploying now." -ForegroundColor Green
