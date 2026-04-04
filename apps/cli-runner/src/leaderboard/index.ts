/**
 * Leaderboard Module — Orchestration
 * 
 * Public API for leaderboard functionality.
 * 
 * USAGE:
 * ```typescript
 * import { showLeaderboard } from './leaderboard/index.js';
 * import { matchStore } from './storage/index.js';
 * 
 * await showLeaderboard(matchStore, { mode: 'mode1', difficulty: 'hard' });
 * ```
 * 
 * RULES:
 * - Read-only operations
 * - No match mutations
 * - Fully recomputable
 */

import type { MatchStore } from '../storage/MatchStore.js';
import { computeLeaderboard, getFilteredMatchCount } from './computeLeaderboard.js';
import { printLeaderboard, printLeaderboardSummary } from './printLeaderboard.js';
import type { LeaderboardFilters } from './filters.js';

export type { LeaderboardEntry } from './LeaderboardEntry.js';
export type { LeaderboardFilters } from './filters.js';
export { computeLeaderboard, getFilteredMatchCount } from './computeLeaderboard.js';
export { printLeaderboard, printLeaderboardSummary } from './printLeaderboard.js';

/**
 * Show leaderboard in CLI
 * 
 * Main entry point for displaying the leaderboard.
 * 
 * Flow:
 * 1. Load all matches from storage
 * 2. Compute leaderboard with filters
 * 3. Print formatted table
 * 
 * @param matchStore - Storage to read matches from
 * @param filters - Optional filters (mode, difficulty)
 * @param summaryOnly - If true, show summary instead of full table
 */
export async function showLeaderboard(
  matchStore: MatchStore,
  filters?: LeaderboardFilters,
  summaryOnly = false
): Promise<void> {
  // Load all matches (read-only)
  const matches = await matchStore.getAll();
  
  // Compute leaderboard (pure function)
  const entries = computeLeaderboard(matches, filters);
  
  // Get match count after filtering
  const matchCount = getFilteredMatchCount(matches, filters);
  
  // Print to console
  if (summaryOnly) {
    printLeaderboardSummary(entries, filters);
  } else {
    printLeaderboard(entries, filters, matchCount);
  }
}
