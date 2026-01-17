import type { MatchResult } from "@infinite-ttt/shared";

/**
 * Performance multiplier range (strictly enforced).
 * 0.8 = underperformed
 * 1.0 = expected
 * 1.3 = dominant
 */
const MIN_MULTIPLIER = 0.8;
const MAX_MULTIPLIER = 1.3;

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute performance multiplier for Mode 1 (Infinite 3x3).
 * Based on total move count - faster wins = higher multiplier.
 *
 * @param match MatchResult
 * @param playerId Player identifier
 * @param isWin True if player won
 * @returns Performance multiplier (0.8 - 1.3)
 */
function computeMode1Multiplier(
  match: MatchResult,
  playerId: string,
  isWin: boolean
): number {
  if (!isWin) {
    // For losses, lower move count means we lost quickly (bad)
    // Higher move count means we put up a fight (better)
    const moves = match.totalMoves;
    if (moves < 10) return 0.8; // Quick loss
    if (moves < 20) return 0.85;
    if (moves < 30) return 0.9;
    if (moves < 40) return 0.95;
    return 1.0; // Long loss (fought hard)
  }

  // For wins, lower move count means dominant victory
  const moves = match.totalMoves;
  if (moves <= 5) return 1.3; // Perfect win
  if (moves <= 10) return 1.25; // Very fast win
  if (moves <= 15) return 1.2;
  if (moves <= 20) return 1.15;
  if (moves <= 30) return 1.1;
  if (moves <= 40) return 1.05;
  return 1.0; // Standard win
}

/**
 * Compute performance multiplier for Mode 2 (Expanding Board).
 * Based on round margin, draw count, and replay count.
 *
 * @param match MatchResult
 * @param playerId Player identifier
 * @param isWin True if player won
 * @returns Performance multiplier (0.8 - 1.3)
 */
function computeMode2Multiplier(
  match: MatchResult,
  playerId: string,
  isWin: boolean
): number {
  // Count rounds won by each player
  let playerWins = 0;
  let opponentWins = 0;

  for (const game of match.games) {
    if (game.winner === playerId) {
      playerWins++;
    } else if (game.winner !== null) {
      opponentWins++;
    }
  }

  const roundMargin = playerWins - opponentWins;
  const drawCount = match.drawCount;

  if (!isWin) {
    // For losses, assess how badly we lost
    if (roundMargin <= -3) return 0.8; // Blowout loss
    if (roundMargin === -2) return 0.85;
    if (roundMargin === -1) return 0.9; // Close loss
    return 0.95;
  }

  // For wins, assess dominance
  if (roundMargin >= 3 && drawCount === 0) return 1.3; // Dominant win, no draws
  if (roundMargin >= 3) return 1.25; // Dominant win with draws
  if (roundMargin === 2 && drawCount === 0) return 1.2; // Solid win
  if (roundMargin === 2) return 1.15;
  if (roundMargin === 1 && drawCount === 0) return 1.1; // Narrow win
  if (roundMargin === 1) return 1.05;
  return 1.0; // Standard win
}

/**
 * Compute performance multiplier based on match result.
 * Range: 0.8 (underperformed) to 1.3 (dominant).
 *
 * Mode 1 signals:
 * - Total move count (faster win = higher multiplier)
 *
 * Mode 2 signals:
 * - Round margin (rounds won - rounds lost)
 * - Draw count
 *
 * @param match MatchResult
 * @param playerId Player identifier
 * @returns Performance multiplier (0.8 - 1.3)
 */
export function computePerformanceMultiplier(
  match: MatchResult,
  playerId: string
): number {
  const isWin = match.winner === playerId;
  const isDraw = match.winner === null;

  // Draws always get 1.0 multiplier
  if (isDraw) {
    return 1.0;
  }

  let multiplier: number;

  if (match.mode === "mode1") {
    multiplier = computeMode1Multiplier(match, playerId, isWin);
  } else {
    // mode2
    multiplier = computeMode2Multiplier(match, playerId, isWin);
  }

  // Strict clamping
  return clamp(multiplier, MIN_MULTIPLIER, MAX_MULTIPLIER);
}
