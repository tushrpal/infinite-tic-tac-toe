import type { RankTier } from "../ranked/RankTier";

/**
 * A single point in a player's rank progression timeline.
 * Used for charts and progression visualization.
 * 
 * ⚠️ DERIVED ONLY - computed on demand, never stored.
 */
export interface RankTimelinePoint {
  /** Sequential index in the timeline (0 = start) */
  index: number;
  
  /** Rank tier at this point */
  tier: RankTier;
  
  /** Exact rank points */
  points: number;
  
  /** Delta from previous point (0 for first point) */
  delta: number;
  
  /** Match ID that caused this rank change (empty string for initial state) */
  matchId: string;
}
