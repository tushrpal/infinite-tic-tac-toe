/**
 * WebSocket Event Constants and Utilities
 */

import type {
  ClientEventType,
  ServerEventType,
  ClientEvent,
  ServerEvent,
} from './types';

// ============================================
// Event Type Constants
// ============================================

export const CLIENT_EVENTS: Record<ClientEventType, ClientEventType> = {
  JOIN_QUEUE: 'JOIN_QUEUE',
  LEAVE_QUEUE: 'LEAVE_QUEUE',
  JOIN_MATCH: 'JOIN_MATCH',
  JOIN_AS_SPECTATOR: 'JOIN_AS_SPECTATOR',
  LEAVE_MATCH: 'LEAVE_MATCH',
  MAKE_MOVE: 'MAKE_MOVE',
  FORFEIT: 'FORFEIT',
  REMATCH_REQUEST: 'REMATCH_REQUEST',
  REMATCH_ACCEPT: 'REMATCH_ACCEPT',
  REMATCH_DECLINE: 'REMATCH_DECLINE',
  SPECTATE_MATCH: 'SPECTATE_MATCH',
  STOP_SPECTATING: 'STOP_SPECTATING',
  REQUEST_GAME_STATE: 'REQUEST_GAME_STATE',
  RECONNECT: 'RECONNECT',
  PING: 'PING',
} as const;

export const SERVER_EVENTS: Record<ServerEventType, ServerEventType> = {
  QUEUE_JOINED: 'QUEUE_JOINED',
  QUEUE_LEFT: 'QUEUE_LEFT',
  QUEUE_STATUS: 'QUEUE_STATUS',
  MATCH_FOUND: 'MATCH_FOUND',
  MATCH_JOINED: 'MATCH_JOINED',
  GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
  MOVE_ACCEPTED: 'MOVE_ACCEPTED',
  MOVE_REJECTED: 'MOVE_REJECTED',
  MATCH_END: 'MATCH_END',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED',
  RECONNECTED: 'RECONNECTED',
  REMATCH_REQUESTED: 'REMATCH_REQUESTED',
  REMATCH_STARTING: 'REMATCH_STARTING',
  REMATCH_DECLINED: 'REMATCH_DECLINED',
  SPECTATOR_JOINED: 'SPECTATOR_JOINED',
  SPECTATOR_LEFT: 'SPECTATOR_LEFT',
  ERROR: 'ERROR',
  PONG: 'PONG',
} as const;

// ============================================
// Event Type Guards
// ============================================

export function isClientEvent(event: unknown): event is ClientEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as { type?: string };
  return typeof e.type === 'string' && e.type in CLIENT_EVENTS;
}

export function isServerEvent(event: unknown): event is ServerEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as { type?: string };
  return typeof e.type === 'string' && e.type in SERVER_EVENTS;
}

// ============================================
// Event Serialization
// ============================================

export function serializeEvent(event: ClientEvent): string {
  return JSON.stringify(event);
}

export function deserializeEvent(data: string): ServerEvent | null {
  try {
    const parsed = JSON.parse(data);
    if (isServerEvent(parsed)) {
      return parsed;
    }
    console.warn('Received unknown event type:', parsed);
    return null;
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
}

// ============================================
// Event Handlers Type
// ============================================

export type ServerEventHandler<T extends ServerEvent['type']> = (
  payload: Extract<ServerEvent, { type: T }>['payload']
) => void;

export type ServerEventHandlers = {
  [K in ServerEvent['type']]?: ServerEventHandler<K>;
};

// ============================================
// Event Subscription System
// ============================================

export class EventEmitter {
  private handlers: Map<string, Set<(payload: unknown) => void>> = new Map();

  on<T extends ServerEvent['type']>(
    eventType: T,
    handler: ServerEventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as (payload: unknown) => void);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as (payload: unknown) => void);
    };
  }

  off<T extends ServerEvent['type']>(
    eventType: T,
    handler: ServerEventHandler<T>
  ): void {
    this.handlers.get(eventType)?.delete(handler as (payload: unknown) => void);
  }

  emit(event: ServerEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event.payload);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}
