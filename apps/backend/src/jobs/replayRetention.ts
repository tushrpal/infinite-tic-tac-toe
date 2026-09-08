import type { Prisma } from '@prisma/client';
import { REPLAYS_PER_PLAYER, STRIPPED_REPLAY_MARKER } from '../config/replayRetention';
import { getPrismaClient } from '../storage/prismaClient';

export function isReplayStrippedPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  return (payload as Record<string, unknown>)[STRIPPED_REPLAY_MARKER] === true;
}

export function isReplayAvailable(
  payload: unknown,
  moveCount: number,
  replayStripped = false,
): boolean {
  if (replayStripped || isReplayStrippedPayload(payload)) {
    return false;
  }

  return moveCount > 0 || hasReplayPayload(payload);
}

function hasReplayPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return Array.isArray(candidate.games) && candidate.games.length > 0;
}

/**
 * Returns true when every human participant has at least `keep` matches
 * newer than the given match — safe to strip replay data without breaking
 * anyone's last N replays.
 */
export function canStripReplayForParticipants(
  newerMatchCountByPlayer: Record<string, number>,
  keep: number = REPLAYS_PER_PLAYER,
): boolean {
  const counts = Object.values(newerMatchCountByPlayer);
  if (counts.length === 0) {
    return false;
  }

  return counts.every((count) => count >= keep);
}

/**
 * Strip heavy replay data (moves + full payload) for a match.
 * Keeps Match + MatchPlayer rows for stats/history.
 */
export async function stripMatchReplay(matchId: string): Promise<void> {
  const prisma = getPrismaClient();

  await prisma.$transaction([
    prisma.move.deleteMany({ where: { matchId } }),
    prisma.match.update({
      where: { id: matchId },
      data: {
        replayStripped: true,
        payload: {
          [STRIPPED_REPLAY_MARKER]: true,
          matchId,
        } as Prisma.InputJsonValue,
      },
    }),
  ]);
}

async function countNewerMatchesByPlayer(
  participantIds: string[],
  createdAtMs: bigint,
): Promise<Record<string, number>> {
  const prisma = getPrismaClient();
  const counts = await prisma.matchPlayer.groupBy({
    by: ['playerId'],
    where: {
      playerId: { in: participantIds },
      playerType: 'human',
      match: {
        createdAtMs: { gt: createdAtMs },
      },
    },
    _count: { _all: true },
  });

  const newerCountByPlayer = Object.fromEntries(
    participantIds.map((playerId) => [playerId, 0]),
  ) as Record<string, number>;

  for (const row of counts) {
    newerCountByPlayer[row.playerId] = row._count._all;
  }

  return newerCountByPlayer;
}

async function pruneMatchReplayIfEligible(
  matchId: string,
  keep: number = REPLAYS_PER_PLAYER,
): Promise<boolean> {
  const prisma = getPrismaClient();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      createdAtMs: true,
      payload: true,
      replayStripped: true,
      _count: { select: { moves: true } },
      players: {
        where: { playerType: 'human' },
        select: { playerId: true },
      },
    },
  });

  if (!match) {
    return false;
  }

  if (!isReplayAvailable(match.payload, match._count.moves, match.replayStripped)) {
    return false;
  }

  const participantIds = match.players.map((participant) => participant.playerId);
  const newerCountByPlayer = await countNewerMatchesByPlayer(
    participantIds,
    match.createdAtMs,
  );

  if (!canStripReplayForParticipants(newerCountByPlayer, keep)) {
    return false;
  }

  await stripMatchReplay(matchId);
  return true;
}

/**
 * After a new match is saved, prune replay data for this player's older matches.
 */
export async function pruneReplaysForPlayer(
  playerId: string,
  keep: number = REPLAYS_PER_PLAYER,
): Promise<void> {
  const prisma = getPrismaClient();

  const rows = await prisma.matchPlayer.findMany({
    where: { playerId, playerType: 'human' },
    orderBy: { match: { createdAtMs: 'desc' } },
    select: { matchId: true },
  });

  const candidates = rows.slice(keep);
  for (const { matchId } of candidates) {
    await pruneMatchReplayIfEligible(matchId, keep);
  }
}

const pendingPruneByPlayer = new Set<string>();
const scheduledPruneByPlayer = new Set<string>();

/**
 * Schedule replay pruning in the background without blocking match save.
 */
export function scheduleReplayPruning(
  playerId: string,
  keep: number = REPLAYS_PER_PLAYER,
): void {
  if (pendingPruneByPlayer.has(playerId) || scheduledPruneByPlayer.has(playerId)) {
    return;
  }

  scheduledPruneByPlayer.add(playerId);
  queueMicrotask(() => {
    scheduledPruneByPlayer.delete(playerId);
    pendingPruneByPlayer.add(playerId);

    void pruneReplaysForPlayer(playerId, keep)
      .catch((error) => {
        console.error(`Replay pruning failed for player ${playerId}:`, error);
      })
      .finally(() => {
        pendingPruneByPlayer.delete(playerId);
      });
  });
}

/**
 * One-time / startup backfill: prune replays for every human player.
 */
export async function pruneReplaysForAllPlayers(
  keep: number = REPLAYS_PER_PLAYER,
): Promise<void> {
  const prisma = getPrismaClient();

  const humanPlayers = await prisma.matchPlayer.findMany({
    where: { playerType: 'human' },
    select: { playerId: true },
    distinct: ['playerId'],
  });

  for (const { playerId } of humanPlayers) {
    await pruneReplaysForPlayer(playerId, keep);
  }
}
