import { getPrismaClient } from '../storage/prismaClient';

type MatchResultSummary = 'win' | 'loss' | 'draw';

type PlayerMatchSummary = {
  matchId: string;
  result: MatchResultSummary;
  ratingChange: number;
  createdAt: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

export async function getPlayerMatches(playerId: string, limit?: number): Promise<PlayerMatchSummary[]> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  const matchPlayers = await prisma.matchPlayer.findMany({
    where: { playerId },
    select: {
      matchId: true,
      ratingChange: true,
      match: {
        select: {
          winner: true,
          createdAtMs: true,
        },
      },
    },
    orderBy: {
      match: {
        createdAtMs: 'desc',
      },
    },
    take,
  });

  return matchPlayers.map((matchPlayer) => {
    const winnerId = matchPlayer.match?.winner ?? null;
    let result: MatchResultSummary = 'draw';

    if (winnerId) {
      result = winnerId === playerId ? 'win' : 'loss';
    }

    return {
      matchId: matchPlayer.matchId,
      result,
      ratingChange: matchPlayer.ratingChange ?? 0,
      createdAt: Number(matchPlayer.match?.createdAtMs ?? 0n),
    };
  });
}
