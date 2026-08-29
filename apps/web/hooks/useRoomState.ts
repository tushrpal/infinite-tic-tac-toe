'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRoom, joinRoom, leaveRoom, closeRoom, toggleReady } from '@/lib/rooms';
import type { Room, RoomMember } from '@/ws/types';

interface UseRoomStateReturn {
  room: Room | null;
  members: RoomMember[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  actions: {
    join: () => Promise<void>;
    leave: () => Promise<void>;
    toggleReady: () => Promise<void>;
    close: () => Promise<void>;
  };
}

export function useRoomState(roomId: string): UseRoomStateReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getRoom(roomId);
      setRoom(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching room:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleJoin = useCallback(async () => {
    try {
      const updatedRoom = await joinRoom(roomId);
      setRoom(updatedRoom);
    } catch (err) {
      console.error('Error joining room:', err);
      throw err;
    }
  }, [roomId]);

  const handleLeave = useCallback(async () => {
    try {
      await leaveRoom(roomId);
    } catch (err) {
      console.error('Error leaving room:', err);
      throw err;
    }
  }, [roomId]);

  const handleToggleReady = useCallback(async () => {
    try {
      await toggleReady(roomId);
      // Room state will be updated via WebSocket event
    } catch (err) {
      console.error('Error toggling ready state:', err);
      throw err;
    }
  }, [roomId]);

  const handleClose = useCallback(async () => {
    try {
      await closeRoom(roomId);
    } catch (err) {
      console.error('Error closing room:', err);
      throw err;
    }
  }, [roomId]);

  return {
    room,
    members: room?.members || [],
    isLoading,
    error,
    refetch: fetchRoom,
    actions: {
      join: handleJoin,
      leave: handleLeave,
      toggleReady: handleToggleReady,
      close: handleClose,
    },
  };
}
