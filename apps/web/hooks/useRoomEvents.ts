'use client';

import { useSocketEvent } from './useWebSocket';
import type {
  RoomMemberJoinedEvent,
  RoomMemberLeftEvent,
  RoomReadyStateChangedEvent,
  RoomPlayersAssignedEvent,
  RoomGameStartingEvent,
  RoomGameEndedEvent,
  RoomClosedEvent,
  RoomInviteReceivedEvent,
  RoomInviteAcceptedEvent,
  RoomInviteDeclinedEvent,
} from '@/ws/types';

export interface RoomEventHandlers {
  onMemberJoined?: (payload: RoomMemberJoinedEvent['payload']) => void;
  onMemberLeft?: (payload: RoomMemberLeftEvent['payload']) => void;
  onReadyStateChanged?: (payload: RoomReadyStateChangedEvent['payload']) => void;
  onPlayersAssigned?: (payload: RoomPlayersAssignedEvent['payload']) => void;
  onGameStarting?: (payload: RoomGameStartingEvent['payload']) => void;
  onGameEnded?: (payload: RoomGameEndedEvent['payload']) => void;
  onRoomClosed?: (payload: RoomClosedEvent['payload']) => void;
  onInviteReceived?: (payload: RoomInviteReceivedEvent['payload']) => void;
  onInviteAccepted?: (payload: RoomInviteAcceptedEvent['payload']) => void;
  onInviteDeclined?: (payload: RoomInviteDeclinedEvent['payload']) => void;
}

/**
 * Hook to subscribe to room-specific WebSocket events
 */
export function useRoomEvents(
  roomId: string,
  handlers: RoomEventHandlers
): void {
  // Filter events by roomId to only handle relevant room events
  useSocketEvent(
    'ROOM_MEMBER_JOINED',
    (payload) => {
      if (payload.roomId === roomId && handlers.onMemberJoined) {
        handlers.onMemberJoined(payload);
      }
    },
    [roomId, handlers.onMemberJoined]
  );

  useSocketEvent(
    'ROOM_MEMBER_LEFT',
    (payload) => {
      if (payload.roomId === roomId && handlers.onMemberLeft) {
        handlers.onMemberLeft(payload);
      }
    },
    [roomId, handlers.onMemberLeft]
  );

  useSocketEvent(
    'ROOM_READY_STATE_CHANGED',
    (payload) => {
      if (payload.roomId === roomId && handlers.onReadyStateChanged) {
        handlers.onReadyStateChanged(payload);
      }
    },
    [roomId, handlers.onReadyStateChanged]
  );

  useSocketEvent(
    'ROOM_PLAYERS_ASSIGNED',
    (payload) => {
      if (payload.roomId === roomId && handlers.onPlayersAssigned) {
        handlers.onPlayersAssigned(payload);
      }
    },
    [roomId, handlers.onPlayersAssigned]
  );

  useSocketEvent(
    'ROOM_GAME_STARTING',
    (payload) => {
      if (payload.roomId === roomId && handlers.onGameStarting) {
        handlers.onGameStarting(payload);
      }
    },
    [roomId, handlers.onGameStarting]
  );

  useSocketEvent(
    'ROOM_GAME_ENDED',
    (payload) => {
      if (payload.roomId === roomId && handlers.onGameEnded) {
        handlers.onGameEnded(payload);
      }
    },
    [roomId, handlers.onGameEnded]
  );

  useSocketEvent(
    'ROOM_CLOSED',
    (payload) => {
      if (payload.roomId === roomId && handlers.onRoomClosed) {
        handlers.onRoomClosed(payload);
      }
    },
    [roomId, handlers.onRoomClosed]
  );

  // Invite events (not filtered by roomId as they're user-specific)
  useSocketEvent(
    'ROOM_INVITE_RECEIVED',
    (payload) => {
      if (handlers.onInviteReceived) {
        handlers.onInviteReceived(payload);
      }
    },
    [handlers.onInviteReceived]
  );

  useSocketEvent(
    'ROOM_INVITE_ACCEPTED',
    (payload) => {
      if (handlers.onInviteAccepted) {
        handlers.onInviteAccepted(payload);
      }
    },
    [handlers.onInviteAccepted]
  );

  useSocketEvent(
    'ROOM_INVITE_DECLINED',
    (payload) => {
      if (handlers.onInviteDeclined) {
        handlers.onInviteDeclined(payload);
      }
    },
    [handlers.onInviteDeclined]
  );
}
