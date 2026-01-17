/**
 * Storage Verification Script
 * 
 * Validates that the match store is working correctly:
 * - Reading stored matches
 * - Displaying match history
 * - Verifying data integrity
 */

import { createLocalMatchStore } from './storage/index.js';

async function verifyStorage() {
  console.log('📦 Match Storage Verification\n');
  
  const store = createLocalMatchStore();
  
  try {
    const matches = await store.getAll();
    
    if (matches.length === 0) {
      console.log('✅ Storage is working but no matches found yet.');
      console.log('   Play some games to populate the store!\n');
      return;
    }
    
    console.log(`✅ Found ${matches.length} stored match(es)\n`);
    
    // Display summary
    matches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`);
      console.log(`  ID: ${match.matchId}`);
      console.log(`  Mode: ${match.mode}`);
      console.log(`  Difficulty: ${match.difficulty}`);
      console.log(`  Winner: ${match.winner || 'Draw'}`);
      console.log(`  Rounds: ${match.roundsPlayed}`);
      console.log(`  Total Moves: ${match.totalMoves}`);
      console.log(`  Created: ${new Date(match.createdAt).toLocaleString()}`);
      console.log();
    });
    
    // Verify data integrity
    const hasValidIds = matches.every(m => m.matchId && m.matchId.startsWith('match_'));
    const hasValidModes = matches.every(m => m.mode === 'mode1' || m.mode === 'mode2');
    const hasValidPlayers = matches.every(m => m.players && m.players.length === 2);
    const hasValidGames = matches.every(m => m.games && m.games.length > 0);
    
    console.log('Data Integrity Checks:');
    console.log(`  ✅ All matches have valid IDs: ${hasValidIds}`);
    console.log(`  ✅ All matches have valid modes: ${hasValidModes}`);
    console.log(`  ✅ All matches have 2 players: ${hasValidPlayers}`);
    console.log(`  ✅ All matches have game data: ${hasValidGames}`);
    console.log();
    
    if (hasValidIds && hasValidModes && hasValidPlayers && hasValidGames) {
      console.log('🎉 Storage validation PASSED!\n');
    } else {
      console.log('⚠️  Some integrity checks failed.\n');
    }
    
  } catch (error) {
    console.error('❌ Storage verification failed:', error);
    process.exit(1);
  }
}

verifyStorage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
