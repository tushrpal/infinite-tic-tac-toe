/**
 * Match Result Emitter
 * 
 * Single responsibility: emit MatchResult after match completion.
 * 
 * RULES:
 * - No business logic
 * - No ranking calculations
 * - No backend integration (yet)
 * - Replaceable later
 * - Side-effect isolated
 */

import type { MatchResult } from '@infinite-ttt/shared';
import { createLocalMatchStore } from '../storage/index.js';

// Initialize storage layer
const matchStore = createLocalMatchStore();

/**
 * Emit a completed match result
 * 
 * Responsibilities:
 * 1. Log to console (for immediate feedback)
 * 2. Persist to local storage (for history/replay)
 * 
 * Later, this can also:
 * - Send to backend API
 * - Publish to event stream
 * - Trigger analytics
 * 
 * @param matchResult - The completed match result
 */
export async function emitMatchResult(matchResult: MatchResult): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 MATCH RESULT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(JSON.stringify(matchResult, null, 2));
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Persist to local storage
  try {
    await matchStore.save(matchResult);
  } catch (error) {
    console.error('⚠️  Failed to save match to storage:', error);
    // Don't throw - storage failure shouldn't break the game
  }
}
