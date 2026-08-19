import { STORAGE_KEYS } from './constants';
import { apiRequest } from './api';

export interface PlayerProfile {
  playerId: string;
  username?: string | null;
  displayName?: string | null;
  rating: number; // Combined rating (sum of both modes)
  ratingMode1?: number;
  ratingMode2?: number;
  createdAt?: string;
}

export type PlayerStatsProfile = {
  playerId: string;
  username: string | null;
  displayName: string | null;
  rating: number; // Combined rating
  ratingMode1: number;
  ratingMode2: number;
  createdAt: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

export type PlayerMatchSummary = {
  matchId: string;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  createdAt: number;
};

let cachedPlayer: PlayerProfile | null = null;
let pendingPlayer: Promise<PlayerProfile> | null = null;

function getLegacyPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('playerId');
}

export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
  if (stored) return stored;

  const legacy = getLegacyPlayerId();
  if (legacy) {
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, legacy);
    localStorage.removeItem('playerId');
  }

  return legacy;
}

export function setStoredPlayerId(playerId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
  localStorage.removeItem('playerId');
}

function getStoredDisplayName(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const name = localStorage.getItem('username');
  return name || undefined;
}

async function createPlayer(username: string, displayName?: string): Promise<PlayerProfile> {
  const body = { username, displayName: displayName || undefined };
  const player = await apiRequest<PlayerProfile>('/players', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  setStoredPlayerId(player.playerId);
  return player;
}

async function fetchPlayer(playerId: string): Promise<PlayerProfile> {
  return apiRequest<PlayerProfile>(`/players/${playerId}`);
}

export async function ensurePlayer(username?: string, displayName?: string): Promise<PlayerProfile> {
  if (cachedPlayer) return cachedPlayer;
  if (pendingPlayer) return pendingPlayer;

  pendingPlayer = (async () => {
    const storedId = getStoredPlayerId();
    if (storedId) {
      try {
        const player = await fetchPlayer(storedId);
        cachedPlayer = player;
        return player;
      } catch (error) {
        const status = (error as Error & { status?: number }).status;
        if (status !== 404) {
          throw error;
        }
      }
    }

    // For new players, username is required
    if (!username) {
      throw new Error('Username required for new player registration');
    }

    const created = await createPlayer(username, displayName);
    cachedPlayer = created;
    return created;
  })();

  pendingPlayer.finally(() => {
    pendingPlayer = null;
  }).catch(() => {
    // Swallow rejection from the cleanup chain to avoid unhandled runtime errors.
  });

  return pendingPlayer;
}

export async function updateDisplayName(playerId: string, displayName: string): Promise<PlayerProfile> {
  const player = await apiRequest<PlayerProfile>(`/players/${playerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });

  // Update cache
  if (cachedPlayer && cachedPlayer.playerId === playerId) {
    cachedPlayer = player;
  }

  return player;
}

export async function fetchPlayerProfile(playerId: string): Promise<PlayerStatsProfile> {
  return apiRequest<PlayerStatsProfile>(`/players/${playerId}/profile`);
}

export async function fetchPlayerMatches(playerId: string, limit: number = 20): Promise<PlayerMatchSummary[]> {
  const response = await apiRequest<{ matches: PlayerMatchSummary[] }>(
    `/players/${playerId}/matches?limit=${limit}`,
  );
  return response.matches;
}

export function clearCachedPlayer(): void {
  cachedPlayer = null;
  pendingPlayer = null;
}

export async function refreshPlayer(): Promise<PlayerProfile> {
  clearCachedPlayer();
  return ensurePlayer();
}
