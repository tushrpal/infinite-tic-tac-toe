"use client";

/**
 * Friends Context Provider
 * Manages friends list, friend requests, and real-time updates via WebSocket
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useSocketEvent } from "@/hooks/useWebSocket";
import { announce } from "@/lib/accessibility";
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  cancelFriendRequest,
} from "@/lib/friends";
import type {
  Friend,
  FriendRequest,
  SendFriendRequestPayload,
  RespondToRequestPayload,
} from "@/types/friends";

interface FriendsContextType {
  friends: Friend[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  refreshFriends: () => Promise<void>;
  sendRequest: (payload: SendFriendRequestPayload) => Promise<void>;
  respondToRequest: (payload: RespondToRequestPayload) => Promise<void>;
  removeFriendById: (friendshipId: string) => Promise<void>;
  cancelRequest: (friendshipId: string) => Promise<void>;
  updateFriendOnlineStatus: (playerId: string, isOnline: boolean) => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriends must be used within FriendsProvider");
  }
  return context;
}

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { player } = usePlayer();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Friends/requests are only available to accounts linked via OAuth - anonymous
  // players have no session token, so these endpoints would just 401.
  const isAuthenticated = !!player && player.isAnonymous === false;

  /**
   * Load friends and friend requests from API
   */
  const loadFriendsData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [friendsList, requests] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);

      setFriends(friendsList);
      setSentRequests(requests.sent);
      setReceivedRequests(requests.received);
    } catch (err) {
      console.error("Failed to load friends data:", err);
      setError(err instanceof Error ? err.message : "Failed to load friends");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Initial load once the player is authenticated (OAuth-linked)
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadFriendsData();
    } else {
      setFriends([]);
      setSentRequests([]);
      setReceivedRequests([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadFriendsData]);

  /**
   * Send a friend request
   */
  const sendRequest = useCallback(async (payload: SendFriendRequestPayload) => {
    try {
      const newRequest = await sendFriendRequest(payload);
      setSentRequests(prev => [...prev, newRequest]);
    } catch (err) {
      console.error("Failed to send friend request:", err);
      throw err;
    }
  }, []);

  /**
   * Respond to a friend request
   */
  const respondToRequest = useCallback(async (payload: RespondToRequestPayload) => {
    try {
      await respondToFriendRequest(payload);

      // Remove from received requests
      setReceivedRequests(prev =>
        prev.filter(req => req.friendshipId !== payload.friendshipId)
      );

      // If accepted, refresh friends list to get the new friend
      if (payload.accept) {
        await loadFriendsData();
      }
    } catch (err) {
      console.error("Failed to respond to friend request:", err);
      throw err;
    }
  }, [loadFriendsData]);

  /**
   * Remove a friend
   */
  const removeFriendById = useCallback(async (friendshipId: string) => {
    try {
      await removeFriend(friendshipId);
      setFriends(prev => prev.filter(friend => friend.friendshipId !== friendshipId));
    } catch (err) {
      console.error("Failed to remove friend:", err);
      throw err;
    }
  }, []);

  /**
   * Cancel a sent friend request
   */
  const cancelRequest = useCallback(async (friendshipId: string) => {
    try {
      await cancelFriendRequest(friendshipId);
      setSentRequests(prev => prev.filter(req => req.friendshipId !== friendshipId));
    } catch (err) {
      console.error("Failed to cancel friend request:", err);
      throw err;
    }
  }, []);

  /**
   * Update friend's online status (called by WebSocket listeners)
   */
  const updateFriendOnlineStatus = useCallback((playerId: string, isOnline: boolean) => {
    setFriends(prev =>
      prev.map(friend =>
        friend.playerId === playerId ? { ...friend, isOnline } : friend
      )
    );
  }, []);

  /**
   * WebSocket Event Listeners
   */

  // Friend request received
  useSocketEvent('FRIEND_REQUEST_RECEIVED', (payload: any) => {
    const newRequest: FriendRequest = {
      friendshipId: payload.friendshipId,
      requesterId: payload.requesterId,
      requesterUsername: payload.requesterUsername,
      requesterDisplayName: payload.requesterDisplayName,
      requesterRating: payload.requesterRating,
      addresseeId: payload.addresseeId,
      addresseeUsername: payload.addresseeUsername,
      addresseeDisplayName: payload.addresseeDisplayName,
      addresseeRating: payload.addresseeRating,
      status: 'PENDING',
      createdAt: payload.createdAt,
    };
    setReceivedRequests(prev => [...prev, newRequest]);

    // Announce to screen readers
    announce(`New friend request from ${payload.requesterDisplayName || payload.requesterUsername}`, 'polite');
  }, []);

  // Friend request accepted
  useSocketEvent('FRIEND_REQUEST_ACCEPTED', (payload: any) => {
    // Remove from sent requests if this was our request
    setSentRequests(prev =>
      prev.filter(req => req.friendshipId !== payload.friendshipId)
    );

    // Add to friends list
    const newFriend: Friend = {
      friendshipId: payload.friendshipId,
      playerId: payload.friendId,
      username: payload.friendUsername,
      displayName: payload.friendDisplayName,
      rating: payload.friendRating,
      isOnline: payload.isOnline || false,
      createdAt: new Date().toISOString(),
    };
    setFriends(prev => [...prev, newFriend]);

    // Announce to screen readers
    announce(`${payload.friendDisplayName || payload.friendUsername} accepted your friend request`, 'polite');
  }, []);

  // Friend request declined
  useSocketEvent('FRIEND_REQUEST_DECLINED', (payload: any) => {
    setSentRequests(prev =>
      prev.filter(req => req.friendshipId !== payload.friendshipId)
    );
  }, []);

  // Friend removed
  useSocketEvent('FRIEND_REMOVED', (payload: any) => {
    setFriends(prev =>
      prev.filter(friend => friend.friendshipId !== payload.friendshipId)
    );
  }, []);

  // Friend came online
  useSocketEvent('FRIEND_ONLINE', (payload: any) => {
    updateFriendOnlineStatus(payload.playerId, true);
  }, [updateFriendOnlineStatus]);

  // Friend went offline
  useSocketEvent('FRIEND_OFFLINE', (payload: any) => {
    updateFriendOnlineStatus(payload.playerId, false);
  }, [updateFriendOnlineStatus]);

  return (
    <FriendsContext.Provider
      value={{
        friends,
        sentRequests,
        receivedRequests,
        isLoading,
        error,
        refreshFriends: loadFriendsData,
        sendRequest,
        respondToRequest,
        removeFriendById,
        cancelRequest,
        updateFriendOnlineStatus,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}
