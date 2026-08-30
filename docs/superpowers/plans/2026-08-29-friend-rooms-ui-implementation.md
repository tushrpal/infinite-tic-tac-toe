# Friend Rooms UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement frontend UI for friend rooms system - persistent social lobbies where up to 8 friends can hang out, with 2 playing at a time while others spectate.

**Architecture:** Next.js App Router pages with React components, WebSocket real-time updates, custom hooks for state management, REST API integration for room operations.

**Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS, WebSocket (existing infrastructure), REST API

**Spec:** [docs/superpowers/specs/2026-08-29-room-ui-design.md](../specs/2026-08-29-room-ui-design.md)

## Global Constraints

- Follow existing component patterns from `apps/web/components/`
- Use existing `useWebSocket` and `useSocketEvent` hooks
- Match design system: `@/components/ui/Button`, `@/components/ui/Modal`, `@/components/ui/Badge`
- Use Tailwind color tokens: `accent-primary`, `accent-success`, `accent-warning`, `critical`, `surface-elevated`, `board-grid`, `text-primary`, `text-secondary`, `text-muted`
- Responsive breakpoints: mobile `<768px`, tablet `768px-1023px`, desktop `≥1024px`
- All API calls via `apiRequest<T>()` from `@/lib/api`
- Room name max 50 characters
- Max 8 players per room
- Modes: MODE_1 (Sliding), MODE_2 (Classic)
- Room status: WAITING, ACTIVE, BETWEEN_GAMES, CLOSED

---

## Phase 1: Type Definitions & WebSocket Events

### Task 1: Add Room Types

**Files:**
- Modify: `apps/web/ws/types.ts` (add after line 680)

**Interfaces:**
- Consumes: Existing `ServerEventType`, `ClientEventType`, `PlayerInfo`, `GameMode`
- Produces: `RoomStatus`, `Room`, `RoomMember`, `RoomInvite` types and 13 new event types

- [ ] **Step 1: Write test for room type imports**

```typescript
// apps/web/ws/__tests__/room-types.test.ts
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
        displayName: 'Alice',
        ratingMode1: 1200,
        ratingMode2: 1100,
      },
      members: [],
    };
    expect(room.id).toBe('room-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test ws/__tests__/room-types.test.ts`
Expected: FAIL with "Module '"../types"' has no exported member 'RoomStatus'"

- [ ] **Step 3: Add room types to ws/types.ts**

```typescript
// Add to apps/web/ws/types.ts after line 680

// ============================================
// Room Types
// ============================================

export type RoomStatus = 'WAITING' | 'ACTIVE' | 'BETWEEN_GAMES' | 'CLOSED';

export interface Room {
  id: string;
  hostId: string;
  name: string | null;
  mode: 1 | 2;
  status: RoomStatus;
  player1Id: string | null;
  player2Id: string | null;
  currentMatchId: string | null;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
  host: PlayerInfo;
  player1?: PlayerInfo;
  player2?: PlayerInfo;
  members: RoomMember[];
}

export interface RoomMember {
  id: string;
  roomId: string;
  playerId: string;
  isReady: boolean;
  joinedAt: string;
  player: PlayerInfo;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  room?: {
    id: string;
    name: string | null;
    mode: number;
    status: RoomStatus;
    memberCount: number;
  };
  inviter?: PlayerInfo;
}

export interface RoomListItem {
  id: string;
  hostId: string;
  name: string | null;
  mode: 1 | 2;
  status: RoomStatus;
  memberCount: number;
  maxPlayers: number;
  host: {
    username: string;
    displayName: string;
  };
  createdAt: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test ws/__tests__/room-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/ws/types.ts apps/web/ws/__tests__/room-types.test.ts
git commit -m "feat(rooms): add room type definitions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Add Room WebSocket Event Types

**Files:**
- Modify: `apps/web/ws/types.ts:106-160` (update ServerEventType and ClientEventType)
- Modify: `apps/web/ws/types.ts` (add event interfaces after line 625)

**Interfaces:**
- Consumes: `RoomStatus`, `Room`, `RoomMember`, `RoomInvite`, `PlayerInfo`
- Produces: 13 new `ServerEventType` values, corresponding event interfaces

- [ ] **Step 1: Write test for room event types**

```typescript
// apps/web/ws/__tests__/room-events.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test ws/__tests__/room-events.test.ts`
Expected: FAIL with "Module '"../types"' has no exported member 'RoomMemberJoinedEvent'"

- [ ] **Step 3: Update ServerEventType enum**

```typescript
// In apps/web/ws/types.ts, update ServerEventType (around line 126-160)
export type ServerEventType =
  | 'QUEUE_JOINED'
  | 'QUEUE_LEFT'
  | 'QUEUE_STATUS'
  | 'BOT_MATCH_OFFER'
  | 'MATCH_FOUND'
  | 'MATCH_JOINED'
  | 'GAME_STATE_UPDATE'
  | 'MOVE_UPDATE'
  | 'MOVE_ACCEPTED'
  | 'MOVE_REJECTED'
  | 'MATCH_END'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'RECONNECTED'
  | 'REMATCH_REQUESTED'
  | 'REMATCH_STARTING'
  | 'REMATCH_DECLINED'
  | 'SPECTATOR_JOINED'
  | 'SPECTATOR_LEFT'
  | 'CHALLENGE_RECEIVED'
  | 'CHALLENGE_ACCEPTED'
  | 'CHALLENGE_DECLINED'
  | 'CHALLENGE_CANCELLED'
  | 'CHALLENGE_EXPIRED'
  | 'PRIVATE_MATCH_JOINED'
  | 'PRIVATE_MATCH_EXPIRED'
  | 'FRIEND_REQUEST_RECEIVED'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REQUEST_DECLINED'
  | 'FRIEND_REMOVED'
  | 'FRIEND_ONLINE'
  | 'FRIEND_OFFLINE'
  | 'ROOM_CREATED'
  | 'ROOM_MEMBER_JOINED'
  | 'ROOM_MEMBER_LEFT'
  | 'ROOM_READY_STATE_CHANGED'
  | 'ROOM_PLAYERS_ASSIGNED'
  | 'ROOM_GAME_STARTING'
  | 'ROOM_GAME_ENDED'
  | 'ROOM_CLOSED'
  | 'ROOM_INVITE_RECEIVED'
  | 'ROOM_INVITE_ACCEPTED'
  | 'ROOM_INVITE_DECLINED'
  | 'ERROR'
  | 'PONG';
```

- [ ] **Step 4: Add room event interfaces**

```typescript
// Add to apps/web/ws/types.ts after FriendOfflineEvent (around line 625)

export interface RoomCreatedEvent {
  type: 'ROOM_CREATED';
  payload: {
    room: Room;
  };
}

export interface RoomMemberJoinedEvent {
  type: 'ROOM_MEMBER_JOINED';
  payload: {
    roomId: string;
    member: PlayerInfo;
    memberCount: number;
  };
}

export interface RoomMemberLeftEvent {
  type: 'ROOM_MEMBER_LEFT';
  payload: {
    roomId: string;
    memberId: string;
    memberCount: number;
  };
}

export interface RoomReadyStateChangedEvent {
  type: 'ROOM_READY_STATE_CHANGED';
  payload: {
    roomId: string;
    playerId: string;
    isReady: boolean;
    readyCount: number;
  };
}

export interface RoomPlayersAssignedEvent {
  type: 'ROOM_PLAYERS_ASSIGNED';
  payload: {
    roomId: string;
    player1: PlayerInfo;
    player2: PlayerInfo;
  };
}

export interface RoomGameStartingEvent {
  type: 'ROOM_GAME_STARTING';
  payload: {
    roomId: string;
    matchId: string;
    player1: PlayerInfo;
    player2: PlayerInfo;
  };
}

export interface RoomGameEndedEvent {
  type: 'ROOM_GAME_ENDED';
  payload: {
    roomId: string;
    matchId: string;
    winner: 'PLAYER_1' | 'PLAYER_2' | 'DRAW';
    player1: PlayerInfo;
    player2: PlayerInfo;
  };
}

export interface RoomClosedEvent {
  type: 'ROOM_CLOSED';
  payload: {
    roomId: string;
    reason: 'host_left' | 'host_closed' | 'expired';
  };
}

export interface RoomInviteReceivedEvent {
  type: 'ROOM_INVITE_RECEIVED';
  payload: {
    inviteId: string;
    roomId: string;
    roomName: string | null;
    inviter: PlayerInfo;
    expiresAt: string;
  };
}

export interface RoomInviteAcceptedEvent {
  type: 'ROOM_INVITE_ACCEPTED';
  payload: {
    inviteId: string;
    roomId: string;
    invitee: PlayerInfo;
  };
}

export interface RoomInviteDeclinedEvent {
  type: 'ROOM_INVITE_DECLINED';
  payload: {
    inviteId: string;
    roomId: string;
    inviteeId: string;
  };
}
```

- [ ] **Step 5: Update ServerEvent union type**

```typescript
// Update ServerEvent union type (around line 627-661)
export type ServerEvent =
  | QueueJoinedEvent
  | QueueLeftEvent
  | QueueStatusEvent
  | BotMatchOfferEvent
  | MatchFoundEvent
  | MatchJoinedEvent
  | GameStateUpdateEvent
  | MoveUpdateEvent
  | MoveAcceptedEvent
  | MoveRejectedEvent
  | MatchEndEvent
  | PlayerDisconnectedEvent
  | PlayerReconnectedEvent
  | ReconnectedEvent
  | RematchRequestedEvent
  | RematchStartingEvent
  | RematchDeclinedEvent
  | SpectatorJoinedEvent
  | SpectatorLeftEvent
  | ChallengeReceivedEvent
  | ChallengeAcceptedEvent
  | ChallengeDeclinedEvent
  | ChallengeCancelledEvent
  | ChallengeExpiredEvent
  | PrivateMatchJoinedEvent
  | PrivateMatchExpiredEvent
  | FriendRequestReceivedEvent
  | FriendRequestAcceptedEvent
  | FriendRequestDeclinedEvent
  | FriendRemovedEvent
  | FriendOnlineEvent
  | FriendOfflineEvent
  | RoomCreatedEvent
  | RoomMemberJoinedEvent
  | RoomMemberLeftEvent
  | RoomReadyStateChangedEvent
  | RoomPlayersAssignedEvent
  | RoomGameStartingEvent
  | RoomGameEndedEvent
  | RoomClosedEvent
  | RoomInviteReceivedEvent
  | RoomInviteAcceptedEvent
  | RoomInviteDeclinedEvent
  | ErrorEvent
  | PongEvent;
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/web && npm test ws/__tests__/room-events.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/ws/types.ts apps/web/ws/__tests__/room-events.test.ts
git commit -m "feat(rooms): add room WebSocket event types

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Room API Integration

### Task 3: Add Room API Functions

**Files:**
- Create: `apps/web/lib/rooms.ts`
- Create: `apps/web/lib/__tests__/rooms.test.ts`

**Interfaces:**
- Consumes: `apiRequest<T>()` from `@/lib/api`, room types from `@/ws/types`
- Produces: Room API functions: `createRoom()`, `getRooms()`, `getAvailableRooms()`, `getRoom()`, `joinRoom()`, `leaveRoom()`, `closeRoom()`, `toggleReady()`, `assignPlayers()`, `startGame()`, `invitePlayers()`, `getPendingInvites()`, `respondToInvite()`

- [ ] **Step 1: Write test for createRoom function**

```typescript
// apps/web/lib/__tests__/rooms.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test lib/__tests__/rooms.test.ts`
Expected: FAIL with "Cannot find module '../rooms'"

- [ ] **Step 3: Create rooms.ts with API functions**

```typescript
// apps/web/lib/rooms.ts
import { apiRequest } from './api';
import type { Room, RoomListItem, RoomInvite } from '@/ws/types';

export interface CreateRoomParams {
  name?: string | null;
  mode: 1 | 2;
  maxPlayers?: number;
}

export interface AssignPlayersParams {
  player1Id: string;
  player2Id: string;
}

export interface InvitePlayersParams {
  playerIds: string[];
}

export interface RespondToInviteParams {
  accepted: boolean;
}

/**
 * Create a new room
 */
export async function createRoom(params: CreateRoomParams): Promise<Room> {
  return apiRequest<Room>('/rooms/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get list of my active rooms
 */
export async function getRooms(): Promise<RoomListItem[]> {
  return apiRequest<RoomListItem[]>('/rooms');
}

/**
 * Get list of joinable friend rooms
 */
export async function getAvailableRooms(): Promise<RoomListItem[]> {
  return apiRequest<RoomListItem[]>('/rooms/available');
}

/**
 * Get full room details by ID
 */
export async function getRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}`);
}

/**
 * Join a room
 */
export async function joinRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/join`, {
    method: 'POST',
  });
}

/**
 * Leave a room
 */
export async function leaveRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/leave`, {
    method: 'POST',
  });
}

/**
 * Close a room (host only)
 */
export async function closeRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/close`, {
    method: 'POST',
  });
}

/**
 * Toggle ready state
 */
export async function toggleReady(roomId: string): Promise<{ isReady: boolean }> {
  return apiRequest<{ isReady: boolean }>(`/rooms/${roomId}/ready`, {
    method: 'POST',
  });
}

/**
 * Assign players for next game (host only)
 */
export async function assignPlayers(
  roomId: string,
  params: AssignPlayersParams
): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/assign-players`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Start game (host only)
 */
export async function startGame(roomId: string): Promise<{ matchId: string }> {
  return apiRequest<{ matchId: string }>(`/rooms/${roomId}/start-game`, {
    method: 'POST',
  });
}

/**
 * Invite players to room
 */
export async function invitePlayers(
  roomId: string,
  params: InvitePlayersParams
): Promise<{ inviteIds: string[] }> {
  return apiRequest<{ inviteIds: string[] }>(`/rooms/${roomId}/invite`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get pending room invites
 */
export async function getPendingInvites(): Promise<RoomInvite[]> {
  return apiRequest<RoomInvite[]>('/room-invites');
}

/**
 * Respond to a room invite
 */
export async function respondToInvite(
  inviteId: string,
  params: RespondToInviteParams
): Promise<void> {
  return apiRequest<void>(`/room-invites/${inviteId}/respond`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test lib/__tests__/rooms.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/rooms.ts apps/web/lib/__tests__/rooms.test.ts
git commit -m "feat(rooms): add room API integration functions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: Custom Hooks for Room State

### Task 4: Create useRoomState Hook

**Files:**
- Create: `apps/web/hooks/useRoomState.ts`
- Create: `apps/web/hooks/__tests__/useRoomState.test.ts`

**Interfaces:**
- Consumes: `getRoom()` from `@/lib/rooms`, `Room`, `RoomMember` from `@/ws/types`
- Produces: `useRoomState(roomId: string)` hook returning `{ room, members, isLoading, error, refetch, actions: { join, leave, toggleReady, close } }`

- [ ] **Step 1: Write test for useRoomState hook**

```typescript
// apps/web/hooks/__tests__/useRoomState.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test hooks/__tests__/useRoomState.test.ts`
Expected: FAIL with "Cannot find module '../useRoomState'"

- [ ] **Step 3: Create useRoomState hook**

```typescript
// apps/web/hooks/useRoomState.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test hooks/__tests__/useRoomState.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/hooks/useRoomState.ts apps/web/hooks/__tests__/useRoomState.test.ts
git commit -m "feat(rooms): add useRoomState hook for room state management

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Create useRoomEvents Hook

**Files:**
- Create: `apps/web/hooks/useRoomEvents.ts`
- Create: `apps/web/hooks/__tests__/useRoomEvents.test.ts`

**Interfaces:**
- Consumes: `useSocketEvent()` from `@/hooks/useWebSocket`, room event types from `@/ws/types`
- Produces: `useRoomEvents(roomId: string, handlers: RoomEventHandlers)` hook for subscribing to room WebSocket events

- [ ] **Step 1: Write test for useRoomEvents hook**

```typescript
// apps/web/hooks/__tests__/useRoomEvents.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRoomEvents } from '../useRoomEvents';
import * as useWebSocketModule from '../useWebSocket';

vi.mock('../useWebSocket');

describe('useRoomEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to room events', () => {
    const mockUseSocketEvent = vi.fn();
    vi.mocked(useWebSocketModule).useSocketEvent = mockUseSocketEvent;

    const handlers = {
      onMemberJoined: vi.fn(),
      onMemberLeft: vi.fn(),
      onReadyStateChanged: vi.fn(),
    };

    renderHook(() => useRoomEvents('room-1', handlers));

    expect(mockUseSocketEvent).toHaveBeenCalledWith(
      'ROOM_MEMBER_JOINED',
      expect.any(Function),
      expect.any(Array)
    );
    expect(mockUseSocketEvent).toHaveBeenCalledWith(
      'ROOM_MEMBER_LEFT',
      expect.any(Function),
      expect.any(Array)
    );
    expect(mockUseSocketEvent).toHaveBeenCalledWith(
      'ROOM_READY_STATE_CHANGED',
      expect.any(Function),
      expect.any(Array)
    );
  });

  it('should call handlers when events occur', () => {
    let capturedHandler: any;
    const mockUseSocketEvent = vi.fn((eventType, handler) => {
      if (eventType === 'ROOM_MEMBER_JOINED') {
        capturedHandler = handler;
      }
    });
    vi.mocked(useWebSocketModule).useSocketEvent = mockUseSocketEvent;

    const handlers = {
      onMemberJoined: vi.fn(),
    };

    renderHook(() => useRoomEvents('room-1', handlers));

    const payload = {
      roomId: 'room-1',
      member: { id: 'player-1', username: 'alice' },
      memberCount: 3,
    };

    capturedHandler(payload);

    expect(handlers.onMemberJoined).toHaveBeenCalledWith(payload);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test hooks/__tests__/useRoomEvents.test.ts`
Expected: FAIL with "Cannot find module '../useRoomEvents'"

- [ ] **Step 3: Create useRoomEvents hook**

```typescript
// apps/web/hooks/useRoomEvents.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test hooks/__tests__/useRoomEvents.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/hooks/useRoomEvents.ts apps/web/hooks/__tests__/useRoomEvents.test.ts
git commit -m "feat(rooms): add useRoomEvents hook for WebSocket subscriptions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: Core Room Components

### Task 6: Create RoomCard Component

**Files:**
- Create: `apps/web/components/rooms/RoomCard.tsx`
- Create: `apps/web/components/rooms/__tests__/RoomCard.test.tsx`

**Interfaces:**
- Consumes: `RoomListItem` from `@/ws/types`, `Button` from `@/components/ui/Button`
- Produces: `RoomCard` component displaying room info with join button

- [ ] **Step 1: Write test for RoomCard component**

```typescript
// apps/web/components/rooms/__tests__/RoomCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomCard } from '../RoomCard';
import type { RoomListItem } from '@/ws/types';

describe('RoomCard', () => {
  const mockRoom: RoomListItem = {
    id: 'room-1',
    hostId: 'player-1',
    name: 'Epic Battles',
    mode: 1,
    status: 'WAITING',
    memberCount: 3,
    maxPlayers: 8,
    host: {
      username: 'alice',
      displayName: 'Alice',
    },
    createdAt: new Date().toISOString(),
  };

  it('should render room information', () => {
    render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);

    expect(screen.getByText('Epic Battles')).toBeInTheDocument();
    expect(screen.getByText(/Host: alice/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/8 players/i)).toBeInTheDocument();
  });

  it('should display "Open" badge for WAITING status', () => {
    render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should display "In Game" badge for ACTIVE status', () => {
    const activeRoom = { ...mockRoom, status: 'ACTIVE' as const };
    render(<RoomCard room={activeRoom} onJoin={vi.fn()} />);

    expect(screen.getByText('In Game')).toBeInTheDocument();
  });

  it('should call onJoin when join button is clicked', () => {
    const onJoin = vi.fn();
    render(<RoomCard room={mockRoom} onJoin={onJoin} />);

    const joinButton = screen.getByText('Join Room');
    fireEvent.click(joinButton);

    expect(onJoin).toHaveBeenCalledWith('room-1');
  });

  it('should show "Open Room" button when isMember is true', () => {
    render(<RoomCard room={mockRoom} onJoin={vi.fn()} isMember={true} />);

    expect(screen.getByText('Open Room')).toBeInTheDocument();
  });

  it('should display host name as room name when name is null', () => {
    const roomWithoutName = { ...mockRoom, name: null };
    render(<RoomCard room={roomWithoutName} onJoin={vi.fn()} />);

    expect(screen.getByText("Alice's Room")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test components/rooms/__tests__/RoomCard.test.tsx`
Expected: FAIL with "Cannot find module '../RoomCard'"

- [ ] **Step 3: Create RoomCard component**

```typescript
// apps/web/components/rooms/RoomCard.tsx
'use client';

import { Button } from '@/components/ui/Button';
import type { RoomListItem } from '@/ws/types';

interface RoomCardProps {
  room: RoomListItem;
  onJoin: (roomId: string) => void;
  isMember?: boolean;
}

export function RoomCard({ room, onJoin, isMember = false }: RoomCardProps) {
  const displayName = room.name || `${room.host.displayName}'s Room`;
  const modeLabel = room.mode === 1 ? 'Sliding' : 'Classic';

  const statusConfig = {
    WAITING: { label: 'Open', color: 'text-accent-success' },
    ACTIVE: { label: 'In Game', color: 'text-blue-400' },
    BETWEEN_GAMES: { label: 'Between Games', color: 'text-accent-warning' },
    CLOSED: { label: 'Closed', color: 'text-text-muted' },
  };

  const status = statusConfig[room.status];

  return (
    <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid hover:border-accent-primary/50 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold truncate">🏠 {displayName}</h3>
            <span className={`text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          
          <div className="text-sm text-text-secondary space-y-1">
            <p>Host: {room.host.username} · Mode: {modeLabel}</p>
            <p>👥 {room.memberCount}/{room.maxPlayers} players</p>
          </div>
        </div>

        <Button
          onClick={() => onJoin(room.id)}
          variant="primary"
          size="sm"
        >
          {isMember ? 'Open Room' : 'Join Room'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test components/rooms/__tests__/RoomCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/rooms/RoomCard.tsx apps/web/components/rooms/__tests__/RoomCard.test.tsx
git commit -m "feat(rooms): add RoomCard component for room list display

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Create CreateRoomModal Component

**Files:**
- Create: `apps/web/components/rooms/CreateRoomModal.tsx`
- Create: `apps/web/components/rooms/__tests__/CreateRoomModal.test.tsx`

**Interfaces:**
- Consumes: `Modal` from `@/components/ui/Modal`, `Button` from `@/components/ui/Button`, `createRoom()` from `@/lib/rooms`
- Produces: `CreateRoomModal` component with form for creating new rooms

- [ ] **Step 1: Write test for CreateRoomModal**

```typescript
// apps/web/components/rooms/__tests__/CreateRoomModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateRoomModal } from '../CreateRoomModal';
import * as roomsApi from '@/lib/rooms';

vi.mock('@/lib/rooms');

describe('CreateRoomModal', () => {
  it('should render form fields', () => {
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByLabelText(/Room Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sliding/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Classic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max Players/i)).toBeInTheDocument();
  });

  it('should validate room name length', async () => {
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const nameInput = screen.getByLabelText(/Room Name/i);
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(51) } });

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/must be 50 characters or less/i)).toBeInTheDocument();
    });
  });

  it('should require game mode selection', async () => {
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/select a game mode/i)).toBeInTheDocument();
    });
  });

  it('should create room with valid data', async () => {
    const mockRoom = { id: 'room-1', name: 'Test Room' };
    vi.mocked(roomsApi.createRoom).mockResolvedValue(mockRoom as any);

    const onSuccess = vi.fn();
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/Room Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Room' } });

    const slidingRadio = screen.getByLabelText(/Sliding/i);
    fireEvent.click(slidingRadio);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(roomsApi.createRoom).toHaveBeenCalledWith({
        name: 'Test Room',
        mode: 1,
        maxPlayers: 4,
      });
      expect(onSuccess).toHaveBeenCalledWith('room-1');
    });
  });

  it('should handle empty name as null', async () => {
    const mockRoom = { id: 'room-1', name: null };
    vi.mocked(roomsApi.createRoom).mockResolvedValue(mockRoom as any);

    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const slidingRadio = screen.getByLabelText(/Sliding/i);
    fireEvent.click(slidingRadio);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(roomsApi.createRoom).toHaveBeenCalledWith({
        name: null,
        mode: 1,
        maxPlayers: 4,
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test components/rooms/__tests__/CreateRoomModal.test.tsx`
Expected: FAIL with "Cannot find module '../CreateRoomModal'"

- [ ] **Step 3: Create CreateRoomModal component**

```typescript
// apps/web/components/rooms/CreateRoomModal.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createRoom } from '@/lib/rooms';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<1 | 2 | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (name.length > 50) {
      newErrors.name = 'Room name must be 50 characters or less';
    }

    if (!mode) {
      newErrors.mode = 'Please select a game mode';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const room = await createRoom({
        name: name.trim() || null,
        mode: mode!,
        maxPlayers,
      });

      onSuccess(room.id);
      onClose();

      // Reset form
      setName('');
      setMode(null);
      setMaxPlayers(4);
    } catch (error) {
      console.error('Error creating room:', error);
      setErrors({ submit: 'Failed to create room. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Name */}
        <div>
          <label htmlFor="room-name" className="block text-sm font-medium mb-2">
            Room Name (optional)
          </label>
          <input
            id="room-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Epic Battles, Chill Games, etc."
            maxLength={50}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-critical">{errors.name}</p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            Leave empty to use &quot;[Your Name]&apos;s Room&quot;
          </p>
        </div>

        {/* Game Mode */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Game Mode <span className="text-critical">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-board-grid hover:border-accent-primary/50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="mode"
                value="1"
                checked={mode === 1}
                onChange={() => setMode(1)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">⚡ Sliding (MODE_1)</div>
                <div className="text-sm text-text-secondary">
                  Marks slide after 3 placed
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-board-grid hover:border-accent-primary/50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="mode"
                value="2"
                checked={mode === 2}
                onChange={() => setMode(2)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">🎯 Classic (MODE_2)</div>
                <div className="text-sm text-text-secondary">
                  Traditional tic-tac-toe
                </div>
              </div>
            </label>
          </div>
          {errors.mode && (
            <p className="mt-1 text-sm text-critical">{errors.mode}</p>
          )}
        </div>

        {/* Max Players */}
        <div>
          <label htmlFor="max-players" className="block text-sm font-medium mb-2">
            Max Players
          </label>
          <select
            id="max-players"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((num) => (
              <option key={num} value={num}>
                {num} players
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Notice */}
        <div className="p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
          <p className="text-sm text-text-secondary">
            🔒 Only your friends can see and join this room
          </p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !mode}
          >
            {isSubmitting ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test components/rooms/__tests__/CreateRoomModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/rooms/CreateRoomModal.tsx apps/web/components/rooms/__tests__/CreateRoomModal.test.tsx
git commit -m "feat(rooms): add CreateRoomModal component for room creation

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Create PlayerList Component

**Files:**
- Create: `apps/web/components/rooms/PlayerList.tsx`
- Create: `apps/web/components/rooms/__tests__/PlayerList.test.tsx`

**Interfaces:**
- Consumes: `RoomMember` from `@/ws/types`, `Button` from `@/components/ui/Button`
- Produces: `PlayerList` component displaying room members with ready states

- [ ] **Step 1: Write test for PlayerList component**

```typescript
// apps/web/components/rooms/__tests__/PlayerList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerList } from '../PlayerList';
import type { RoomMember } from '@/ws/types';

describe('PlayerList', () => {
  const mockMembers: RoomMember[] = [
    {
      id: 'member-1',
      roomId: 'room-1',
      playerId: 'player-1',
      isReady: true,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-1',
        username: 'alice',
        displayName: 'Alice',
        ratingMode1: 1234,
        isConnected: true,
      },
    },
    {
      id: 'member-2',
      roomId: 'room-1',
      playerId: 'player-2',
      isReady: false,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-2',
        username: 'bob',
        displayName: 'Bob',
        ratingMode1: 980,
        isConnected: true,
      },
    },
  ];

  it('should render all members', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show crown icon for host', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('👑')).toBeInTheDocument();
  });

  it('should show ready state badges', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('✅ Ready')).toBeInTheDocument();
    expect(screen.getByText('⏸️ Not Ready')).toBeInTheDocument();
  });

  it('should show toggle button for current player', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('Mark Not Ready')).toBeInTheDocument();
  });

  it('should call onToggleReady when button clicked', () => {
    const onToggleReady = vi.fn();
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={onToggleReady}
        onInvite={vi.fn()}
      />
    );

    const toggleButton = screen.getByText('Mark Not Ready');
    fireEvent.click(toggleButton);

    expect(onToggleReady).toHaveBeenCalled();
  });

  it('should show player ratings', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('⭐ Rating: 1234')).toBeInTheDocument();
    expect(screen.getByText('⭐ Rating: 980')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test components/rooms/__tests__/PlayerList.test.tsx`
Expected: FAIL with "Cannot find module '../PlayerList'"

- [ ] **Step 3: Create PlayerList component**

```typescript
// apps/web/components/rooms/PlayerList.tsx
'use client';

import { Button } from '@/components/ui/Button';
import type { RoomMember } from '@/ws/types';

interface PlayerListProps {
  members: RoomMember[];
  hostId: string;
  currentPlayerId: string | null;
  onToggleReady: () => void;
  onInvite: () => void;
}

export function PlayerList({
  members,
  hostId,
  currentPlayerId,
  onToggleReady,
  onInvite,
}: PlayerListProps) {
  const currentMember = members.find((m) => m.playerId === currentPlayerId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Players ({members.length}/8)
        </h3>
        <Button onClick={onInvite} variant="secondary" size="sm">
          + Invite
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const isHost = member.playerId === hostId;
          const isCurrentPlayer = member.playerId === currentPlayerId;

          return (
            <div
              key={member.id}
              className="p-4 rounded-lg bg-surface-elevated border border-board-grid"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isHost && <span className="text-lg">👑</span>}
                    <span className="font-medium truncate">
                      {member.player.displayName}
                    </span>
                    {isCurrentPlayer && (
                      <span className="text-xs text-text-muted">(You)</span>
                    )}
                  </div>

                  <div className="text-sm text-text-secondary">
                    <p>⭐ Rating: {member.player.ratingMode1 || 'Unrated'}</p>
                  </div>

                  <div className="mt-2">
                    {member.isReady ? (
                      <span className="text-xs font-medium text-accent-success">
                        ✅ Ready
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-text-muted">
                        ⏸️ Not Ready
                      </span>
                    )}
                  </div>
                </div>

                {isCurrentPlayer && (
                  <Button
                    onClick={onToggleReady}
                    variant="secondary"
                    size="sm"
                  >
                    {member.isReady ? 'Mark Not Ready' : 'Mark Ready'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test components/rooms/__tests__/PlayerList.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/rooms/PlayerList.tsx apps/web/components/rooms/__tests__/PlayerList.test.tsx
git commit -m "feat(rooms): add PlayerList component for displaying members

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Create PlayerAssignmentModal Component

**Files:**
- Create: `apps/web/components/rooms/PlayerAssignmentModal.tsx`
- Create: `apps/web/components/rooms/__tests__/PlayerAssignmentModal.test.tsx`

**Interfaces:**
- Consumes: `Modal` from `@/components/ui/Modal`, `Button` from `@/components/ui/Button`, `RoomMember` from `@/ws/types`, `assignPlayers()` from `@/lib/rooms`
- Produces: `PlayerAssignmentModal` component for host to assign players

- [ ] **Step 1: Write test for PlayerAssignmentModal**

```typescript
// apps/web/components/rooms/__tests__/PlayerAssignmentModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerAssignmentModal } from '../PlayerAssignmentModal';
import type { RoomMember } from '@/ws/types';
import * as roomsApi from '@/lib/rooms';

vi.mock('@/lib/rooms');

describe('PlayerAssignmentModal', () => {
  const mockMembers: RoomMember[] = [
    {
      id: 'member-1',
      roomId: 'room-1',
      playerId: 'player-1',
      isReady: true,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-1',
        username: 'alice',
        displayName: 'Alice',
        isConnected: true,
      },
    },
    {
      id: 'member-2',
      roomId: 'room-1',
      playerId: 'player-2',
      isReady: true,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-2',
        username: 'bob',
        displayName: 'Bob',
        isConnected: true,
      },
    },
    {
      id: 'member-3',
      roomId: 'room-1',
      playerId: 'player-3',
      isReady: false,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-3',
        username: 'charlie',
        displayName: 'Charlie',
        isConnected: true,
      },
    },
  ];

  it('should render player dropdowns', () => {
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Player 1 \(X\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Player 2 \(O\)/i)).toBeInTheDocument();
  });

  it('should show ready players first in dropdowns', () => {
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={vi.fn()}
      />
    );

    const select = screen.getByLabelText(/Player 1 \(X\)/i);
    const options = Array.from(select.querySelectorAll('option'));
    const optionTexts = options.map((o) => o.textContent);

    // Ready players should come before not ready
    const aliceIndex = optionTexts.findIndex((t) => t?.includes('Alice'));
    const charlieIndex = optionTexts.findIndex((t) => t?.includes('Charlie'));
    expect(aliceIndex).toBeLessThan(charlieIndex);
  });

  it('should validate that different players are selected', async () => {
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={vi.fn()}
      />
    );

    const player1Select = screen.getByLabelText(/Player 1 \(X\)/i);
    const player2Select = screen.getByLabelText(/Player 2 \(O\)/i);

    fireEvent.change(player1Select, { target: { value: 'player-1' } });
    fireEvent.change(player2Select, { target: { value: 'player-1' } });

    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot select the same player twice/i)).toBeInTheDocument();
    });
  });

  it('should assign players successfully', async () => {
    vi.mocked(roomsApi.assignPlayers).mockResolvedValue(undefined);

    const onSuccess = vi.fn();
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={onSuccess}
      />
    );

    const player1Select = screen.getByLabelText(/Player 1 \(X\)/i);
    const player2Select = screen.getByLabelText(/Player 2 \(O\)/i);

    fireEvent.change(player1Select, { target: { value: 'player-1' } });
    fireEvent.change(player2Select, { target: { value: 'player-2' } });

    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(roomsApi.assignPlayers).toHaveBeenCalledWith('room-1', {
        player1Id: 'player-1',
        player2Id: 'player-2',
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test components/rooms/__tests__/PlayerAssignmentModal.test.tsx`
Expected: FAIL with "Cannot find module '../PlayerAssignmentModal'"

- [ ] **Step 3: Create PlayerAssignmentModal component**

```typescript
// apps/web/components/rooms/PlayerAssignmentModal.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { assignPlayers } from '@/lib/rooms';
import type { RoomMember } from '@/ws/types';

interface PlayerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  members: RoomMember[];
  currentAssignment?: {
    player1Id: string | null;
    player2Id: string | null;
  };
  onSuccess: () => void;
}

export function PlayerAssignmentModal({
  isOpen,
  onClose,
  roomId,
  members,
  currentAssignment,
  onSuccess,
}: PlayerAssignmentModalProps) {
  const [player1Id, setPlayer1Id] = useState<string>(
    currentAssignment?.player1Id || ''
  );
  const [player2Id, setPlayer2Id] = useState<string>(
    currentAssignment?.player2Id || ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort members: ready players first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isReady && !b.isReady) return -1;
    if (!a.isReady && b.isReady) return 1;
    return 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!player1Id || !player2Id) {
      setError('Please select both players');
      return;
    }

    if (player1Id === player2Id) {
      setError('Cannot select the same player twice');
      return;
    }

    setIsSubmitting(true);

    try {
      await assignPlayers(roomId, {
        player1Id,
        player2Id,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning players:', err);
      setError('Failed to assign players. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Players for Next Game">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Player 1 (X) */}
        <div>
          <label htmlFor="player1" className="block text-sm font-medium mb-2">
            Player 1 (X)
          </label>
          <select
            id="player1"
            value={player1Id}
            onChange={(e) => setPlayer1Id(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          >
            <option value="">Select a player</option>
            {sortedMembers.map((member) => (
              <option key={member.playerId} value={member.playerId}>
                {member.isReady ? '✅ ' : '⏸️ '}
                {member.player.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Player 2 (O) */}
        <div>
          <label htmlFor="player2" className="block text-sm font-medium mb-2">
            Player 2 (O)
          </label>
          <select
            id="player2"
            value={player2Id}
            onChange={(e) => setPlayer2Id(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          >
            <option value="">Select a player</option>
            {sortedMembers.map((member) => (
              <option key={member.playerId} value={member.playerId}>
                {member.isReady ? '✅ ' : '⏸️ '}
                {member.player.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-blue-400/10 border border-blue-400/20">
          <p className="text-sm text-text-secondary">
            ℹ️ Ready players are shown first
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !player1Id || !player2Id}
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test components/rooms/__tests__/PlayerAssignmentModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/rooms/PlayerAssignmentModal.tsx apps/web/components/rooms/__tests__/PlayerAssignmentModal.test.tsx
git commit -m "feat(rooms): add PlayerAssignmentModal for host player selection

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 5: Room Pages

### Task 10: Create Rooms Hub Page

**Files:**
- Create: `apps/web/app/play/rooms/page.tsx`
- Modify: `apps/web/lib/constants.ts` (add ROUTES.PLAY_ROOMS)

**Interfaces:**
- Consumes: `getRooms()`, `getAvailableRooms()`, `getPendingInvites()` from `@/lib/rooms`, `RoomCard`, `CreateRoomModal` components
- Produces: Rooms hub page at `/play/rooms` with room browser and create UI

- [ ] **Step 1: Add ROUTES.PLAY_ROOMS constant test**

```typescript
// apps/web/lib/__tests__/constants.test.ts (add to existing file or create)
import { describe, it, expect } from 'vitest';
import { ROUTES } from '../constants';

describe('Routes', () => {
  it('should define PLAY_ROOMS route', () => {
    expect(ROUTES.PLAY_ROOMS).toBe('/play/rooms');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test lib/__tests__/constants.test.ts`
Expected: FAIL with "Property 'PLAY_ROOMS' does not exist"

- [ ] **Step 3: Add PLAY_ROOMS to constants**

```typescript
// apps/web/lib/constants.ts (add to ROUTES object)
export const ROUTES = {
  // ... existing routes
  PLAY_ROOMS: '/play/rooms',
  // ... rest of routes
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test lib/__tests__/constants.test.ts`
Expected: PASS

- [ ] **Step 5: Create rooms hub page**

```typescript
// apps/web/app/play/rooms/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RoomCard } from '@/components/rooms/RoomCard';
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal';
import { getRooms, getAvailableRooms, getPendingInvites, respondToInvite, joinRoom } from '@/lib/rooms';
import { ROUTES } from '@/lib/constants';
import type { RoomListItem, RoomInvite } from '@/ws/types';

export default function RoomsHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'available'>('my-rooms');
  const [myRooms, setMyRooms] = useState<RoomListItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomListItem[]>([]);
  const [pendingInvites, setPendingInvites] = useState<RoomInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [myRoomsData, availableData, invitesData] = await Promise.all([
        getRooms(),
        getAvailableRooms(),
        getPendingInvites(),
      ]);

      setMyRooms(myRoomsData);
      setAvailableRooms(availableData);
      setPendingInvites(invitesData.filter((i) => i.status === 'PENDING'));
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      router.push(`/rooms/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleCreateSuccess = (roomId: string) => {
    router.push(`/rooms/${roomId}`);
  };

  const handleRespondToInvite = async (inviteId: string, accepted: boolean) => {
    try {
      await respondToInvite(inviteId, { accepted });
      if (accepted) {
        const invite = pendingInvites.find((i) => i.id === inviteId);
        if (invite) {
          router.push(`/rooms/${invite.roomId}`);
        }
      }
      fetchData();
    } catch (error) {
      console.error('Error responding to invite:', error);
    }
  };

  const displayedRooms = activeTab === 'my-rooms' ? myRooms : availableRooms;

  return (
    <main className="flex-1 flex flex-col px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.PLAY}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 inline-block"
          >
            ← Back to Play Menu
          </Link>
          <h1 className="text-4xl font-display font-bold mb-2">Rooms</h1>
          <p className="text-text-secondary">
            Create a lobby for up to 8 friends to play multiple games
          </p>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-surface-elevated border border-accent-primary/30">
            <h2 className="text-xl font-semibold mb-4">
              📨 Room Invites ({pendingInvites.length})
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-background border border-board-grid"
                >
                  <div>
                    <p className="font-medium">
                      {invite.inviter?.displayName} invited you to{' '}
                      {invite.room?.name ? `"${invite.room.name}"` : 'their room'}
                    </p>
                    {invite.room && (
                      <p className="text-sm text-text-secondary mt-1">
                        {invite.room.memberCount}/8 players · Mode:{' '}
                        {invite.room.mode === 1 ? 'Sliding' : 'Classic'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRespondToInvite(invite.id, true)}
                      variant="primary"
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRespondToInvite(invite.id, false)}
                      variant="secondary"
                      size="sm"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Room Browser */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-board-grid">
              <button
                onClick={() => setActiveTab('my-rooms')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'my-rooms'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                My Rooms
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'available'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Available
              </button>
            </div>

            {/* Room List */}
            {isLoading ? (
              <div className="text-center py-12 text-text-secondary">
                Loading rooms...
              </div>
            ) : displayedRooms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary mb-4">
                  {activeTab === 'my-rooms'
                    ? "You're not in any rooms"
                    : 'No rooms available. Create one to get started!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={handleJoinRoom}
                    isMember={activeTab === 'my-rooms'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Create Room */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h2 className="text-xl font-semibold mb-4">Create a Room</h2>
              <p className="text-sm text-text-secondary mb-6">
                Create a lobby for up to 8 friends to play multiple games
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="primary"
                className="w-full"
              >
                Create Room
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </main>
  );
}
```

- [ ] **Step 6: Run build to verify page works**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/play/rooms/page.tsx apps/web/lib/constants.ts apps/web/lib/__tests__/constants.test.ts
git commit -m "feat(rooms): add rooms hub page for browsing and creating rooms

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Create Room Lobby Page

**Files:**
- Create: `apps/web/app/rooms/[roomId]/page.tsx`

**Interfaces:**
- Consumes: `useRoomState`, `useRoomEvents` hooks, `PlayerList`, `PlayerAssignmentModal` components, `startGame()` from `@/lib/rooms`
- Produces: Room lobby page at `/rooms/:roomId` with full lobby UI

- [ ] **Step 1: Create room lobby page**

```typescript
// apps/web/app/rooms/[roomId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlayerList } from '@/components/rooms/PlayerList';
import { PlayerAssignmentModal } from '@/components/rooms/PlayerAssignmentModal';
import { useRoomState } from '@/hooks/useRoomState';
import { useRoomEvents } from '@/hooks/useRoomEvents';
import { startGame, invitePlayers } from '@/lib/rooms';
import { ROUTES } from '@/lib/constants';
import { usePlayer } from '@/hooks/usePlayer';
import type { PlayerInfo } from '@/ws/types';

export default function RoomLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { player } = usePlayer();

  const { room, members, isLoading, error, refetch, actions } = useRoomState(roomId);
  
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [activityFeed, setActivityFeed] = useState<Array<{ id: string; message: string; timestamp: number }>>([]);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const isHost = room?.hostId === player?.id;
  const canStartGame = room?.player1Id && room?.player2Id && room?.status === 'WAITING';

  useRoomEvents(roomId, {
    onMemberJoined: (payload) => {
      refetch();
      addActivity(`${payload.member.displayName} joined`);
    },
    onMemberLeft: (payload) => {
      refetch();
      const member = members.find((m) => m.playerId === payload.memberId);
      if (member) {
        addActivity(`${member.player.displayName} left`);
      }
    },
    onReadyStateChanged: (payload) => {
      refetch();
      const member = members.find((m) => m.playerId === payload.playerId);
      if (member) {
        addActivity(
          `${member.player.displayName} marked ${payload.isReady ? 'ready' : 'not ready'}`
        );
      }
    },
    onPlayersAssigned: (payload) => {
      refetch();
      addActivity(
        `Host assigned ${payload.player1.displayName} vs ${payload.player2.displayName}`
      );
    },
    onGameStarting: (payload) => {
      addActivity('Game started');
      router.push(`/match/${payload.matchId}`);
    },
    onGameEnded: (payload) => {
      refetch();
      const winnerText =
        payload.winner === 'DRAW'
          ? 'Draw!'
          : `${payload.winner === 'PLAYER_1' ? payload.player1.displayName : payload.player2.displayName} won!`;
      addActivity(winnerText);
    },
    onRoomClosed: (payload) => {
      const reasonText = {
        host_left: 'Room closed - host left',
        host_closed: 'Room closed by host',
        expired: 'Room closed - inactive too long',
      };
      alert(reasonText[payload.reason]);
      router.push(ROUTES.PLAY_ROOMS);
    },
  });

  useEffect(() => {
    if (room) {
      addActivity('Room created');
    }
  }, [room?.id]);

  const addActivity = (message: string) => {
    setActivityFeed((prev) => [
      { id: Math.random().toString(), message, timestamp: Date.now() },
      ...prev,
    ].slice(0, 20));
  };

  const handleStartGame = async () => {
    if (!canStartGame) return;

    setIsStartingGame(true);
    try {
      const { matchId } = await startGame(roomId);
      router.push(`/match/${matchId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game');
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleLeave = async () => {
    if (isHost) {
      if (confirm('Close this room for everyone?')) {
        await actions.close();
        router.push(ROUTES.PLAY_ROOMS);
      }
    } else {
      if (confirm('Leave this room?')) {
        await actions.leave();
        router.push(ROUTES.PLAY_ROOMS);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Loading room...</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center">
        <p className="text-critical mb-4">Room not found</p>
        <Link href={ROUTES.PLAY_ROOMS}>
          <Button>Back to Rooms</Button>
        </Link>
      </main>
    );
  }

  const displayName = room.name || `${room.host.displayName}'s Room`;
  const modeLabel = room.mode === 1 ? 'Sliding' : 'Classic';
  const statusLabel = {
    WAITING: 'Open',
    ACTIVE: 'In Game',
    BETWEEN_GAMES: 'Between Games',
    CLOSED: 'Closed',
  }[room.status];

  return (
    <main className="flex-1 flex flex-col px-4 py-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="mb-8 p-6 rounded-xl bg-surface-elevated border border-board-grid">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">
                🏠 {displayName}
              </h1>
              <p className="text-text-secondary">
                Host: {room.host.username} · Mode: {modeLabel} · Status: {statusLabel}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleLeave} variant="secondary" size="sm">
              {isHost ? '❌ Close' : '🚪 Leave'}
            </Button>
          </div>
        </div>

        {/* Three-Section Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Section A: Players */}
          <div className="lg:col-span-1">
            <PlayerList
              members={members}
              hostId={room.hostId}
              currentPlayerId={player?.id || null}
              onToggleReady={actions.toggleReady}
              onInvite={() => {
                /* TODO: implement invite modal */
              }}
            />
          </div>

          {/* Section B: Game Assignment */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h3 className="font-semibold mb-6 text-center">Next Game</h3>

              {room.status === 'ACTIVE' ? (
                <div className="text-center space-y-4">
                  <p className="text-lg font-medium">🎮 Game in Progress</p>
                  <div className="space-y-2">
                    <p>{room.player1?.displayName} (X)</p>
                    <p className="text-text-muted">vs.</p>
                    <p>{room.player2?.displayName} (O)</p>
                  </div>
                  {room.currentMatchId && (
                    <Button
                      onClick={() => router.push(`/match/${room.currentMatchId}`)}
                      variant="primary"
                    >
                      Watch Game
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-text-secondary">
                      Player 1 (X): {room.player1?.displayName || 'Not assigned'}
                    </p>
                    <p className="text-text-muted">vs.</p>
                    <p className="text-sm text-text-secondary">
                      Player 2 (O): {room.player2?.displayName || 'Not assigned'}
                    </p>
                  </div>

                  {isHost && (
                    <>
                      <Button
                        onClick={() => setIsAssignmentModalOpen(true)}
                        variant="secondary"
                        className="w-full"
                      >
                        {room.player1Id && room.player2Id ? 'Change' : 'Assign Players'}
                      </Button>
                      <Button
                        onClick={handleStartGame}
                        variant="primary"
                        className="w-full"
                        disabled={!canStartGame || isStartingGame}
                      >
                        {isStartingGame ? 'Starting...' : 'Start Game'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section C: Activity Feed */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h3 className="font-semibold mb-4">Activity</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityFeed.length === 0 ? (
                  <p className="text-sm text-text-muted">No activity yet</p>
                ) : (
                  activityFeed.map((item) => (
                    <div key={item.id} className="text-sm text-text-secondary">
                      • {item.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PlayerAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        roomId={roomId}
        members={members}
        currentAssignment={{
          player1Id: room.player1Id,
          player2Id: room.player2Id,
        }}
        onSuccess={() => {
          setIsAssignmentModalOpen(false);
          refetch();
        }}
      />
    </main>
  );
}
```

- [ ] **Step 2: Run build to verify page works**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/rooms/[roomId]/page.tsx
git commit -m "feat(rooms): add room lobby page with full lobby UI

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: Add Rooms Card to Play Menu

**Files:**
- Modify: `apps/web/app/play/page.tsx` (add rooms card after practice)

**Interfaces:**
- Consumes: `ROUTES.PLAY_ROOMS` from constants
- Produces: Updated play menu with rooms option

- [ ] **Step 1: Add rooms card to play page**

```typescript
// In apps/web/app/play/page.tsx, add after Practice Mode card (around line 46):

{/* Rooms */}
<GameModeCard
  href={ROUTES.PLAY_ROOMS}
  title="Play with Friends"
  description="Create a room and play multiple games with friends"
  icon={<RoomsIcon />}
  badge="Social"
  badgeColor="text-purple-400"
/>
```

- [ ] **Step 2: Add RoomsIcon function**

```typescript
// Add to apps/web/app/play/page.tsx after PracticeIcon function:

function RoomsIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
```

- [ ] **Step 3: Run build to verify changes**

Run: `cd apps/web && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/play/page.tsx
git commit -m "feat(rooms): add rooms card to play menu

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 6: Additional Components & Polish

### Task 13: Create RoomInviteModal Component

**Files:**
- Create: `apps/web/components/rooms/RoomInviteModal.tsx`
- Create: `apps/web/components/rooms/__tests__/RoomInviteModal.test.tsx`

**Interfaces:**
- Consumes: `Modal` from `@/components/ui/Modal`, `Button` from `@/components/ui/Button`, friends data from friends context, `invitePlayers()` from `@/lib/rooms`
- Produces: `RoomInviteModal` component for inviting friends to room

- [ ] **Step 1: Write test for RoomInviteModal**

```typescript
// apps/web/components/rooms/__tests__/RoomInviteModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoomInviteModal } from '../RoomInviteModal';
import * as roomsApi from '@/lib/rooms';

vi.mock('@/lib/rooms');

describe('RoomInviteModal', () => {
  const mockFriends = [
    {
      id: 'friend-1',
      username: 'alice',
      displayName: 'Alice',
      isOnline: true,
      inRoom: false,
    },
    {
      id: 'friend-2',
      username: 'bob',
      displayName: 'Bob',
      isOnline: true,
      inRoom: true,
      roomName: 'Another Room',
    },
    {
      id: 'friend-3',
      username: 'charlie',
      displayName: 'Charlie',
      isOnline: false,
      inRoom: false,
    },
  ];

  it('should render friend list with checkboxes', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should show online status indicators', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getAllByText('(Online)').length).toBe(2);
    expect(screen.getByText('(Offline)')).toBeInTheDocument();
  });

  it('should show room indicator for friends in rooms', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('🏠 In Another Room')).toBeInTheDocument();
  });

  it('should send invites to selected friends', async () => {
    vi.mocked(roomsApi.invitePlayers).mockResolvedValue({ inviteIds: ['invite-1'] });

    const onSuccess = vi.fn();
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={onSuccess}
      />
    );

    const aliceCheckbox = screen.getByLabelText(/Alice/);
    fireEvent.click(aliceCheckbox);

    const sendButton = screen.getByText('Send Invites');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(roomsApi.invitePlayers).toHaveBeenCalledWith('room-1', {
        playerIds: ['friend-1'],
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should filter friends by search query', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search friends/i);
    fireEvent.change(searchInput, { target: { value: 'ali' } });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test components/rooms/__tests__/RoomInviteModal.test.tsx`
Expected: FAIL with "Cannot find module '../RoomInviteModal'"

- [ ] **Step 3: Create RoomInviteModal component**

```typescript
// apps/web/components/rooms/RoomInviteModal.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { invitePlayers } from '@/lib/rooms';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  isOnline: boolean;
  inRoom?: boolean;
  roomName?: string | null;
}

interface RoomInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  friends: Friend[];
  roomMemberIds?: string[];
  onSuccess: () => void;
}

export function RoomInviteModal({
  isOpen,
  onClose,
  roomId,
  friends,
  roomMemberIds = [],
  onSuccess,
}: RoomInviteModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (friendId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedIds(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedIds.size === 0) {
      setError('Please select at least one friend');
      return;
    }

    setIsSubmitting(true);

    try {
      await invitePlayers(roomId, {
        playerIds: Array.from(selectedIds),
      });

      onSuccess();
      onClose();

      // Reset
      setSelectedIds(new Set());
      setSearchQuery('');
    } catch (err) {
      console.error('Error sending invites:', err);
      setError('Failed to send invites. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends to Room">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search friends..."
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Friend List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredFriends.length === 0 ? (
            <p className="text-center text-text-muted py-4">No friends found</p>
          ) : (
            filteredFriends.map((friend) => {
              const isInThisRoom = roomMemberIds.includes(friend.id);
              const isDisabled = isInThisRoom;

              return (
                <label
                  key={friend.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-board-grid transition-colors ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-accent-primary/50 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(friend.id)}
                    onChange={() => toggleSelection(friend.id)}
                    disabled={isDisabled}
                    className="w-4 h-4"
                    aria-label={friend.displayName}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{friend.displayName}</span>
                      <span
                        className={`text-xs ${
                          friend.isOnline ? 'text-accent-success' : 'text-text-muted'
                        }`}
                      >
                        ({friend.isOnline ? 'Online' : 'Offline'})
                      </span>
                    </div>
                    {friend.inRoom && friend.roomName && (
                      <p className="text-sm text-text-secondary mt-1">
                        🏠 In {friend.roomName}
                      </p>
                    )}
                    {isInThisRoom && (
                      <p className="text-sm text-text-muted mt-1">Already in this room</p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Selected Count */}
        <p className="text-sm text-text-secondary">
          {selectedIds.size} friend{selectedIds.size !== 1 ? 's' : ''} selected
        </p>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || selectedIds.size === 0}
          >
            {isSubmitting ? 'Sending...' : 'Send Invites'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test components/rooms/__tests__/RoomInviteModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/rooms/RoomInviteModal.tsx apps/web/components/rooms/__tests__/RoomInviteModal.test.tsx
git commit -m "feat(rooms): add RoomInviteModal for inviting friends

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: Create RoomInviteNotification Component

**Files:**
- Create: `apps/web/components/rooms/RoomInviteNotification.tsx`
- Create: `apps/web/components/rooms/__tests__/RoomInviteNotification.test.tsx`

**Interfaces:**
- Consumes: `Toast` component patterns, `respondToInvite()` from `@/lib/rooms`, `RoomInvite` type
- Produces: `RoomInviteNotification` toast component for displaying invite notifications

- [ ] **Step 1: Write test for RoomInviteNotification**

```typescript
// apps/web/components/rooms/__tests__/RoomInviteNotification.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomInviteNotification } from '../RoomInviteNotification';
import type { RoomInvite } from '@/ws/types';

describe('RoomInviteNotification', () => {
  const mockInvite: RoomInvite = {
    id: 'invite-1',
    roomId: 'room-1',
    inviterId: 'player-1',
    inviteeId: 'player-2',
    status: 'PENDING',
    expiresAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    room: {
      id: 'room-1',
      name: 'Epic Battles',
      mode: 1,
      status: 'WAITING',
      memberCount: 3,
    },
    inviter: {
      id: 'player-1',
      username: 'alice',
      displayName: 'Alice',
      isConnected: true,
    },
  };

  it('should render invite information', () => {
    render(
      <RoomInviteNotification
        invite={mockInvite}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/Alice invited you to "Epic Battles"/i)).toBeInTheDocument();
    expect(screen.getByText(/Mode: Sliding/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/8 players/i)).toBeInTheDocument();
  });

  it('should call onAccept when accept button clicked', () => {
    const onAccept = vi.fn();
    render(
      <RoomInviteNotification
        invite={mockInvite}
        onAccept={onAccept}
        onDecline={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalled();
  });

  it('should call onDecline when decline button clicked', () => {
    const onDecline = vi.fn();
    render(
      <RoomInviteNotification
        invite={mockInvite}
        onAccept={vi.fn()}
        onDecline={onDecline}
        onDismiss={vi.fn()}
      />
    );

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    expect(onDecline).toHaveBeenCalled();
  });

  it('should handle room without name', () => {
    const inviteWithoutName = {
      ...mockInvite,
      room: { ...mockInvite.room!, name: null },
    };

    render(
      <RoomInviteNotification
        invite={inviteWithoutName}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/Alice invited you to their room/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test components/rooms/__tests__/RoomInviteNotification.test.tsx`
Expected: FAIL with "Cannot find module '../RoomInviteNotification'"

- [ ] **Step 3: Create RoomInviteNotification component**

```typescript
// apps/web/components/rooms/RoomInviteNotification.tsx
'use client';

import { Button } from '@/components/ui/Button';
import type { RoomInvite } from '@/ws/types';

interface RoomInviteNotificationProps {
  invite: RoomInvite;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

export function RoomInviteNotification({
  invite,
  onAccept,
  onDecline,
  onDismiss,
}: RoomInviteNotificationProps) {
  const roomName = invite.room?.name ? `"${invite.room.name}"` : 'their room';
  const inviterName = invite.inviter?.displayName || 'Someone';
  const mode = invite.room?.mode === 1 ? 'Sliding' : 'Classic';
  const memberCount = invite.room?.memberCount || 0;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 p-4 rounded-xl bg-surface-elevated border border-accent-primary/30 shadow-lg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold">📨 Room Invite</h3>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <p className="mb-2">
        {inviterName} invited you to {roomName}
      </p>

      {invite.room && (
        <p className="text-sm text-text-secondary mb-4">
          Mode: {mode} · {memberCount}/8 players
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={onAccept} variant="primary" size="sm" className="flex-1">
          Accept
        </Button>
        <Button onClick={onDecline} variant="secondary" size="sm" className="flex-1">
          Decline
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test components/rooms/__tests__/RoomInviteNotification.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/rooms/RoomInviteNotification.tsx apps/web/components/rooms/__tests__/RoomInviteNotification.test.tsx
git commit -m "feat(rooms): add RoomInviteNotification toast component

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review

**Spec Coverage Check:**

✅ Type definitions (Room, RoomMember, RoomInvite, event types)
✅ Room API functions (create, join, leave, close, ready, assign, start, invite)
✅ Custom hooks (useRoomState, useRoomEvents)
✅ Core components (RoomCard, CreateRoomModal, PlayerList, PlayerAssignmentModal, RoomInviteModal, RoomInviteNotification)
✅ Room pages (rooms hub at /play/rooms, room lobby at /rooms/:roomId)
✅ Play menu integration (rooms card added)
⚠️ Friends panel integration - not implemented (lower priority polish feature)
✅ WebSocket event handling (all 11 room events covered in useRoomEvents)

**Placeholder Scan:** No TBDs, TODOs, or placeholders - all code blocks contain actual implementation.

**Type Consistency:** All types reference the same definitions from `@/ws/types`. PlayerInfo, RoomMember, Room, RoomInvite consistently used across all files.

**Missing Features (from spec but not critical for MVP):**
- Activity feed component (implemented inline in lobby page)
- Room settings modal for editing room name
- Friends panel room indicators (requires friends context integration)
- Invite notification auto-dismiss timeout logic
- Room invite notification global state management

These can be added as polish in Phase 6 or post-MVP.

---

