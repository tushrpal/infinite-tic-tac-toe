/**
 * Ranked System Module
 *
 * A logic-only ranked system for Infinite Tic-Tac-Toe.
 *
 * Key principles:
 * - Fully derived from MatchResult
 * - No backend, networking, or storage changes required
 * - Deterministic and replay-safe
 * - Supports Mode 1 and Mode 2
 * - Supports bot fallback for ranked matches
 * - Performance-weighted rank deltas (25-40 points)
 *
 * Architecture:
 * - RankTier: 5 tiers (Bronze, Silver, Gold, Platinum, Diamond)
 * - RankedPlayer: Player state with rank points and tier
 * - RankedMatchContext: Pre-match player state
 * - RankDelta: Result of rank calculation
 * - Performance multiplier: 0.8-1.3 based on match performance
 * - Mode multiplier: 1.0x (Mode 1), 1.5x (Mode 2)
 * - Bot penalty: 0.6x for wins vs bots
 * - Clamped ranges: 25-40 for wins, -40 to -25 for losses
 */

// Core Types
export type { RankTier } from "./RankTier";
export type { RankedPlayer } from "./RankedPlayer";
export type { RankedMatchContext } from "./RankedMatchContext";
export type { RankDelta } from "./RankDelta";
export type { RankDeltaResult } from "./applyRankDelta";

// Flow Types
export type { RankedSession } from "./RankedSession";
export type { RankedOpponent } from "./opponentResolver";
export type { RankPreview } from "./rankPreview";
export type { RankSummary } from "./rankSummary";

// Tier utilities
export {
  RANK_TIER_THRESHOLDS,
  getRankTier,
  getBotDifficultyForTier,
} from "./RankTier";

// Factory functions
export { createRankedPlayer } from "./RankedPlayer";
export { createRankedMatchContext } from "./RankedMatchContext";
export { createRankDelta } from "./RankDelta";

// Core functions
export { computePerformanceMultiplier } from "./computePerformanceMultiplier";
export { computeRankDelta } from "./computeRankDelta";
export { applyRankDelta } from "./applyRankDelta";

// Session management
export {
  createRankedSession,
  createRankedSessionWithPoints,
  updateRankedSession,
  getSessionStats,
} from "./RankedSession";

// Opponent resolution
export { resolveRankedOpponent, getBotId } from "./opponentResolver";

// Preview and summary
export { computeRankPreview, formatRankPreview } from "./rankPreview";
export {
  createRankSummary,
  formatRankSummary,
  formatQuickRankUpdate,
} from "./rankSummary";

// Controller
export { RankedMatchController } from "./RankedMatchController";

