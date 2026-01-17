/**
 * Match Filtering Utilities
 * 
 * Pure functions for filtering matches by mode and difficulty.
 * 
 * RULES:
 * - Read-only operations
 * - No mutations
 * - Composable filters
 */

import type { MatchResult, GameMode, Difficulty } from '@infinite-ttt/shared';

/**
 * Filter options for leaderboard computation
 */
export interface LeaderboardFilters {
  /** Filter by game mode */
  mode?: GameMode;
  
  /** Filter by difficulty level */
  difficulty?: Difficulty;
}

/**
 * Filter matches by mode
 * 
 * @param matches - All match results
 * @param mode - Mode to filter by (undefined = all modes)
 * @returns Filtered matches
 */
export function filterByMode(
  matches: MatchResult[],
  mode?: GameMode
): MatchResult[] {
  if (!mode) {
    return matches;
  }
  return matches.filter((match) => match.mode === mode);
}

/**
 * Filter matches by difficulty
 * 
 * @param matches - All match results
 * @param difficulty - Difficulty to filter by (undefined = all difficulties)
 * @returns Filtered matches
 */
export function filterByDifficulty(
  matches: MatchResult[],
  difficulty?: Difficulty
): MatchResult[] {
  if (!difficulty) {
    return matches;
  }
  return matches.filter((match) => match.difficulty === difficulty);
}

/**
 * Apply all filters to match list
 * 
 * @param matches - All match results
 * @param filters - Filters to apply
 * @returns Filtered matches
 */
export function applyFilters(
  matches: MatchResult[],
  filters?: LeaderboardFilters
): MatchResult[] {
  if (!filters) {
    return matches;
  }
  
  let filtered = matches;
  
  if (filters.mode) {
    filtered = filterByMode(filtered, filters.mode);
  }
  
  if (filters.difficulty) {
    filtered = filterByDifficulty(filtered, filters.difficulty);
  }
  
  return filtered;
}
