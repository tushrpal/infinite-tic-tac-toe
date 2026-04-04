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
import type { PlayerIdentity } from '@infinite-ttt/identity';
import { createLocalMatchStore } from '../storage/index.js';

// Initialize storage layer
const matchStore = createLocalMatchStore();

/**
 * Emit a completed match result
 * 
 * Responsibilities:
 * 1. Log to console (for immediate feedback)
 * 2. Persist to local storage (for history/replay)
 * 3. Send to backend if configured
 * 
 * Later, this can also:
 * - Publish to event stream
 * - Trigger analytics
 * 
 * @param matchResult - The completed match result
 * @param backendUrl - Optional backend URL for remote storage
 * @param playerIdentity - Optional player identity to sync with backend
 */
export async function emitMatchResult(
  matchResult: MatchResult,
  backendUrl?: string,
  playerIdentity?: PlayerIdentity
): Promise<void> {
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

  // Send to backend if configured
  if (backendUrl) {
    try {
      // Send player identity first (if provided)
      if (playerIdentity) {
        await fetch(`${backendUrl}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(playerIdentity)
        });
      }
      
      // Then send match result
      await fetch(`${backendUrl}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchResult)
      });
    } catch {
      console.warn('⚠️  Backend unreachable');
      // Never throw - backend failure shouldn't block gameplay
    }
  }
}
