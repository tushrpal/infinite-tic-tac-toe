import { STORAGE_KEYS } from './constants';
import { apiRequest } from './api';

export interface PlayerProfile {
  playerId: string;
  username?: string | null;
  displayName?: string | null;
  rating: number; // Combined rating (sum of both modes)
  ratingMode1?: number;
  ratingMode2?: number;
  isAnonymous?: boolean;
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
  isAnonymous?: boolean;
  oauthProvider?: string | null;
};

export type PlayerMatchSummary = {
  matchId: string;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  createdAt: number;
  mode: string;
  isRanked: boolean;
  isBotMatch: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  hasReplay?: boolean;
  opponentUsername?: string;
  opponentDisplayName?: string;
};

export type OAuthProvider = 'google' | 'discord';

export interface OAuthCallbackResponse {
  isNewUser: boolean;
  playerId?: string;
  username?: string;
  displayName?: string;
  rating?: number;
  sessionToken?: string;
  suggestedUsername?: string;
  oauthData?: {
    provider: string;
    oauthId: string;
    email: string;
    name?: string;
  };
}

let cachedPlayer: PlayerProfile | null = null;
let pendingPlayer: Promise<PlayerProfile> | null = null;

// Session token storage
const SESSION_TOKEN_KEY = 'infinite-ttt-session-token';

function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredSessionToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearStoredSessionToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

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

export function clearStoredPlayerId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
  localStorage.removeItem('playerId'); // Clear legacy key too
}

/**
 * Try to login with session token (for authenticated users)
 */
async function loginWithSession(): Promise<PlayerProfile | null> {
  const sessionToken = getStoredSessionToken();
  if (!sessionToken) return null;

  try {
    const player = await apiRequest<PlayerProfile>('/auth/session', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    setStoredPlayerId(player.playerId);
    cachedPlayer = player;
    return player;
  } catch (error) {
    // Session expired or invalid - clean up
    clearStoredSessionToken();
    return null;
  }
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
    // Priority 1: Try session token (authenticated users)
    const sessionPlayer = await loginWithSession();
    if (sessionPlayer) return sessionPlayer;

    // Priority 2: Try localStorage playerId (anonymous users)
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

    // Priority 3: Create new player (requires username)
    if (!username) {
      throw new Error('Username required for new player registration');
    }

    const created = await createPlayer(username, displayName);
    cachedPlayer = created;
    return created;
  })();

  pendingPlayer.finally(() => {
    pendingPlayer = null;
  }).catch(() => {});

  return pendingPlayer;
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  oauthId: string,
  email: string,
  name?: string,
  playerId?: string
): Promise<OAuthCallbackResponse> {
  return apiRequest<OAuthCallbackResponse>('/auth/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ provider, oauthId, email, name, playerId }),
  });
}

/**
 * Complete OAuth registration with display name
 */
export async function registerWithOAuth(
  provider: string,
  oauthId: string,
  email: string,
  displayName: string,
  username: string
): Promise<PlayerProfile> {
  const response = await apiRequest<PlayerProfile & { sessionToken: string }>('/auth/oauth/register', {
    method: 'POST',
    body: JSON.stringify({ provider, oauthId, email, displayName, username }),
  });

  setStoredPlayerId(response.playerId);
  setStoredSessionToken(response.sessionToken);
  cachedPlayer = response;
  return response;
}

/**
 * Link anonymous account to OAuth
 */
export async function linkAccountToOAuth(
  playerId: string,
  provider: string,
  oauthId: string,
  email: string
): Promise<{ success: boolean; sessionToken: string }> {
  const response = await apiRequest<{ success: boolean; playerId: string; sessionToken: string }>(
    '/auth/link-account',
    {
      method: 'POST',
      body: JSON.stringify({ playerId, provider, oauthId, email }),
    }
  );

  setStoredSessionToken(response.sessionToken);
  return response;
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  const sessionToken = getStoredSessionToken();

  try {
    if (sessionToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all stored data
    clearStoredSessionToken();
    clearStoredPlayerId();
    clearCachedPlayer();
  }
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
