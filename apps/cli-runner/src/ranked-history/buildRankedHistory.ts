import type { MatchResult } from "@infinite-ttt/shared";
import type { RankedMatchHistoryEntry } from "./RankedMatchHistoryEntry";
import { createRankedPlayer } from "../ranked/RankedPlayer";
import { computeRankDelta } from "../ranked/computeRankDelta";
import { applyRankDelta } from "../ranked/applyRankDelta";
import { getRankTier } from "../ranked/RankTier";
import { computePerformanceTag } from "./performanceTag";

/**
 * Build ranked match history from stored matches.
 * 
 * This is a PURE DERIVATION:
 * - Takes MatchResult[] (from storage)
 * - Returns RankedMatchHistoryEntry[]
 * - Does NOT mutate any stored data
 * 
 * Algorithm:
 * 1. Start with initial rank (Bronze, 1000 points)
 * 2. Iterate through matches chronologically
 * 3. For each ranked match:
 *    - Compute delta using existing ranked logic
 *    - Apply delta to get new rank
 *    - Emit history entry
 *    - Update current rank for next iteration
 * 
 * @param matches All stored matches (will be filtered for ranked)
 * @param playerId Player to build history for
 * @param initialPoints Starting rank points (default: 1000)
 * @returns Array of history entries in chronological order
 */
export function buildRankedHistory(
  matches: MatchResult[],
  playerId: string,
  initialPoints: number = 1000
): RankedMatchHistoryEntry[] {
  // Filter and sort matches
  const rankedMatches = matches
    .filter((m) => m.isRanked)
    .filter((m) => m.players.some((p) => p.id === playerId))
    .sort((a, b) => a.createdAt - b.createdAt);

  const history: RankedMatchHistoryEntry[] = [];
  
  // Track current rank state
  let currentPoints = initialPoints;
  let currentTier = getRankTier(currentPoints);

  for (const match of rankedMatches) {
    // Identify opponent
    const opponent = match.players.find((p) => p.id !== playerId);
    if (!opponent) {
      continue; // Should never happen in valid matches
    }

    // Determine outcome
    const isWin = match.winner === playerId;
    const isDraw = match.winner === null;
    const result = isDraw ? "draw" : isWin ? "win" : "loss";

    // Create opponent label
    const opponentLabel = opponent.type === "bot"
      ? `Bot (${capitalizeFirst(match.difficulty)})`
      : opponent.id;

    // Snapshot rank before match
    const rankBefore = {
      tier: currentTier,
      points: currentPoints,
    };

    // Build ranked context for delta computation
    const player1 = createRankedPlayer(
      playerId,
      currentPoints,
      currentTier,
      false
    );
    
    const player2 = createRankedPlayer(
      opponent.id,
      1000, // Opponent rank doesn't matter for single-player history
      getRankTier(1000),
      opponent.type === "bot",
      opponent.type === "bot" ? match.difficulty : undefined
    );

    const context = {
      player1,
      player2,
      isRanked: match.isRanked,
      mode: (match.mode === "mode1" ? 1 : 2) as 1 | 2,
    };

    // Compute delta
    const delta = computeRankDelta(match, playerId, context);

    // Apply delta
    const applyResult = applyRankDelta(currentPoints, delta);
    
    // Update current state
    currentPoints = applyResult.newPoints;
    currentTier = applyResult.newTier;

    // Snapshot rank after match
    const rankAfter = {
      tier: currentTier,
      points: currentPoints,
    };

    // Compute performance tag
    const performanceTag = computePerformanceTag(match, result);

    // Create history entry
    const entry: RankedMatchHistoryEntry = {
      matchId: match.matchId,
      mode: match.mode,
      difficulty: match.difficulty,
      opponentType: opponent.type,
      opponentLabel,
      result,
      performanceTag,
      rankBefore,
      rankAfter,
      delta: delta.pointsChange,
      playedAt: match.createdAt,
    };

    history.push(entry);
  }

  return history;
}

/**
 * Capitalize first letter of a string.
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
