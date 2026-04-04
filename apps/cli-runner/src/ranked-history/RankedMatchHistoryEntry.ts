import type { RankTier } from "../ranked/RankTier";

/**
 * Performance classification for a match.
 * Used for UX and explanation - does NOT affect rank calculation.
 */
export type PerformanceTag = "dominant" | "close" | "scrappy" | "draw";

/**
 * Snapshot of a player's rank at a point in time.
 */
export interface RankSnapshot {
  /** Rank tier (Bronze, Silver, etc.) */
  tier: RankTier;
  
  /** Exact rank points */
  points: number;
}

/**
 * A single entry in a player's ranked match history.
 * This is a DERIVED model - computed on demand from stored matches.
 * 
 * ⚠️ IMPORTANT:
 * - NOT stored in files
 * - Recomputed from MatchResult[] each time
 * - Used for display and analytics only
 */
export interface RankedMatchHistoryEntry {
  /** Unique match identifier */
  matchId: string;
  
  /** Game mode played */
  mode: "mode1" | "mode2";
  
  /** Bot difficulty (for bot matches) */
  difficulty: "easy" | "medium" | "hard";
  
  /** Type of opponent */
  opponentType: "human" | "bot";
  
  /** Human-readable opponent label (e.g. "Bot (Medium)" or "Player123") */
  opponentLabel: string;
  
  /** Match outcome from player's perspective */
  result: "win" | "loss" | "draw";
  
  /** Performance quality (for explanation, not calculation) */
  performanceTag: PerformanceTag;
  
  /** Rank before this match */
  rankBefore: RankSnapshot;
  
  /** Rank after applying delta */
  rankAfter: RankSnapshot;
  
  /** Rank points gained or lost */
  delta: number;
  
  /** Timestamp when match was played (Unix milliseconds) */
  playedAt: number;
}
