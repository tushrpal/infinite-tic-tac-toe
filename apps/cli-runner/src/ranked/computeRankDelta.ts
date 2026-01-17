import type { MatchResult } from "@infinite-ttt/shared";
import { computePerformanceMultiplier } from "./computePerformanceMultiplier";
import { createRankDelta, RankDelta } from "./RankDelta";
import type { RankedMatchContext } from "./RankedMatchContext";

/**
 * Base rank points for outcomes.
 */
const BASE_WIN = 30;
const BASE_LOSS = -30;
const BASE_DRAW = 0;

/**
 * Bot penalty multiplier.
 * Wins vs bots give reduced gain.
 */
const BOT_WIN_PENALTY = 0.6;

/**
 * Mode multipliers.
 * Mode 1: 1.0x
 * Mode 2: 1.5x (more complex, rewards more)
 */
const MODE_MULTIPLIERS = {
  mode1: 1.0,
  mode2: 1.5,
};

/**
 * Clamped point ranges.
 * Wins: 25-40
 * Losses: -40 to -25
 */
const MIN_WIN = 25;
const MAX_WIN = 40;
const MIN_LOSS = -40;
const MAX_LOSS = -25;

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute rank delta for a player based on match result.
 *
 * Logic:
 * 1. Determine outcome (win/loss/draw)
 * 2. Get base points
 * 3. Compute performance multiplier (0.8 - 1.3)
 * 4. Apply mode multiplier (1.0 or 1.5)
 * 5. Apply bot penalty if applicable (0.6x for wins vs bots)
 * 6. Clamp to valid range (25-40 for wins, -40 to -25 for losses)
 *
 * @param match MatchResult
 * @param playerId Player identifier
 * @param context RankedMatchContext
 * @returns RankDelta
 */
export function computeRankDelta(
  match: MatchResult,
  playerId: string,
  context: RankedMatchContext
): RankDelta {
  // If not ranked, no delta
  if (!context.isRanked) {
    return createRankDelta(
      playerId,
      0,
      "draw",
      1.0,
      false,
      false,
      1.0,
      "Match is not ranked"
    );
  }

  // Determine outcome
  const isWin = match.winner === playerId;
  const isDraw = match.winner === null;
  const isLoss = !isWin && !isDraw;

  let outcome: "win" | "loss" | "draw";
  let basePoints: number;

  if (isDraw) {
    outcome = "draw";
    basePoints = BASE_DRAW;
  } else if (isWin) {
    outcome = "win";
    basePoints = BASE_WIN;
  } else {
    outcome = "loss";
    basePoints = BASE_LOSS;
  }

  // Draws always give 0 points
  if (isDraw) {
    return createRankDelta(
      playerId,
      0,
      outcome,
      1.0,
      false,
      false,
      1.0,
      "Draw: no points change"
    );
  }

  // Compute performance multiplier
  const perfMultiplier = computePerformanceMultiplier(match, playerId);

  // Get mode multiplier
  const modeMultiplier = MODE_MULTIPLIERS[match.mode];

  // Check if opponent is a bot
  const opponent =
    context.player1.playerId === playerId
      ? context.player2
      : context.player1;
  const vsBot = opponent.isBot;

  // Apply bot penalty for wins
  let botPenaltyApplied = false;
  let botMultiplier = 1.0;
  if (vsBot && isWin) {
    botMultiplier = BOT_WIN_PENALTY;
    botPenaltyApplied = true;
  }

  // Compute final points
  let finalPoints =
    basePoints * perfMultiplier * modeMultiplier * botMultiplier;

  // Clamp to valid range
  if (isWin) {
    finalPoints = clamp(finalPoints, MIN_WIN, MAX_WIN);
  } else if (isLoss) {
    finalPoints = clamp(finalPoints, MIN_LOSS, MAX_LOSS);
  }

  // Round to nearest integer
  finalPoints = Math.round(finalPoints);

  // Build explanation
  let explanation = `${outcome === "win" ? "Win" : "Loss"}: `;
  explanation += `base=${basePoints}, `;
  explanation += `perf=${perfMultiplier.toFixed(2)}x, `;
  explanation += `mode=${modeMultiplier}x`;
  if (botPenaltyApplied) {
    explanation += `, bot=${botMultiplier}x`;
  }
  explanation += ` → ${finalPoints} points`;

  return createRankDelta(
    playerId,
    finalPoints,
    outcome,
    perfMultiplier,
    vsBot,
    botPenaltyApplied,
    modeMultiplier,
    explanation
  );
}
