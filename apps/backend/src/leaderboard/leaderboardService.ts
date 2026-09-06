import { getPrismaClient } from '../storage/prismaClient';
import { getLeagueTier, type LeagueTier } from './leagueTiers';

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  displayName: string;
  rating: number;
};

type LeagueLeaderboardEntry = LeaderboardEntry & {
  league: string;
  leagueColor: string;
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

export async function getGlobalLeaderboard(
  limit: number = DEFAULT_LIMIT,
  offset: number = 0,
): Promise<{ entries: LeaderboardEntry[]; hasMore: boolean }> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  // Global leaderboard uses combined rating (sum of mode1 + mode2)
  // Fetch all players, compute combined rating, and sort in memory
  const players = await prisma.player.findMany({
    where: {
      matches: {
        some: {},
      },
      // Exclude bot players
      username: {
        not: {
          startsWith: 'bot-',
        },
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
  const sorted = players
    .map((player) => ({
      id: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
    }))
    .sort((a, b) => b.rating - a.rating);

  const page = sorted.slice(offset, offset + take);

  return {
    entries: page.map((player, index) => ({
      rank: offset + index + 1,
      playerId: player.id,
      username: player.username ?? player.id,
      displayName: player.displayName ?? player.username ?? player.id,
      rating: player.rating,
    })),
    hasMore: offset + take < sorted.length,
  };
}

export async function getLeaderboardByMode(
  mode: string,
  limit: number = DEFAULT_LIMIT,
  offset: number = 0,
): Promise<{ entries: LeaderboardEntry[]; hasMore: boolean }> {
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
      // Exclude bot players
      username: {
        not: {
          startsWith: 'bot-',
        },
      },
    },
    orderBy: { [ratingField]: 'desc' },
    skip: offset,
    // Fetch one extra row to cheaply detect if there's a next page,
    // without a separate COUNT(*) query.
    take: take + 1,
    select: {
      id: true,
      username: true,
      displayName: true,
      ratingMode1: true,
      ratingMode2: true,
    },
  });

  const hasMore = players.length > take;
  const page = players.slice(0, take);

  // Map to use the correct rating based on mode
  return {
    entries: page.map((player, index) => ({
      rank: offset + index + 1,
      playerId: player.id,
      username: player.username ?? player.id,
      displayName: player.displayName ?? player.username ?? player.id,
      rating: backendMode === 'mode1' ? player.ratingMode1 : player.ratingMode2,
    })),
    hasMore,
  };
}

/**
 * Get leaderboard for a specific league tier with pagination
 * @param leagueName - Name of the league tier (e.g., 'Gold', 'Diamond')
 * @param offset - Number of entries to skip
 * @param limit - Maximum number of entries to return
 */
export async function getLeagueLeaderboard(
  leagueName: string,
  offset: number = 0,
  limit: number = DEFAULT_LIMIT
): Promise<{ entries: LeagueLeaderboardEntry[]; total: number; hasMore: boolean }> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  // Get the league tier info
  const leagueTier = getLeagueTier(0); // Dummy call to get access to tiers
  const tier = require('./leagueTiers').getLeagueTierByName(leagueName);

  if (!tier) {
    throw new Error(`Invalid league name: ${leagueName}`);
  }

  // Fetch all players with matches (excluding bots)
  const players = await prisma.player.findMany({
    where: {
      matches: {
        some: {},
      },
      username: {
        not: {
          startsWith: 'bot-',
        },
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

  // Calculate combined rating and filter by league tier
  const playersInLeague = players
    .map((player) => ({
      id: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
    }))
    .filter((player) => {
      return player.rating >= tier.minRating && player.rating <= tier.maxRating;
    })
    .sort((a, b) => b.rating - a.rating);

  const total = playersInLeague.length;
  const paginatedPlayers = playersInLeague.slice(offset, offset + take);
  const hasMore = offset + take < total;

  return {
    entries: paginatedPlayers.map((player, index) => ({
      rank: offset + index + 1,
      playerId: player.id,
      username: player.username ?? player.id,
      displayName: player.displayName ?? player.username ?? player.id,
      rating: player.rating,
      league: tier.name,
      leagueColor: tier.color,
    })),
    total,
    hasMore,
  };
}
