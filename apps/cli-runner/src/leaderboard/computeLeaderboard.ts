/**
 * Leaderboard Computation — Pure Function
 * 
 * Aggregates MatchResult[] into LeaderboardEntry[]
 * 
 * CRITICAL RULES:
 * - 100% deterministic
 * - No side effects
 * - No storage writes
 * - Fully recomputable
 * - Same input → same output (always)
 * 
 * This is the ONLY source of truth for leaderboard logic.
 */

import type { MatchResult, GameMode, Difficulty } from '@infinite-ttt/shared';
import type { LeaderboardEntry } from './LeaderboardEntry.js';
import { applyFilters, type LeaderboardFilters } from './filters.js';

/**
 * Player statistics aggregator (internal)
 */
interface PlayerStats {
  playerId: string;
  playerType: 'human' | 'bot';
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  mode: GameMode;
  difficulty?: Difficulty;
}

/**
 * Compute leaderboard from match results
 * 
 * Pure function that:
 * 1. Filters matches by mode/difficulty
 * 2. Aggregates stats per player
 * 3. Calculates win rates
 * 4. Returns sorted entries
 * 
 * @param matches - All stored match results
 * @param filters - Optional filters (mode, difficulty)
 * @returns Sorted leaderboard entries (highest win rate first)
 */
export function computeLeaderboard(
  matches: MatchResult[],
  filters?: LeaderboardFilters
): LeaderboardEntry[] {
  // Step 1: Apply filters
  const filteredMatches = applyFilters(matches, filters);
  
  // Step 2: Aggregate stats per player
  const statsMap = new Map<string, PlayerStats>();
  
  for (const match of filteredMatches) {
    for (const player of match.players) {
      // Get or create player stats
      let stats = statsMap.get(player.id);
      
      if (!stats) {
        stats = {
          playerId: player.id,
          playerType: player.type,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          mode: match.mode,
          difficulty: match.difficulty,
        };
        statsMap.set(player.id, stats);
      }
      
      // Increment games played
      stats.gamesPlayed++;
      
      // Determine outcome for this player
      if (match.winner === null) {
        // Draw
        stats.draws++;
      } else if (match.winner === player.id) {
        // Win
        stats.wins++;
      } else {
        // Loss
        stats.losses++;
      }
    }
  }
  
  // Step 3: Convert to leaderboard entries with win rate
  const entries: LeaderboardEntry[] = Array.from(statsMap.values()).map(
    (stats) => ({
      playerId: stats.playerId,
      playerType: stats.playerType,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0,
      mode: stats.mode,
      difficulty: stats.difficulty,
    })
  );
  
  // Step 4: Sort by win rate (descending), then by games played (descending)
  entries.sort((a, b) => {
    // Primary sort: win rate (descending)
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    
    // Secondary sort: games played (descending) for stable ordering
    return b.gamesPlayed - a.gamesPlayed;
  });
  
  return entries;
}

/**
 * Get total match count after filtering
 * 
 * @param matches - All stored match results
 * @param filters - Optional filters (mode, difficulty)
 * @returns Number of matches that match the filters
 */
export function getFilteredMatchCount(
  matches: MatchResult[],
  filters?: LeaderboardFilters
): number {
  return applyFilters(matches, filters).length;
}
