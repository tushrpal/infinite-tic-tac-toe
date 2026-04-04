# Test script for player identity system
Write-Host "=== Testing Player Identity System ===" -ForegroundColor Cyan

# Clean up any existing identity for fresh test
$identityPath = Join-Path $env:USERPROFILE ".infinite-ttt\player.json"
if (Test-Path $identityPath) {
    Write-Host "Removing existing identity for clean test..." -ForegroundColor Yellow
    Remove-Item $identityPath -Force
}

# Test 1: Create identity via CLI (simulated)
Write-Host "`n[TEST 1] Creating player identity..." -ForegroundColor Green

# Since CLI is interactive, we'll test the identity package directly with Node
$testScript = @"
const { LocalIdentityStore, IdentityManager, createPlayerIdentity } = require('./packages/identity/dist/index.js');

async function test() {
    console.log('Testing identity creation...');
    
    const store = new LocalIdentityStore();
    const manager = new IdentityManager(store);
    
    // Simulate first-time setup
    const identity = await manager.initialize(async () => {
        return 'TestPlayer';
    });
    
    console.log('✅ Identity created:');
    console.log('  Player ID:', identity.playerId);
    console.log('  Display Name:', identity.displayName);
    console.log('  Created At:', new Date(identity.createdAt).toISOString());
    
    // Test persistence
    console.log('\n🔄 Testing persistence...');
    const store2 = new LocalIdentityStore();
    const loaded = await store2.load();
    
    if (loaded && loaded.playerId === identity.playerId) {
        console.log('✅ Identity persisted correctly');
        console.log('  File location:', store.getFilePath());
    } else {
        console.error('❌ Identity persistence failed');
        process.exit(1);
    }
    
    // Test rename
    console.log('\n🔄 Testing rename...');
    await manager.renamePlayer('RenamedPlayer');
    const renamed = await store2.load();
    
    if (renamed && renamed.displayName === 'RenamedPlayer' && renamed.playerId === identity.playerId) {
        console.log('✅ Rename successful (playerId preserved)');
    } else {
        console.error('❌ Rename failed');
        process.exit(1);
    }
    
    console.log('\n✅ ALL TESTS PASSED');
}

test().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
"@

Set-Content -Path "test-identity-script.js" -Value $testScript

# Run the test
node test-identity-script.js

# Check if identity file was created
Write-Host "`n[TEST 2] Verifying identity file..." -ForegroundColor Green
if (Test-Path $identityPath) {
    Write-Host "✅ Identity file created at: $identityPath" -ForegroundColor Green
    Write-Host "`nFile contents:" -ForegroundColor Cyan
    Get-Content $identityPath | ConvertFrom-Json | ConvertTo-Json -Depth 10
} else {
    Write-Host "❌ Identity file not found!" -ForegroundColor Red
    exit 1
}

# Clean up test script
Remove-Item "test-identity-script.js" -Force

Write-Host "`n=== Identity System Tests Complete ===" -ForegroundColor Cyan
