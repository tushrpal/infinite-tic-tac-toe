import { getPrismaClient } from '../storage/prismaClient';

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
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

function toBackendMode(mode: string): 'mode1' | 'mode2' {
  if (mode === 'mode1') {
    return 'mode1';
  }

  if (mode === 'mode2') {
    return 'mode2';
  }

  throw new Error('Invalid mode');
}

function toLeaderboardEntries(players: Array<{ id: string; username: string | null; displayName: string | null; rating: number }>): LeaderboardEntry[] {
  return players.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    username: player.username ?? player.id,
    displayName: player.displayName ?? player.username ?? player.id,
    rating: player.rating,
  }));
}

export async function getGlobalLeaderboard(limit: number = DEFAULT_LIMIT): Promise<LeaderboardEntry[]> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  // Global leaderboard uses combined rating (sum of mode1 + mode2)
  // Fetch all players, compute combined rating, and sort in memory
  const players = await prisma.player.findMany({
    where: {
      matches: {
        some: {},
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      ratingMode1: true,
      ratingMode2: true,
    },
  });

  // Compute combined rating and sort
  const playersWithCombinedRating = players
    .map((player) => ({
      id: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, take);

  return playersWithCombinedRating.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    username: player.username ?? player.id,
    displayName: player.displayName ?? player.username ?? player.id,
    rating: player.rating,
  }));
}

export async function getLeaderboardByMode(mode: string, limit: number = DEFAULT_LIMIT): Promise<LeaderboardEntry[]> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);
  const backendMode = toBackendMode(mode);

  // Use mode-specific rating field
  const ratingField = backendMode === 'mode1' ? 'ratingMode1' : 'ratingMode2';

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
    orderBy: { [ratingField]: 'desc' },
    take,
    select: {
      id: true,
      username: true,
      displayName: true,
      ratingMode1: true,
      ratingMode2: true,
    },
  });

  // Map to use the correct rating based on mode
  return players.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    username: player.username ?? player.id,
    displayName: player.displayName ?? player.username ?? player.id,
    rating: backendMode === 'mode1' ? player.ratingMode1 : player.ratingMode2,
  }));
}
