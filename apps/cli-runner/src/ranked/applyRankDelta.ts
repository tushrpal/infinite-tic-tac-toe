import { getRankTier, RankTier } from "./RankTier";
import type { RankDelta } from "./RankDelta";

/**
 * Result of applying a rank delta.
 */
export interface RankDeltaResult {
  /** New rank points */
  newPoints: number;

  /** New rank tier */
  newTier: RankTier;

  /** Previous tier (for detecting promotions/demotions) */
  previousTier: RankTier;

  /** True if player was promoted */
  promoted: boolean;

  /** True if player was demoted */
  demoted: boolean;
}

/**
 * Apply rank delta to current points and compute new tier.
 *
 * Rules:
 * - Points cannot go below 0
 * - Tier is automatically computed from points
 * - Detects promotions and demotions
 *
 * @param currentPoints Current rank points
 * @param delta RankDelta to apply
 * @returns RankDeltaResult with new points and tier
 */
export function applyRankDelta(
  currentPoints: number,
  delta: RankDelta
): RankDeltaResult {
  const previousTier = getRankTier(currentPoints);

  // Apply delta (cannot go below 0)
  let newPoints = currentPoints + delta.pointsChange;
  if (newPoints < 0) {
    newPoints = 0;
  }

  // Compute new tier
  const newTier = getRankTier(newPoints);

  // Detect promotions/demotions
  const tierOrder: RankTier[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const previousIndex = tierOrder.indexOf(previousTier);
  const newIndex = tierOrder.indexOf(newTier);

  const promoted = newIndex > previousIndex;
  const demoted = newIndex < previousIndex;

  return {
    newPoints,
    newTier,
    previousTier,
    promoted,
    demoted,
  };
}
