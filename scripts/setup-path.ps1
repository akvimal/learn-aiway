# Add GitHub CLI to PATH for current session
$ghPath = "C:\Program Files\GitHub CLI"
$env:Path += ";$ghPath"

Write-Host "✅ Added GitHub CLI to PATH for this session" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "Testing GitHub CLI..." -ForegroundColor Cyan
gh --version
Write-Host ""

Write-Host "✅ GitHub CLI is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Authenticate: gh auth login" -ForegroundColor White
Write-Host "2. Verify setup: npm run verify" -ForegroundColor White
Write-Host "3. Create issues: npm run create-issues:dry-run" -ForegroundColor White
Write-Host ""
Write-Host "NOTE: This PATH change is temporary for this terminal session only." -ForegroundColor Yellow
Write-Host "For permanent fix: Restart your terminal." -ForegroundColor Yellow
