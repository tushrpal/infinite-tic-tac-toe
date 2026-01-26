import type { RankedMatchHistoryEntry } from "./RankedMatchHistoryEntry";
import type { RankTimelinePoint } from "./RankTimelinePoint";
import { getRankTier } from "../ranked/RankTier";

/**
 * Build a rank timeline from match history.
 * 
 * This creates a sequential view of rank progression:
 * - Point 0: Initial state (before any matches)
 * - Point N: State after match N
 * 
 * ⚠️ DERIVED ONLY - recomputed on demand, never stored.
 * 
 * @param history Ranked match history (chronological order)
 * @param initialPoints Starting rank points (default: 1000)
 * @returns Timeline points including initial state
 */
export function buildRankTimeline(
  history: RankedMatchHistoryEntry[],
  initialPoints: number = 1000
): RankTimelinePoint[] {
  const timeline: RankTimelinePoint[] = [];

  // Point 0: Initial state
  timeline.push({
    index: 0,
    tier: getRankTier(initialPoints),
    points: initialPoints,
    delta: 0,
    matchId: "",
  });

  // Add a point for each match
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    
    timeline.push({
      index: i + 1,
      tier: entry.rankAfter.tier,
      points: entry.rankAfter.points,
      delta: entry.delta,
      matchId: entry.matchId,
    });
  }

  return timeline;
}
