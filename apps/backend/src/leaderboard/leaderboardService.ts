import { getPrismaClient } from '../storage/prismaClient';

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  displayName: string;
  rating: number;
};

const DEFAULT_LIMIT = 100;

function normalizeLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.floor(limit));
}

function toBackendMode(mode: string): 'MODE_1' | 'MODE_2' {
  if (mode === 'mode1') {
    return 'MODE_1';
  }

  if (mode === 'mode2') {
    return 'MODE_2';
  }

  throw new Error('Invalid mode');
}

function toLeaderboardEntries(players: Array<{ id: string; displayName: string | null; rating: number }>): LeaderboardEntry[] {
  return players.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    displayName: player.displayName ?? player.id,
    rating: player.rating,
  }));
}

export async function getGlobalLeaderboard(limit: number = DEFAULT_LIMIT): Promise<LeaderboardEntry[]> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  const players = await prisma.player.findMany({
    orderBy: { rating: 'desc' },
    take,
    select: {
      id: true,
      displayName: true,
      rating: true,
    },
  });

  return toLeaderboardEntries(players);
}

export async function getLeaderboardByMode(mode: string, limit: number = DEFAULT_LIMIT): Promise<LeaderboardEntry[]> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);
  const backendMode = toBackendMode(mode);

  const players = await prisma.player.findMany({
    where: {
      matches: {
        some: {
          match: {
            mode: backendMode,
          },
        },
      },
    },
    orderBy: { rating: 'desc' },
    take,
    select: {
      id: true,
      displayName: true,
      rating: true,
    },
  });

  return toLeaderboardEntries(players);
}
