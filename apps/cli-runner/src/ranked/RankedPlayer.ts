import { RankTier } from "./RankTier";

/**
 * Represents a player's ranked status and statistics.
 * This is derived data, never stored in MatchResult.
 */
export interface RankedPlayer {
  /** Player identifier (human username or bot:difficulty) */
  playerId: string;

  /** Current rank points */
  points: number;

  /** Current rank tier */
  tier: RankTier;

  /** True if this player is a bot */
  isBot: boolean;

  /** Bot difficulty if isBot is true */
  botDifficulty?: "easy" | "medium" | "hard";
}

/**
 * Create a RankedPlayer instance.
 * @param playerId Player identifier
 * @param points Initial rank points
 * @param tier Initial rank tier
 * @param isBot Whether this is a bot
 * @param botDifficulty Bot difficulty if applicable
 * @returns RankedPlayer instance
 */
export function createRankedPlayer(
  playerId: string,
  points: number,
  tier: RankTier,
  isBot: boolean = false,
  botDifficulty?: "easy" | "medium" | "hard"
): RankedPlayer {
  return {
    playerId,
    points,
    tier,
    isBot,
    botDifficulty,
  };
}
