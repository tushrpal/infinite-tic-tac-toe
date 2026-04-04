# Test Backend Player API
Write-Host "=== Testing Backend Player API ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Test 1: Health check
Write-Host "`n[TEST 1] Health check..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Backend is healthy: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    exit 1
}

# Test 2: Create player
Write-Host "`n[TEST 2] Creating player..." -ForegroundColor Green
$player = @{
    playerId = "test-player-123"
    displayName = "TestUser"
    createdAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/players" -Method Post -Body $player -ContentType "application/json"
    Write-Host "✅ Player created: $($result.playerId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create player: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Get player by ID
Write-Host "`n[TEST 3] Retrieving player..." -ForegroundColor Green
try {
    $retrieved = Invoke-RestMethod -Uri "$baseUrl/players/test-player-123" -Method Get
    Write-Host "✅ Player retrieved:" -ForegroundColor Green
    $retrieved | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Failed to retrieve player" -ForegroundColor Red
    exit 1
}

# Test 4: Update player (same ID, new name)
Write-Host "`n[TEST 4] Updating player name..." -ForegroundColor Green
$updatedPlayer = @{
    playerId = "test-player-123"
    displayName = "UpdatedUser"
    createdAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/players" -Method Post -Body $updatedPlayer -ContentType "application/json"
    Write-Host "✅ Player updated" -ForegroundColor Green
    
    # Verify update
    $verified = Invoke-RestMethod -Uri "$baseUrl/players/test-player-123" -Method Get
    if ($verified.displayName -eq "UpdatedUser") {
        Write-Host "✅ Name update verified" -ForegroundColor Green
    } else {
        Write-Host "❌ Name update failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to update player" -ForegroundColor Red
    exit 1
}

# Test 5: List all players
Write-Host "`n[TEST 5] Listing all players..." -ForegroundColor Green
try {
    $allPlayers = Invoke-RestMethod -Uri "$baseUrl/players" -Method Get
    Write-Host "✅ Found $($allPlayers.count) player(s)" -ForegroundColor Green
    $allPlayers.players | ForEach-Object {
        Write-Host "  - $($_.displayName) ($($_.playerId))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to list players" -ForegroundColor Red
    exit 1
}

# Test 6: Get non-existent player
Write-Host "`n[TEST 6] Testing 404 for non-existent player..." -ForegroundColor Green
try {
    $notFound = Invoke-RestMethod -Uri "$baseUrl/players/does-not-exist" -Method Get
    Write-Host "❌ Should have returned 404" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Correctly returns 404" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== All Backend Tests Passed ===" -ForegroundColor Cyan
