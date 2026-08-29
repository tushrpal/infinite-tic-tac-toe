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
