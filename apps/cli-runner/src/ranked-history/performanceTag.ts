import type { MatchResult } from "@infinite-ttt/shared";
import type { PerformanceTag } from "./RankedMatchHistoryEntry";

/**
 * Determine performance tag based on match characteristics.
 * 
 * This is purely for UX/explanation - does NOT affect rank calculation.
 * 
 * Rules:
 * - Mode 1: Based on total moves to win
 * - Mode 2: Based on round score (2-0 vs 2-1) and draws
 * - Draws: Always tagged as "draw"
 */
export function computePerformanceTag(
  match: MatchResult,
  result: "win" | "loss" | "draw"
): PerformanceTag {
  // Draws are always tagged as draw
  if (result === "draw") {
    return "draw";
  }

  const mode = match.mode;
  
  if (mode === "mode1") {
    return computeMode1PerformanceTag(match);
  } else {
    return computeMode2PerformanceTag(match);
  }
}

/**
 * Mode 1 performance tags based on total moves.
 * 
 * - ≤5 moves: dominant (quick decisive win)
 * - 6-7 moves: close (standard competitive game)
 * - ≥8 moves: scrappy (long drawn-out battle)
 */
function computeMode1PerformanceTag(match: MatchResult): PerformanceTag {
  const totalMoves = match.totalMoves;
  
  if (totalMoves <= 5) {
    return "dominant";
  } else if (totalMoves <= 7) {
    return "close";
  } else {
    return "scrappy";
  }
}

/**
 * Mode 2 performance tags based on round score and draws.
 * 
 * - 2-0 win (no draws): dominant
 * - 2-1 win (no draws): close
 * - Win with any draw rounds: scrappy
 */
function computeMode2PerformanceTag(match: MatchResult): PerformanceTag {
  const roundsPlayed = match.roundsPlayed;
  const drawCount = match.drawCount;
  
  // Any replayed draws make it scrappy
  if (drawCount > 0) {
    return "scrappy";
  }
  
  // 2-0 (only 2 rounds played, no draws)
  if (roundsPlayed === 2) {
    return "dominant";
  }
  
  // 2-1 (3 rounds played, no draws)
  if (roundsPlayed === 3) {
    return "close";
  }
  
  // Fallback (shouldn't happen in valid Mode 2)
  return "close";
}
