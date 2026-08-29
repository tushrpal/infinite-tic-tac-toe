import { describe, it, expect } from 'vitest';
import type {
  ServerEvent,
  RoomMemberJoinedEvent,
  RoomInviteReceivedEvent
} from '../types';

describe('Room Event Types', () => {
  it('should define ROOM_MEMBER_JOINED event correctly', () => {
    const event: RoomMemberJoinedEvent = {
      type: 'ROOM_MEMBER_JOINED',
      payload: {
        roomId: 'room-1',
        member: {
          id: 'member-1',
          username: 'bob',
          displayName: 'Bob',
          ratingMode1: 1000,
          ratingMode2: 950,
        },
        memberCount: 3,
      },
    };
    expect(event.type).toBe('ROOM_MEMBER_JOINED');
  });

  it('should define ROOM_INVITE_RECEIVED event correctly', () => {
    const event: RoomInviteReceivedEvent = {
      type: 'ROOM_INVITE_RECEIVED',
      payload: {
        inviteId: 'invite-1',
        roomId: 'room-1',
        roomName: 'Epic Battles',
        inviter: {
          id: 'player-1',
          username: 'alice',
          displayName: 'Alice',
        },
        expiresAt: new Date().toISOString(),
      },
    };
    expect(event.payload.roomName).toBe('Epic Battles');
  });
});
