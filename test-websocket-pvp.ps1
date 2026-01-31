# WebSocket PvP Test Script
# This script tests the WebSocket upgrade for online PvP

Write-Host "🧪 Testing WebSocket PvP Implementation" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "📡 Checking backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2
    if ($response.status -eq "ok") {
        Write-Host "✅ Backend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend is not running. Please start it first:" -ForegroundColor Red
    Write-Host "   cd apps/backend && pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎮 Instructions for testing:" -ForegroundColor Cyan
Write-Host "1. Open TWO terminal windows" -ForegroundColor White
Write-Host "2. In each terminal, run: cd apps/cli-runner && pnpm dev" -ForegroundColor White
Write-Host "3. In both terminals, select 'Online PvP'" -ForegroundColor White
Write-Host "4. Both players should connect via WebSocket" -ForegroundColor White
Write-Host "5. Watch for '⚡ WebSocket' indicator in the game" -ForegroundColor White
Write-Host "6. Moves should be instant (no 2-second delay)" -ForegroundColor White
Write-Host ""
Write-Host "✅ If WebSocket fails, it should automatically fall back to polling" -ForegroundColor Green
Write-Host "   (You'll see '📡 Polling' indicator instead)" -ForegroundColor Gray
Write-Host ""
