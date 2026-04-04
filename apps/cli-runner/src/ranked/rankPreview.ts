import type { RankedPlayer } from "./RankedPlayer";
import type { RankedOpponent } from "./opponentResolver";
import { createRankedMatchContext } from "./RankedMatchContext";
import { computeRankDelta } from "./computeRankDelta";
import { RANK_TIER_THRESHOLDS } from "./RankTier";

/**
 * Rank preview information for pre-match display.
 */
export interface RankPreview {
  /** Player's current rank */
  currentRank: string;

  /** Player's current points */
  currentPoints: number;

  /** Opponent description */
  opponent: string;

  /** Game mode */
  mode: "Mode 1" | "Mode 2";

  /** Expected point change for win (min-max) */
  winRange: { min: number; max: number };

  /** Expected point change for loss (min-max) */
  lossRange: { min: number; max: number };

  /** True if opponent is a bot fallback */
  isBotFallback: boolean;

  /** Next tier threshold (if close) */
  nextTierInfo?: {
    tier: string;
    threshold: number;
    pointsAway: number;
  };
}

/**
 * Compute rank preview for pre-match display.
 *
 * Shows expected point changes based on performance ranges:
 * - Win: 25-40 points (based on performance)
 * - Loss: -40 to -25 points (based on performance)
 *
 * @param player Current player
 * @param opponent Resolved opponent
 * @param mode Game mode (1 or 2)
 * @returns RankPreview
 */
export function computeRankPreview(
  player: RankedPlayer,
  opponent: RankedOpponent,
  mode: 1 | 2
): RankPreview {
  const context = createRankedMatchContext(
    player,
    opponent.player,
    true,
    mode
  );

  // Create mock matches for best/worst case scenarios
  const createMockMatch = (
    winner: string | null,
    performanceMultiplier: number
  ) => ({
    matchId: "preview",
    mode: mode === 1 ? ("mode1" as const) : ("mode2" as const),
    isRanked: true,
    difficulty: opponent.player.botDifficulty || ("medium" as const),
    players: [
      { id: player.playerId, type: "human" as const },
      {
        id: opponent.player.playerId,
        type: opponent.type as "human" | "bot",
      },
    ],
    games: [],
    winner,
    roundsPlayed: 1,
    totalMoves: performanceMultiplier === 1.3 ? 5 : 30, // Best vs standard
    drawCount: 0,
    createdAt: Date.now(),
  });

  // Compute win range (best case = 1.3x, worst case = 1.0x)
  const bestWinDelta = computeRankDelta(
    createMockMatch(player.playerId, 1.3),
    player.playerId,
    context
  );
  const worstWinDelta = computeRankDelta(
    createMockMatch(player.playerId, 1.0),
    player.playerId,
    context
  );

  // Compute loss range (best case = 1.0x, worst case = 0.8x)
  const bestLossDelta = computeRankDelta(
    createMockMatch(opponent.player.playerId, 1.0),
    player.playerId,
    context
  );
  const worstLossDelta = computeRankDelta(
    createMockMatch(opponent.player.playerId, 0.8),
    player.playerId,
    context
  );

  // Opponent description
  const opponentDesc = opponent.isBotFallback
    ? `Bot (${opponent.player.botDifficulty})`
    : `${opponent.player.playerId} (${opponent.player.tier})`;

  // Check if close to next tier
  const nextTierInfo = getNextTierInfo(player);

  return {
    currentRank: `${player.tier}`,
    currentPoints: player.points,
    opponent: opponentDesc,
    mode: mode === 1 ? "Mode 1" : "Mode 2",
    winRange: {
      min: worstWinDelta.pointsChange,
      max: bestWinDelta.pointsChange,
    },
    lossRange: {
      min: worstLossDelta.pointsChange,
      max: bestLossDelta.pointsChange,
    },
    isBotFallback: opponent.isBotFallback,
    nextTierInfo,
  };
}

/**
 * Get info about next tier if player is close to promotion.
 *
 * @param player Current player
 * @returns Next tier info or undefined
 */
function getNextTierInfo(
  player: RankedPlayer
): { tier: string; threshold: number; pointsAway: number } | undefined {
  const tiers: Array<[string, number]> = [
    ["Bronze", RANK_TIER_THRESHOLDS.Bronze],
    ["Silver", RANK_TIER_THRESHOLDS.Silver],
    ["Gold", RANK_TIER_THRESHOLDS.Gold],
    ["Platinum", RANK_TIER_THRESHOLDS.Platinum],
    ["Diamond", RANK_TIER_THRESHOLDS.Diamond],
  ];

  // Find current tier index
  const currentIndex = tiers.findIndex(([tier]) => tier === player.tier);
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return undefined; // Max tier reached
  }

  const [nextTier, nextThreshold] = tiers[currentIndex + 1];
  const pointsAway = nextThreshold - player.points;

  // Only show if within 100 points
  if (pointsAway <= 100 && pointsAway > 0) {
    return {
      tier: nextTier,
      threshold: nextThreshold,
      pointsAway,
    };
  }

  return undefined;
}

/**
 * Format rank preview for console display.
 *
 * @param preview RankPreview
 * @returns Formatted string for display
 */
export function formatRankPreview(preview: RankPreview): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("🏆 RANKED MATCH");
  lines.push("═".repeat(50));
  lines.push(
    `Your Rank: ${preview.currentRank} (${preview.currentPoints} pts)`
  );
  lines.push(`Opponent: ${preview.opponent}`);
  lines.push(`Mode: ${preview.mode}`);

  if (preview.nextTierInfo) {
    lines.push("");
    lines.push(
      `⭐ ${preview.nextTierInfo.pointsAway} points until ${preview.nextTierInfo.tier}!`
    );
  }

  lines.push("");
  lines.push("Expected Rank Change:");

  // Win range
  if (preview.winRange.min === preview.winRange.max) {
    lines.push(`  Win: +${preview.winRange.max}`);
  } else {
    lines.push(`  Win: +${preview.winRange.min} to +${preview.winRange.max}`);
  }

  // Loss range
  if (preview.lossRange.min === preview.lossRange.max) {
    lines.push(`  Loss: ${preview.lossRange.min}`);
  } else {
    lines.push(
      `  Loss: ${preview.lossRange.max} to ${preview.lossRange.min}`
    );
  }

  if (preview.isBotFallback) {
    lines.push("");
    lines.push("⚠️  Bot fallback: Wins give reduced points (60%)");
  }

  lines.push("═".repeat(50));
  lines.push("");

  return lines.join("\n");
}
