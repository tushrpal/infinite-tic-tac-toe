/**
 * Rank tiers for the ranked system.
 * Each tier represents a range of rank points.
 */
export type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

/**
 * Rank tier thresholds.
 * Maps tier to minimum points required.
 */
export const RANK_TIER_THRESHOLDS: Record<RankTier, number> = {
  Bronze: 0,
  Silver: 1000,
  Gold: 2000,
  Platinum: 3000,
  Diamond: 4000,
};

/**
 * Get the rank tier for a given number of points.
 * @param points Current rank points
 * @returns The corresponding rank tier
 */
export function getRankTier(points: number): RankTier {
  if (points >= RANK_TIER_THRESHOLDS.Diamond) return "Diamond";
  if (points >= RANK_TIER_THRESHOLDS.Platinum) return "Platinum";
  if (points >= RANK_TIER_THRESHOLDS.Gold) return "Gold";
  if (points >= RANK_TIER_THRESHOLDS.Silver) return "Silver";
  return "Bronze";
}

/**
 * Get the bot difficulty appropriate for a player's rank tier.
 * @param tier Player's rank tier
 * @returns Bot difficulty level
 */
export function getBotDifficultyForTier(
  tier: RankTier
): "easy" | "medium" | "hard" {
  switch (tier) {
    case "Bronze":
      return "easy";
    case "Silver":
    case "Gold":
      return "medium";
    case "Platinum":
    case "Diamond":
      return "hard";
  }
}
