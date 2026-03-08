'use client';

/**
 * useWebSocket Hook
 * Manages WebSocket connection and provides reactive state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, GameSocket, type SocketConfig } from '@/ws/socket';
import type { ConnectionState, ServerEvent } from '@/ws/types';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  config?: Partial<SocketConfig>;
}

interface UseWebSocketReturn {
  socket: GameSocket;
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, config } = options;
  
  const socketRef = useRef<GameSocket>(getSocket(config));
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socketRef.current.getState()
  );

  // Subscribe to state changes
  useEffect(() => {
    const socket = socketRef.current;
    const unsubscribe = socket.onStateChange(setConnectionState);

    // Auto-connect if enabled
    if (autoConnect && connectionState.status === 'disconnected') {
      socket.connect();
    }

    return () => {
      unsubscribe();
    };
  }, [autoConnect]);

  const connect = useCallback(() => {
    socketRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    connectionState,
    isConnected: connectionState.status === 'connected',
    connect,
    disconnect,
  };
}

/**
 * useSocketEvent Hook
 * Subscribe to specific WebSocket events
 */
export function useSocketEvent<T extends ServerEvent['type']>(
  eventType: T,
  handler: (payload: Extract<ServerEvent, { type: T }>['payload']) => void,
  deps: React.DependencyList = []
): void {
  const socket = getSocket();

  useEffect(() => {
    const unsubscribe = socket.on(eventType, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

export default useWebSocket;
