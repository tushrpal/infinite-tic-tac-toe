import type { RoomStatus, Room, RoomMember, RoomInvite } from '../types';

// Type validation tests - these compile if the types work correctly

// Validate RoomStatus type
const statuses: RoomStatus[] = ['WAITING', 'ACTIVE', 'BETWEEN_GAMES', 'CLOSED'];
console.log('RoomStatus types valid:', statuses.length === 4);

// Validate Room interface
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
console.log('Room type valid:', room.id === 'room-1');

// Validate RoomMember interface
const member: RoomMember = {
  id: 'member-1',
  roomId: 'room-1',
  playerId: 'player-1',
  isReady: false,
  joinedAt: new Date().toISOString(),
  player: {
    id: 'player-1',
    username: 'alice',
    isConnected: true,
  },
};
console.log('RoomMember type valid:', member.id === 'member-1');

// Validate RoomInvite interface
const invite: RoomInvite = {
  id: 'invite-1',
  roomId: 'room-1',
  inviterId: 'player-1',
  inviteeId: 'player-2',
  status: 'PENDING',
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};
console.log('RoomInvite type valid:', invite.id === 'invite-1');

