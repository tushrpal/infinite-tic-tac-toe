/**
 * Represents the change in rank points for a player after a match.
 */
export interface RankDelta {
  /** Player identifier */
  playerId: string;

  /** Points change (positive = gain, negative = loss, 0 = draw/no change) */
  pointsChange: number;

  /** Match outcome from this player's perspective */
  outcome: "win" | "loss" | "draw";

  /** Performance multiplier applied (0.8 - 1.3) */
  performanceMultiplier: number;

  /** True if opponent was a bot */
  vsBot: boolean;

  /** Bot penalty applied (if vsBot is true) */
  botPenaltyApplied: boolean;

  /** Mode multiplier (Mode 1: 1.0, Mode 2: 1.5) */
  modeMultiplier: number;

  /** Explanation of how the delta was computed */
  explanation: string;
}

/**
 * Create a RankDelta instance.
 * @param playerId Player identifier
 * @param pointsChange Points change
 * @param outcome Match outcome
 * @param performanceMultiplier Performance multiplier
 * @param vsBot True if opponent was a bot
 * @param botPenaltyApplied True if bot penalty was applied
 * @param modeMultiplier Mode multiplier
 * @param explanation Explanation of delta computation
 * @returns RankDelta instance
 */
export function createRankDelta(
  playerId: string,
  pointsChange: number,
  outcome: "win" | "loss" | "draw",
  performanceMultiplier: number,
  vsBot: boolean,
  botPenaltyApplied: boolean,
  modeMultiplier: number,
  explanation: string
): RankDelta {
  return {
    playerId,
    pointsChange,
    outcome,
    performanceMultiplier,
    vsBot,
    botPenaltyApplied,
    modeMultiplier,
    explanation,
  };
}
