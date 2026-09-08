import { serverFetch } from '@/lib/server-api';

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  displayName: string;
  rating: number;
  league?: string;
  leagueColor?: string;
};

export type LeaderboardPlayer = {
  username: string;
  name: string;
  rating: number;
  playerId: string;
  league?: string;
  leagueColor?: string;
};

export type ModeFilter = 'all' | 'mode1' | 'mode2';

const ITEMS_PER_PAGE = 50;

function normalizeEntry(entry: LeaderboardEntry): LeaderboardPlayer {
  return {
    username: entry.username,
    name: entry.displayName,
    rating: entry.rating,
    playerId: entry.playerId,
    league: entry.league,
    leagueColor: entry.leagueColor,
  };
}

export function parseLeaderboardMode(value?: string): ModeFilter {
  if (value === 'mode1' || value === 'mode2') {
    return value;
  }
  return 'all';
}

export async function fetchLeaderboardPage(
  mode: ModeFilter,
  offset = 0,
  limit = ITEMS_PER_PAGE,
): Promise<{ players: LeaderboardPlayer[]; hasMore: boolean }> {
  const endpoint = mode === 'all'
    ? `/leaderboard?offset=${offset}&limit=${limit}`
    : `/leaderboard?mode=${mode}&offset=${offset}&limit=${limit}`;

  const data = await serverFetch<{
    leaderboard: LeaderboardEntry[];
    hasMore?: boolean;
  }>(endpoint, { revalidate: 30 });

  return {
    players: data.leaderboard.map(normalizeEntry),
    hasMore: data.hasMore ?? false,
  };
}
