/**
 * Challenges & Private Matches API Client
 */

import { apiRequest } from './api';
import type {
  Challenge,
  SendChallengePayload,
  RespondToChallengePayload,
  PrivateMatch,
  CreatePrivateMatchPayload,
  JoinPrivateMatchPayload,
} from '@/types/challenges';

/**
 * Get authentication headers with session token
 */
function getAuthHeaders(): HeadersInit {
  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem('infinite-ttt-session-token')
    : null;

  return sessionToken
    ? { 'Authorization': `Bearer ${sessionToken}` }
    : {};
}

/**
 * CHALLENGES
 */

/**
 * Get active challenges (both sent and received)
 */
export async function getChallenges(): Promise<{
  sent: Challenge[];
  received: Challenge[];
}> {
  return apiRequest<{ sent: Challenge[]; received: Challenge[] }>(
    '/challenges',
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );
}

/**
 * Send a challenge to a friend
 */
export async function sendChallenge(
  payload: SendChallengePayload
): Promise<Challenge> {
  return apiRequest<Challenge>('/challenges', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * Respond to a challenge (accept or decline)
 */
export async function respondToChallenge(
  payload: RespondToChallengePayload
): Promise<{ success: boolean; matchId?: string }> {
  return apiRequest<{ success: boolean; matchId?: string }>(
    '/challenges/respond',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Cancel a sent challenge (challenger only)
 */
export async function cancelChallenge(
  challengeId: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/challenges/${challengeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

/**
 * PRIVATE MATCHES
 */

/**
 * Create a private match and get the shareable code
 */
export async function createPrivateMatch(
  payload: CreatePrivateMatchPayload
): Promise<PrivateMatch> {
  return apiRequest<PrivateMatch>('/private-matches', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * Join a private match using a code
 */
export async function joinPrivateMatch(
  payload: JoinPrivateMatchPayload
): Promise<{ success: boolean; matchId: string }> {
  return apiRequest<{ success: boolean; matchId: string }>(
    '/private-matches/join',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Get private match details by code
 */
export async function getPrivateMatchByCode(
  code: string
): Promise<PrivateMatch> {
  return apiRequest<PrivateMatch>(`/private-matches/${code}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

/**
 * Cancel a private match (creator only)
 */
export async function cancelPrivateMatch(
  matchId: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/private-matches/${matchId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}
