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
  try {
    const response = await apiRequest<any[]>('/friends', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    // Transform backend response to frontend format
    return response.map((item: any) => ({
      friendshipId: item.friendshipId,
      playerId: item.friend?.id || '',
      username: item.friend?.username || '',
      displayName: item.friend?.displayName,
      rating: item.friend?.ratingMode1 || 0,
      isOnline: false, // Will be updated by WebSocket
      createdAt: item.since || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch friends:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get pending friend requests (both sent and received)
 */
export async function getFriendRequests(): Promise<{
  sent: FriendRequest[];
  received: FriendRequest[];
}> {
  try {
    const response = await apiRequest<{ incoming: any[]; outgoing: any[] }>(
      '/friends/requests',
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    // Transform backend response (incoming/outgoing) to frontend format (received/sent)
    return {
      received: (response.incoming || []).map((item: any) => ({
        friendshipId: item.id,
        requesterId: item.requester?.id || '',
        requesterUsername: item.requester?.username || '',
        requesterDisplayName: item.requester?.displayName,
        requesterRating: item.requester?.ratingMode1 || 0,
        addresseeId: item.addresseeId,
        addresseeUsername: item.addressee?.username || '',
        addresseeDisplayName: item.addressee?.displayName,
        addresseeRating: item.addressee?.ratingMode1 || 0,
        status: 'PENDING' as const,
        createdAt: item.createdAt,
      })),
      sent: (response.outgoing || []).map((item: any) => ({
        friendshipId: item.id,
        requesterId: item.requesterId,
        requesterUsername: item.requester?.username || '',
        requesterDisplayName: item.requester?.displayName,
        requesterRating: item.requester?.ratingMode1 || 0,
        addresseeId: item.addressee?.id || '',
        addresseeUsername: item.addressee?.username || '',
        addresseeDisplayName: item.addressee?.displayName,
        addresseeRating: item.addressee?.ratingMode1 || 0,
        status: 'PENDING' as const,
        createdAt: item.createdAt,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch friend requests:', error);
    return { sent: [], received: [] }; // Return empty arrays instead of throwing
  }
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
