import { RankTier, getBotDifficultyForTier } from "../ranked/RankTier";

export type BotDifficulty = "easy" | "medium" | "hard";

/**
 * Maps player rank tier to appropriate bot difficulty for fallback matches
 * 
 * Rules:
 * - Bronze → Easy
 * - Silver → Medium
 * - Gold → Medium
 * - Platinum+ → Hard
 */
export class BotFallbackResolver {
  /**
   * Determines bot difficulty based on player's rank tier
   * Uses the same logic as the existing ranked system
   */
  static resolveBotDifficulty(rankTier: RankTier): BotDifficulty {
    return getBotDifficultyForTier(rankTier);
  }

  /**
   * Gets human-readable description of bot difficulty assignment
   */
  static getDescription(rankTier: RankTier): string {
    const difficulty = this.resolveBotDifficulty(rankTier);
    return `${rankTier} players face ${difficulty} bots`;
  }
}
