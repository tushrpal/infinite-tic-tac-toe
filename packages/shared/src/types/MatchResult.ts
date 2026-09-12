/**
 * FROZEN API: MatchResult (MOST IMPORTANT)
 * 
 * This is what leaderboards, backend, analytics consume.
 * This is your future-proof contract.
 * 
 * 🔒 CRITICAL RULES:
 * ❌ No rank points here
 * ❌ No ELO
 * ❌ No leaderboard logic
 * ✅ Pure facts only
 * 
 * This represents a complete match/session that may contain:
 * - Single game (Mode 1)
 * - Multiple rounds (Mode 2)
 * 
 * Once frozen, DO NOT change shape without a major version bump.
 */

import type { GameResult } from './GameResult.js';

/**
 * Player participant in a match
 */
export interface MatchPlayer {
  /** Unique identifier for the player */
  id: string;
  
  /** Type of player */
  type: 'human' | 'bot';
}

/**
 * Game mode identifier
 */
export type GameMode = 'mode1' | 'mode2';

/**
 * Bot difficulty level
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Complete match result (session-level)
 * Represents one complete match that may span multiple games/rounds
 */
export interface MatchResult {
  /** Unique identifier for this match */
  matchId: string;
  
  /** Game mode played */
  mode: GameMode;
  
  /** Whether this match counts for ranking */
  isRanked: boolean;
  
  /** Difficulty level (for bot matches) */
  difficulty: Difficulty;
  
  /** Players in this match */
  players: MatchPlayer[];
  
  /** All games/rounds played in this match */
  games: GameResult[];
  
  /** Winner of the match (player ID, null = draw) */
  winner: string | null;
  
  /** Number of rounds/games played */
  roundsPlayed: number;
  
  /** Total moves across all rounds */
  totalMoves: number;
  
  /** Number of draws in this match */
  drawCount: number;
  
  /** Timestamp when match was created (Unix milliseconds) */
  createdAt: number;
}
