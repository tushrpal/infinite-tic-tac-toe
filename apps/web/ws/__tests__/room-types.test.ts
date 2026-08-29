import { describe, it, expect } from 'vitest';
import type { RoomStatus, Room, RoomMember, RoomInvite } from '../types';

describe('Room Types', () => {
  it('should define RoomStatus type correctly', () => {
    const statuses: RoomStatus[] = ['WAITING', 'ACTIVE', 'BETWEEN_GAMES', 'CLOSED'];
    expect(statuses).toHaveLength(4);
  });

  it('should define Room interface with required fields', () => {
    const room: Room = {
      id: 'room-1',
      hostId: 'player-1',
      name: 'Test Room',
      mode: 1,
      status: 'WAITING',
      player1Id: null,
      player2Id: null,
      currentMatchId: null,
      expiresAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      host: {
        id: 'player-1',
        username: 'alice',
        isConnected: true,
      },
      members: [],
    };
    expect(room.id).toBe('room-1');
  });
});
