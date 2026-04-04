/**
 * WebSocket Client for Infinite Tic-Tac-Toe
 * Handles connection management, reconnection, and message handling
 */

import type {
  ClientEvent,
  ServerEvent,
  ConnectionStatus,
  ConnectionState,
  GameMode,
  Position,
} from './types';
import { EventEmitter, serializeEvent, deserializeEvent } from './events';
import { getStoredPlayerId } from '@/lib/player';

// ============================================
// Configuration
// ============================================

export interface SocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  reconnectDelayMax: number;
  pingInterval: number;
  pingTimeout: number;
  debug: boolean;
}

const defaultConfig: SocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  reconnectDelayMax: 30000,
  pingInterval: 30000,
  pingTimeout: 5000,
  debug: process.env.NODE_ENV === 'development',
};

function normalizeWsUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getWsUrlCandidates(preferredUrl: string): string[] {
  const candidates: string[] = [];
  const envWsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (envWsUrl) {
    candidates.push(normalizeWsUrl(envWsUrl));
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    candidates.push(normalizeWsUrl(`${protocol}//${window.location.host}`));

    if (process.env.NODE_ENV !== 'production') {
      candidates.push(normalizeWsUrl(`${protocol}//${window.location.hostname}:3000`));
      candidates.push('ws://localhost:3000');
    }
  } else {
    candidates.push(preferredUrl || 'ws://localhost:3000');
  }

  if (preferredUrl) {
    candidates.push(normalizeWsUrl(preferredUrl));
  }

  return unique(candidates);
}

// ============================================
// Socket Client
// ============================================

export class GameSocket {
  private ws: WebSocket | null = null;
  private config: SocketConfig;
  private wsUrlCandidates: string[];
  private wsUrlIndex = 0;
  private connectionState: ConnectionState;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private eventEmitter: EventEmitter;
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();
  private activeMatchId: string | null = null;

  constructor(config: Partial<SocketConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.wsUrlCandidates = getWsUrlCandidates(this.config.url);
    this.eventEmitter = new EventEmitter();
    this.connectionState = {
      status: 'disconnected',
      latency: 0,
      reconnectAttempts: 0,
      lastConnectedAt: null,
      error: null,
    };
  }

  // ============================================
  // Connection Management
  // ============================================

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.log('Connection already in progress');
      return;
    }

    this.updateState({ status: 'connecting', error: null });

    this.refreshWsCandidates();
    const wsUrl = this.currentWsUrl();
    this.log(`Connecting to ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      this.handleError('Connection failed', error);
    }
  }

  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateState({
      status: 'disconnected',
      reconnectAttempts: 0,
    });
  }

  private setupEventListeners(): void {
    if (!this.ws) return;
    const socket = this.ws;

    const isStaleSocket = () => this.ws !== socket;

    socket.onopen = () => {
      if (isStaleSocket()) return;
      this.log('Connected');
      this.wsUrlIndex = 0;
      const wasReconnecting = this.connectionState.reconnectAttempts > 0;
      this.updateState({
        status: 'connected',
        reconnectAttempts: 0,
        lastConnectedAt: Date.now(),
        error: null,
      });
      this.startPingInterval();

      // Auto-send RECONNECT if we were reconnecting and have an active match
      if (wasReconnecting) {
        this.attemptMatchReconnect();
      }
    };

    socket.onclose = (event) => {
      if (isStaleSocket()) return;
      this.log(`Disconnected: ${event.code} ${event.reason}`);
      this.clearTimers();
      
      if (event.code !== 1000) {
        this.attemptReconnect();
      } else {
        this.updateState({ status: 'disconnected' });
      }
    };

    socket.onerror = (event) => {
      if (isStaleSocket()) return;
      this.handleError('WebSocket error', event);
    };

    socket.onmessage = (event) => {
      if (isStaleSocket()) return;
      this.handleMessage(event.data);
    };
  }

  private attemptReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.reconnectAttempts) {
      this.updateState({
        status: 'error',
        error: 'Maximum reconnection attempts reached',
      });
      return;
    }

    const attempts = this.connectionState.reconnectAttempts + 1;
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, attempts - 1),
      this.config.reconnectDelayMax
    );

    this.log(`Reconnecting in ${delay}ms (attempt ${attempts})`);
    this.updateState({
      status: 'reconnecting',
      reconnectAttempts: attempts,
    });

    this.advanceWsUrl();

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private refreshWsCandidates(): void {
    this.wsUrlCandidates = getWsUrlCandidates(this.config.url);
    if (this.wsUrlIndex >= this.wsUrlCandidates.length) {
      this.wsUrlIndex = 0;
    }
  }

  private currentWsUrl(): string {
    return this.wsUrlCandidates[this.wsUrlIndex] ?? this.config.url;
  }

  private advanceWsUrl(): void {
    if (this.wsUrlCandidates.length <= 1) {
      return;
    }

    this.wsUrlIndex = (this.wsUrlIndex + 1) % this.wsUrlCandidates.length;
    this.log(`Switching WebSocket endpoint to ${this.currentWsUrl()}`);
  }

  // ============================================
  // Message Handling
  // ============================================

  private handleMessage(data: string): void {
    const event = deserializeEvent(data);
    
    if (!event) {
      this.log('Received invalid message:', data);
      return;
    }

    this.log('Received:', event.type, event.payload);

    // Handle PONG for latency calculation
    if (event.type === 'PONG') {
      this.handlePong(event.payload);
      return;
    }

    // Emit event to subscribers
    this.eventEmitter.emit(event);
  }

  // ============================================
  // Ping/Pong for Latency & Keep-Alive
  // ============================================

  private startPingInterval(): void {
    this.clearTimers();
    
    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);
  }

  private sendPing(): void {
    const timestamp = Date.now();
    
    this.send({
      type: 'PING',
      payload: { timestamp },
    });

    // Set timeout for pong response
    this.pongTimer = setTimeout(() => {
      this.log('Ping timeout - connection may be dead');
      this.ws?.close();
    }, this.config.pingTimeout);
  }

  private handlePong(payload: { timestamp: number; serverTime: number }): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }

    const latency = Date.now() - payload.timestamp;
    this.updateState({ latency });
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  // ============================================
  // Send Methods
  // ============================================

  send(event: ClientEvent): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[GameSocket] Cannot send - not connected. WebSocket state:', this.ws?.readyState);
      return false;
    }

    try {
      this.ws.send(serializeEvent(event));
      this.log('Sent:', event.type, event.payload);
      return true;
    } catch (error) {
      this.handleError('Send failed', error);
      return false;
    }
  }

  // ============================================
  // High-Level Game Actions
  // ============================================

  joinQueue(playerId: string, mode: GameMode, ranked: boolean = false, username?: string, rating?: number): boolean {
    return this.send({
      type: 'JOIN_QUEUE',
      payload: { playerId, username, rating, mode, isRanked: ranked },
    });
  }

  leaveQueue(): boolean {
    return this.send({ type: 'LEAVE_QUEUE' });
  }

  joinMatch(matchId: string, playerId?: string): boolean {
    return this.send({
      type: 'JOIN_MATCH',
      payload: { matchId, playerId },
    });
  }

  leaveMatch(matchId: string): boolean {
    return this.send({
      type: 'LEAVE_MATCH',
      payload: { matchId },
    });
  }

  makeMove(position: Position, playerId?: string): boolean {
    // Get playerId from localStorage if not provided
    const pid = playerId || getStoredPlayerId();
    console.log('[GameSocket] makeMove called', { position, playerId: pid?.slice(0, 12), wsState: this.ws?.readyState });
    return this.send({
      type: 'MAKE_MOVE',
      payload: { position, playerId: pid },
    });
  }

  forfeit(matchId: string): boolean {
    return this.send({
      type: 'FORFEIT',
      payload: { matchId },
    });
  }

  requestRematch(matchId: string): boolean {
    return this.send({
      type: 'REMATCH_REQUEST',
      payload: { matchId },
    });
  }

  acceptRematch(matchId: string): boolean {
    return this.send({
      type: 'REMATCH_ACCEPT',
      payload: { matchId },
    });
  }

  declineRematch(matchId: string): boolean {
    return this.send({
      type: 'REMATCH_DECLINE',
      payload: { matchId },
    });
  }

  spectateMatch(matchId: string): boolean {
    const spectatorId = getStoredPlayerId();
    if (!spectatorId) {
      this.log('Cannot spectate match without spectatorId');
      return false;
    }

    return this.send({
      type: 'JOIN_AS_SPECTATOR',
      payload: { matchId, spectatorId },
    });
  }

  stopSpectating(matchId: string): boolean {
    return this.send({
      type: 'STOP_SPECTATING',
      payload: { matchId },
    });
  }

  requestGameState(matchId: string): boolean {
    return this.send({
      type: 'REQUEST_GAME_STATE',
      payload: { matchId },
    });
  }

  // ============================================
  // Match Recovery & Reconnection
  // ============================================

  /**
   * Send RECONNECT event to server to rejoin an active match
   */
  reconnectToMatch(playerId: string): boolean {
    this.log('Sending RECONNECT for player', playerId.slice(0, 12));
    return this.send({
      type: 'RECONNECT',
      payload: { playerId },
    });
  }

  /**
   * Track the currently active match for auto-reconnection
   */
  setActiveMatch(matchId: string | null): void {
    this.activeMatchId = matchId;
  }

  getActiveMatch(): string | null {
    return this.activeMatchId;
  }

  /**
   * Automatically attempt to reconnect to an active match after WebSocket reconnection.
   * Called internally when the socket reconnects after a disconnect.
   */
  private attemptMatchReconnect(): void {
    const playerId = getStoredPlayerId();
    if (!playerId) return;

    // Always try to reconnect with playerId — server will find the match
    this.log('Auto-reconnecting to match for player', playerId.slice(0, 12));
    this.reconnectToMatch(playerId);
  }

  // ============================================
  // Event Subscription
  // ============================================

  on<T extends ServerEvent['type']>(
    eventType: T,
    handler: (payload: any) => void
  ): () => void {
    return this.eventEmitter.on(eventType, handler as any);
  }

  off<T extends ServerEvent['type']>(
    eventType: T,
    handler: (payload: any) => void
  ): void {
    this.eventEmitter.off(eventType, handler as any);
  }

  // ============================================
  // State Management
  // ============================================

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    // Immediately call with current state
    callback(this.connectionState);
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  getState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  private updateState(partial: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...partial };
    this.stateChangeCallbacks.forEach((cb) => cb(this.connectionState));
  }

  // ============================================
  // Error Handling & Logging
  // ============================================

  private handleError(message: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log(`Error: ${message}`, errorMessage);
    this.updateState({
      status: 'error',
      error: `${message}: ${errorMessage}`,
    });
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[GameSocket]', ...args);
    }
  }

  // ============================================
  // Pending Match Data (for page navigation)
  // ============================================
  
  private pendingMatchData: {
    matchId: string;
    yourPlayer: 'X' | 'O';
    matchState: any;
  } | null = null;

  setPendingMatch(data: { matchId: string; yourPlayer: 'X' | 'O'; matchState: any }) {
    this.pendingMatchData = data;
  }

  getPendingMatch(matchId: string): { matchId: string; yourPlayer: 'X' | 'O'; matchState: any } | null {
    if (this.pendingMatchData?.matchId === matchId) {
      const data = this.pendingMatchData;
      this.pendingMatchData = null; // Clear after retrieval
      return data;
    }
    return null;
  }
}

// ============================================
// Singleton Instance
// ============================================

let socketInstance: GameSocket | null = null;

export function getSocket(config?: Partial<SocketConfig>): GameSocket {
  if (!socketInstance) {
    socketInstance = new GameSocket(config);
  }
  return socketInstance;
}

export function resetSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
