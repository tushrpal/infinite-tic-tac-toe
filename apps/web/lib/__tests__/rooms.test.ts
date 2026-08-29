import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoom, getRooms, joinRoom } from '../rooms';
import * as api from '../api';

vi.mock('../api', () => ({
  apiRequest: vi.fn(),
}));

describe('Room API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a room with valid parameters', async () => {
    const mockRoom = {
      id: 'room-1',
      hostId: 'player-1',
      name: 'Test Room',
      mode: 1,
      status: 'WAITING',
      members: [],
    };

    vi.mocked(api.apiRequest).mockResolvedValueOnce(mockRoom);

    const result = await createRoom({
      name: 'Test Room',
      mode: 1,
      maxPlayers: 4,
    });

    expect(api.apiRequest).toHaveBeenCalledWith('/rooms/create', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Room',
        mode: 1,
        maxPlayers: 4,
      }),
    });
    expect(result.id).toBe('room-1');
  });

  it('should get list of rooms', async () => {
    const mockRooms = [
      { id: 'room-1', name: 'Room 1', memberCount: 2 },
      { id: 'room-2', name: 'Room 2', memberCount: 3 },
    ];

    vi.mocked(api.apiRequest).mockResolvedValueOnce(mockRooms);

    const result = await getRooms();

    expect(api.apiRequest).toHaveBeenCalledWith('/rooms');
    expect(result).toHaveLength(2);
  });

  it('should join a room by ID', async () => {
    const mockRoom = {
      id: 'room-1',
      status: 'WAITING',
      members: [],
    };

    vi.mocked(api.apiRequest).mockResolvedValueOnce(mockRoom);

    const result = await joinRoom('room-1');

    expect(api.apiRequest).toHaveBeenCalledWith('/rooms/room-1/join', {
      method: 'POST',
    });
    expect(result.id).toBe('room-1');
  });
});
