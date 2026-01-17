/**
 * Leaderboard Entry — Derived Statistics Model
 * 
 * This is a COMPUTED view, not stored data.
 * 
 * RULES:
 * - 100% derived from MatchResult[]
 * - No rank field
 * - No points/ELO
 * - Recomputable anytime
 * - Mode-aware
 * - Difficulty-aware
 */

import type { GameMode, Difficulty } from '@infinite-ttt/shared';

/**
 * Single player's aggregated statistics
 * 
 * Computed from all matches that:
 * - Include this player
 * - Match the mode filter (if any)
 * - Match the difficulty filter (if any)
 */
export interface LeaderboardEntry {
  /** Player identifier */
  playerId: string;
  
  /** Player type */
  playerType: 'human' | 'bot';
  
  /** Total games played */
  gamesPlayed: number;
  
  /** Total wins */
  wins: number;
  
  /** Total losses */
  losses: number;
  
  /** Total draws */
  draws: number;
  
  /** Win rate (wins / gamesPlayed) */
  winRate: number;
  
  /** Game mode this entry represents */
  mode: GameMode;
  
  /** Difficulty level (for bot matches) */
  difficulty?: Difficulty;
}
