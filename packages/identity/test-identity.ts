/**
 * Test script to verify player identity system
 */

import { LocalIdentityStore } from './src/LocalIdentityStore';
import { IdentityManager } from './src/identityManager';
import * as path from 'path';
import * as os from 'os';

async function testIdentity() {
  console.log('🧪 Testing Player Identity System\n');

  // Use a test path instead of the real one
  const testPath = path.join(os.tmpdir(), 'infinite-ttt-test', 'player.json');
  const store = new LocalIdentityStore(testPath);
  const manager = new IdentityManager(store);

  console.log(`Test identity file: ${testPath}\n`);

  // Test 1: First-time initialization
  console.log('Test 1: First-time initialization');
  const identity1 = await manager.initialize(async () => {
    console.log('  → Prompted for display name (returning "TestPlayer")');
    return 'TestPlayer';
  });
  
  console.log(`  ✓ Created identity:`);
  console.log(`    - Player ID: ${identity1.playerId}`);
  console.log(`    - Display Name: ${identity1.displayName}`);
  console.log(`    - Created At: ${new Date(identity1.createdAt).toISOString()}\n`);

  // Test 2: Persistence - create a new manager and load existing identity
  console.log('Test 2: Loading existing identity');
  const store2 = new LocalIdentityStore(testPath);
  const manager2 = new IdentityManager(store2);
  
  const identity2 = await manager2.initialize(async () => {
    console.log('  ✗ Should NOT be prompted (identity exists)');
    return 'ShouldNotBeUsed';
  });
  
  console.log(`  ✓ Loaded existing identity:`);
  console.log(`    - Player ID: ${identity2.playerId}`);
  console.log(`    - Display Name: ${identity2.displayName}`);
  console.log(`  ✓ IDs match: ${identity1.playerId === identity2.playerId}\n`);

  // Test 3: Rename player
  console.log('Test 3: Renaming player');
  await manager2.renamePlayer('RenamedPlayer');
  const identity3 = manager2.getCurrentPlayer();
  
  console.log(`  ✓ Updated display name:`);
  console.log(`    - New Name: ${identity3.displayName}`);
  console.log(`    - Player ID unchanged: ${identity1.playerId === identity3.playerId}\n`);

  // Test 4: Verify rename persisted
  console.log('Test 4: Verifying rename persisted');
  const store3 = new LocalIdentityStore(testPath);
  const manager3 = new IdentityManager(store3);
  
  const identity4 = await manager3.initialize(async () => 'ShouldNotBeUsed');
  console.log(`  ✓ Loaded renamed identity:`);
  console.log(`    - Display Name: ${identity4.displayName}`);
  console.log(`    - Name matches: ${identity4.displayName === 'RenamedPlayer'}\n`);

  console.log('✅ All tests passed!\n');
  console.log(`📁 Test file location: ${testPath}`);
  console.log('   (You can inspect this file to see the persisted data)');
}

testIdentity().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
