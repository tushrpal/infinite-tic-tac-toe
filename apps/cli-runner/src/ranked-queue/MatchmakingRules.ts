import { QueueTicket } from "./QueueTicket";
import { RankTier } from "../ranked/RankTier";

/**
 * Pure logic for determining if two players can be matched
 * 
 * Rules:
 * 1. Must be same mode
 * 2. Rank tier difference ≤ 1 tier
 */
export class MatchmakingRules {
  /**
   * Rank tier hierarchy for distance calculation
   */
  private static readonly RANK_HIERARCHY: readonly RankTier[] = [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
  ] as const;

  /**
   * Gets the numeric index of a rank tier
   */
  private static getRankIndex(tier: RankTier): number {
    const index = this.RANK_HIERARCHY.indexOf(tier);
    if (index === -1) {
      throw new Error(`Unknown rank tier: ${tier}`);
    }
    return index;
  }

  /**
   * Calculates the tier distance between two ranks
   */
  static calculateTierDistance(tierA: RankTier, tierB: RankTier): number {
    return Math.abs(this.getRankIndex(tierA) - this.getRankIndex(tierB));
  }

  /**
   * Checks if two players can be matched
   */
  static canMatch(playerA: QueueTicket, playerB: QueueTicket): boolean {
    // Must be same mode
    if (playerA.mode !== playerB.mode) {
      return false;
    }

    // Rank tier difference must be ≤ 1
    const tierDistance = this.calculateTierDistance(
      playerA.rankTier,
      playerB.rankTier
    );

    return tierDistance <= 1;
  }

  /**
   * Finds best match for a player from a list of candidates
   * Returns null if no valid match exists
   */
  static findBestMatch(
    player: QueueTicket,
    candidates: QueueTicket[]
  ): QueueTicket | null {
    // Filter valid matches
    const validMatches = candidates.filter((candidate) =>
      this.canMatch(player, candidate)
    );

    if (validMatches.length === 0) {
      return null;
    }

    // Prefer closest rank tier, then earliest queue entry
    validMatches.sort((a, b) => {
      const distanceA = this.calculateTierDistance(player.rankTier, a.rankTier);
      const distanceB = this.calculateTierDistance(player.rankTier, b.rankTier);

      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }

      // Same distance → prefer earlier queue entry
      return a.enteredAt - b.enteredAt;
    });

    return validMatches[0];
  }

  /**
   * Gets human-readable reason why two players cannot match
   */
  static getMatchRejectionReason(
    playerA: QueueTicket,
    playerB: QueueTicket
  ): string {
    if (playerA.mode !== playerB.mode) {
      return `Different modes (${playerA.mode} vs ${playerB.mode})`;
    }

    const tierDistance = this.calculateTierDistance(
      playerA.rankTier,
      playerB.rankTier
    );

    if (tierDistance > 1) {
      return `Rank gap too large (${tierDistance} tiers apart)`;
    }

    return "Unknown reason";
  }
}
