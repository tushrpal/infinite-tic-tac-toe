import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRoomState } from '../useRoomState';
import * as roomsApi from '@/lib/rooms';

vi.mock('@/lib/rooms');

describe('useRoomState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch room data on mount', async () => {
    const mockRoom = {
      id: 'room-1',
      hostId: 'player-1',
      name: 'Test Room',
      mode: 1,
      status: 'WAITING' as const,
      members: [],
      host: {
        id: 'player-1',
        username: 'alice',
        displayName: 'Alice',
      },
    };

    vi.mocked(roomsApi.getRoom).mockResolvedValue(mockRoom as any);

    const { result } = renderHook(() => useRoomState('room-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.room).toEqual(mockRoom);
    expect(roomsApi.getRoom).toHaveBeenCalledWith('room-1');
  });

  it('should handle errors when fetching room', async () => {
    const error = new Error('Room not found');
    vi.mocked(roomsApi.getRoom).mockRejectedValue(error);

    const { result } = renderHook(() => useRoomState('room-1'));

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    expect(result.current.room).toBeNull();
  });

  it('should provide refetch function', async () => {
    const mockRoom = {
      id: 'room-1',
      members: [],
    };

    vi.mocked(roomsApi.getRoom).mockResolvedValue(mockRoom as any);

    const { result } = renderHook(() => useRoomState('room-1'));

    await waitFor(() => {
      expect(result.current.room).toBeTruthy();
    });

    vi.clearAllMocks();

    result.current.refetch();

    await waitFor(() => {
      expect(roomsApi.getRoom).toHaveBeenCalledWith('room-1');
    });
  });
});
