import { serverFetch } from '@/lib/server-api';
import type { PlayerMatchSummary, PlayerStatsProfile } from '@/lib/player';

export async function fetchPlayerProfileServer(
  playerId: string,
): Promise<PlayerStatsProfile> {
  return serverFetch<PlayerStatsProfile>(`/players/${playerId}/profile`, {
    revalidate: 30,
  });
}

export async function fetchPlayerMatchesServer(
  playerId: string,
  limit = 20,
): Promise<PlayerMatchSummary[]> {
  const response = await serverFetch<{ matches: PlayerMatchSummary[] }>(
    `/players/${playerId}/matches?limit=${limit}`,
    { revalidate: 30 },
  );
  return response.matches;
}
