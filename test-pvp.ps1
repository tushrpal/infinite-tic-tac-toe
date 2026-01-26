# Test Script for Online PvP

Write-Host "🎮 Infinite Tic-Tac-Toe - Online PvP Test Script" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "📡 Checking if backend is running on http://localhost:3001..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the backend first:" -ForegroundColor Yellow
    Write-Host "  cd apps\backend" -ForegroundColor White
    Write-Host "  pnpm dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🎯 To test Online PvP, you need TWO terminals:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 (Player 1):" -ForegroundColor Yellow
Write-Host "  cd apps\cli-runner" -ForegroundColor White
Write-Host "  pnpm dev --pvp" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 2 (Player 2):" -ForegroundColor Yellow
Write-Host "  cd apps\cli-runner" -ForegroundColor White
Write-Host "  pnpm dev --pvp" -ForegroundColor Green
Write-Host ""
Write-Host "Expected flow:" -ForegroundColor Cyan
Write-Host "  1. Player 1 creates match and waits" -ForegroundColor White
Write-Host "  2. Player 2 joins the match" -ForegroundColor White
Write-Host "  3. Game begins! Take turns making moves" -ForegroundColor White
Write-Host "  4. When game ends, both players' rankings update" -ForegroundColor White
Write-Host ""
Write-Host "✨ Features to verify:" -ForegroundColor Cyan
Write-Host "  ✓ Matchmaking works (auto-join)" -ForegroundColor White
Write-Host "  ✓ Turn enforcement (can't move on opponent's turn)" -ForegroundColor White
Write-Host "  ✓ Board updates after each move" -ForegroundColor White
Write-Host "  ✓ Game ends correctly" -ForegroundColor White
Write-Host "  ✓ Both players get ranking updates" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To check active matches:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:3001/pvp/matches/active" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view leaderboard after playing:" -ForegroundColor Yellow
Write-Host "  cd apps\cli-runner" -ForegroundColor White
Write-Host "  pnpm dev --leaderboard" -ForegroundColor Green
Write-Host ""
