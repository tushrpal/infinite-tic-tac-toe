/**
 * Friends API Client
 */

import { apiRequest } from './api';
import type {
  Friend,
  FriendRequest,
  PlayerSearchResult,
  SendFriendRequestPayload,
  RespondToRequestPayload,
} from '@/types/friends';

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
 * Get list of accepted friends
 */
export async function getFriends(): Promise<Friend[]> {
  return apiRequest<Friend[]>('/friends', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

/**
 * Get pending friend requests (both sent and received)
 */
export async function getFriendRequests(): Promise<{
  sent: FriendRequest[];
  received: FriendRequest[];
}> {
  return apiRequest<{ sent: FriendRequest[]; received: FriendRequest[] }>(
    '/friends/requests',
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );
}

/**
 * Search for players by username
 */
export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  return apiRequest<PlayerSearchResult[]>(`/friends/search?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

/**
 * Send a friend request to a player
 */
export async function sendFriendRequest(
  payload: SendFriendRequestPayload
): Promise<FriendRequest> {
  return apiRequest<FriendRequest>('/friends/request', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * Respond to a friend request (accept or decline)
 */
export async function respondToFriendRequest(
  payload: RespondToRequestPayload
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/friends/respond', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * Remove a friend
 */
export async function removeFriend(friendshipId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/friends/${friendshipId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

/**
 * Cancel a pending friend request (for requester only)
 */
export async function cancelFriendRequest(friendshipId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/friends/request/${friendshipId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}
