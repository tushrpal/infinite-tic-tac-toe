import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../storage/prismaClient';
import { type LeagueTier } from './leagueTiers';

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
const BOT_USERNAME_FILTER = 'bot-%';

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

type CombinedRatingRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  rating: number;
};

async function fetchCombinedRatingPage(
  offset: number,
  take: number,
  minRating?: number,
  maxRating?: number,
): Promise<{ rows: CombinedRatingRow[]; hasMore: boolean }> {
  const prisma = getPrismaClient();
  const ratingFilter =
    minRating != null && maxRating != null
      ? Prisma.sql`AND (p."ratingMode1" + p."ratingMode2") >= ${minRating} AND (p."ratingMode1" + p."ratingMode2") <= ${maxRating}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<CombinedRatingRow[]>`
    SELECT
      p."id",
      p."username",
      p."displayName",
      (p."ratingMode1" + p."ratingMode2")::int AS rating
    FROM "Player" p
    WHERE EXISTS (SELECT 1 FROM "MatchPlayer" mp WHERE mp."playerId" = p."id")
      AND p."username" NOT LIKE ${BOT_USERNAME_FILTER}
      ${ratingFilter}
    ORDER BY (p."ratingMode1" + p."ratingMode2") DESC, p."id" ASC
    OFFSET ${offset}
    LIMIT ${take + 1}
  `;

  const hasMore = rows.length > take;
  return {
    rows: rows.slice(0, take),
    hasMore,
  };
}

export async function getGlobalLeaderboard(
  limit: number = DEFAULT_LIMIT,
  offset: number = 0,
): Promise<{ entries: LeaderboardEntry[]; hasMore: boolean }> {
  const take = normalizeLimit(limit);
  const { rows, hasMore } = await fetchCombinedRatingPage(offset, take);

  return {
    entries: rows.map((player, index) => ({
      rank: offset + index + 1,
      playerId: player.id,
      username: player.username ?? player.id,
      displayName: player.displayName ?? player.username ?? player.id,
      rating: player.rating,
    })),
    hasMore,
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
      username: {
        not: {
          startsWith: 'bot-',
        },
      },
    },
    orderBy: { [ratingField]: 'desc' },
    skip: offset,
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
 */
export async function getLeagueLeaderboard(
  leagueName: string,
  offset: number = 0,
  limit: number = DEFAULT_LIMIT,
): Promise<{ entries: LeagueLeaderboardEntry[]; total: number; hasMore: boolean }> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);
  const tier = require('./leagueTiers').getLeagueTierByName(leagueName) as LeagueTier | null;

  if (!tier) {
    throw new Error(`Invalid league name: ${leagueName}`);
  }

  const maxRating = Number.isFinite(tier.maxRating) ? tier.maxRating : 999_999;

  const [countRow] = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*)::bigint AS total
    FROM "Player" p
    WHERE EXISTS (SELECT 1 FROM "MatchPlayer" mp WHERE mp."playerId" = p."id")
      AND p."username" NOT LIKE ${BOT_USERNAME_FILTER}
      AND (p."ratingMode1" + p."ratingMode2") >= ${tier.minRating}
      AND (p."ratingMode1" + p."ratingMode2") <= ${maxRating}
  `;

  const total = Number(countRow?.total ?? 0n);
  const { rows, hasMore } = await fetchCombinedRatingPage(offset, take, tier.minRating, maxRating);

  return {
    entries: rows.map((player, index) => ({
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
