import type { RankedPlayer } from "./RankedPlayer";
import { createRankedPlayer } from "./RankedPlayer";
import { getRankTier } from "./RankTier";

/**
 * In-memory ranked session state.
 * This is NOT persisted - rank resets on restart.
 *
 * Design:
 * - Lives in memory only
 * - Reset when CLI restarts
 * - Future: will sync to backend
 */
export interface RankedSession {
  /** Current player state */
  player: RankedPlayer;

  /** Timestamp when session was created */
  createdAt: number;

  /** Total ranked matches played this session */
  matchesPlayed: number;

  /** Wins this session */
  wins: number;

  /** Losses this session */
  losses: number;

  /** Draws this session */
  draws: number;
}

/**
 * Create a new ranked session for a player.
 * Starts with default Bronze tier and 0 points.
 *
 * @param playerId Player identifier (username)
 * @returns New RankedSession
 */
export function createRankedSession(playerId: string): RankedSession {
  const player = createRankedPlayer(playerId, 0, "Bronze");

  return {
    player,
    createdAt: Date.now(),
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };
}

/**
 * Create a ranked session with custom starting points.
 * Useful for testing or returning players.
 *
 * @param playerId Player identifier
 * @param startingPoints Starting rank points
 * @returns New RankedSession
 */
export function createRankedSessionWithPoints(
  playerId: string,
  startingPoints: number
): RankedSession {
  const tier = getRankTier(startingPoints);
  const player = createRankedPlayer(playerId, startingPoints, tier);

  return {
    player,
    createdAt: Date.now(),
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };
}

/**
 * Update session after a ranked match.
 *
 * @param session Current session
 * @param newPoints New rank points after match
 * @param outcome Match outcome
 * @returns Updated session
 */
export function updateRankedSession(
  session: RankedSession,
  newPoints: number,
  outcome: "win" | "loss" | "draw"
): RankedSession {
  const newTier = getRankTier(newPoints);

  return {
    ...session,
    player: {
      ...session.player,
      points: newPoints,
      tier: newTier,
    },
    matchesPlayed: session.matchesPlayed + 1,
    wins: session.wins + (outcome === "win" ? 1 : 0),
    losses: session.losses + (outcome === "loss" ? 1 : 0),
    draws: session.draws + (outcome === "draw" ? 1 : 0),
  };
}

/**
 * Get session statistics summary.
 *
 * @param session RankedSession
 * @returns Statistics summary
 */
export function getSessionStats(session: RankedSession) {
  const { matchesPlayed, wins, losses, draws } = session;

  const winRate =
    matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) : "0.0";

  return {
    matchesPlayed,
    wins,
    losses,
    draws,
    winRate: `${winRate}%`,
  };
}
