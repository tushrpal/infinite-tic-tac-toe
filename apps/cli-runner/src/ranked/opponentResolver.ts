import type { RankedPlayer } from "./RankedPlayer";
import { createRankedPlayer, getBotDifficultyForTier } from "./index";

/**
 * Opponent type for ranked matches.
 */
export type RankedOpponent = {
  /** Opponent type */
  type: "human" | "bot";

  /** Opponent player data */
  player: RankedPlayer;

  /** True if this is a bot fallback (no human available) */
  isBotFallback: boolean;
};

/**
 * Resolve opponent for a ranked match.
 *
 * Strategy:
 * 1. If human opponent available → use human
 * 2. Else → bot fallback (based on player tier)
 *
 * Bot difficulty by tier:
 * - Bronze → Easy
 * - Silver → Medium
 * - Gold → Medium
 * - Platinum+ → Hard
 *
 * @param player Current player
 * @param humanOpponent Optional human opponent (for PvP)
 * @returns RankedOpponent
 */
export function resolveRankedOpponent(
  player: RankedPlayer,
  humanOpponent?: RankedPlayer
): RankedOpponent {
  // If human opponent provided, use them
  if (humanOpponent) {
    return {
      type: "human",
      player: humanOpponent,
      isBotFallback: false,
    };
  }

  // Bot fallback: choose difficulty based on player tier
  const botDifficulty = getBotDifficultyForTier(player.tier);
  const botId = `bot:${botDifficulty}`;

  // Bot rank doesn't matter (bots don't gain/lose rank)
  // Set to 0 for clarity
  const botPlayer = createRankedPlayer(botId, 0, "Bronze", true, botDifficulty);

  return {
    type: "bot",
    player: botPlayer,
    isBotFallback: true,
  };
}

/**
 * Get bot ID for match result.
 * Format: "bot:difficulty"
 *
 * @param difficulty Bot difficulty
 * @returns Bot player ID
 */
export function getBotId(difficulty: "easy" | "medium" | "hard"): string {
  return `bot:${difficulty}`;
}
