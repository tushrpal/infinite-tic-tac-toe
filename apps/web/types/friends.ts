/**
 * Friends System Types
 */

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Friend {
  friendshipId: string;
  playerId: string;
  username: string;
  displayName?: string;
  rating: number;
  isOnline: boolean;
  createdAt: string;
}

export interface FriendRequest {
  friendshipId: string;
  requesterId: string;
  requesterUsername: string;
  requesterDisplayName?: string;
  requesterRating: number;
  addresseeId: string;
  addresseeUsername: string;
  addresseeDisplayName?: string;
  addresseeRating: number;
  status: FriendshipStatus;
  createdAt: string;
}

export interface PlayerSearchResult {
  playerId: string;
  username: string;
  displayName?: string;
  rating: number;
  winRate?: number;
  mutualFriendsCount?: number;
  relationshipStatus?: 'none' | 'friend' | 'pending_sent' | 'pending_received';
}

export interface SendFriendRequestPayload {
  addresseeId: string;
}

export interface RespondToRequestPayload {
  friendshipId: string;
  accept: boolean;
}
