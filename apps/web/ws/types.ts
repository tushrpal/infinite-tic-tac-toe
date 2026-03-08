/**
 * WebSocket Type Definitions
 * All types used in WebSocket communication
 */

// ============================================
// Core Game Types (mirrored from server)
// ============================================

export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type GameMode = 'MODE_1' | 'MODE_2';
export type MatchStatus = 'waiting' | 'active' | 'completed' | 'abandoned';

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  position: Position;
  player: Player;
  timestamp: number;
  moveNumber: number;
  removedPosition?: Position; // For sliding rule
}

export interface WinInfo {
  winner: Player;
  winningCells: Position[];
  winType: 'row' | 'column' | 'diagonal' | 'anti-diagonal';
}

export interface GameState {
  board: CellValue[][];
  boardSize: number;
  currentPlayer: Player;
  moveHistory: Move[];
  isGameOver: boolean;
  winner: Player | null;
  winInfo: WinInfo | null;
  isDraw: boolean;
  mode: GameMode;
  moveCount: number;
  // Sliding rule state (Mode 2)
  slidingQueue?: {
    X: Position[];
    O: Position[];
  };
  cellAboutToBeRemoved?: Position | null;
}

export interface PlayerInfo {
  id: string;
  username: string;
  rating?: number;
  rank?: string;
  avatar?: string;
  isConnected: boolean;
}

export interface MatchResult {
  matchId: string;
  winner: Player | null;
  isDraw: boolean;
  winInfo: WinInfo | null;
  players: {
    X: PlayerInfo;
    O: PlayerInfo;
  };
  ratingChanges?: {
    X: number;
    O: number;
  };
  duration: number;
  moveCount: number;
  endReason: 'win' | 'draw' | 'forfeit' | 'disconnect' | 'timeout';
}

export interface MatchState {
  matchId: string;
  status: MatchStatus;
  mode: GameMode;
  players: {
    X: PlayerInfo | null;
    O: PlayerInfo | null;
  };
  gameState: GameState;
  spectatorCount: number;
  startedAt: number | null;
  turnTimeLimit?: number;
  turnStartedAt?: number;
}

// ============================================
// WebSocket Event Types
// ============================================

export type ClientEventType =
  | 'JOIN_QUEUE'
  | 'LEAVE_QUEUE'
  | 'JOIN_MATCH'
  | 'LEAVE_MATCH'
  | 'MAKE_MOVE'
  | 'FORFEIT'
  | 'REMATCH_REQUEST'
  | 'REMATCH_ACCEPT'
  | 'REMATCH_DECLINE'
  | 'SPECTATE_MATCH'
  | 'STOP_SPECTATING'
  | 'REQUEST_GAME_STATE'
  | 'PING';

export type ServerEventType =
  | 'QUEUE_JOINED'
  | 'QUEUE_LEFT'
  | 'QUEUE_STATUS'
  | 'MATCH_FOUND'
  | 'MATCH_JOINED'
  | 'GAME_STATE_UPDATE'
  | 'MOVE_ACCEPTED'
  | 'MOVE_REJECTED'
  | 'MATCH_END'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'REMATCH_REQUESTED'
  | 'REMATCH_STARTING'
  | 'REMATCH_DECLINED'
  | 'SPECTATOR_JOINED'
  | 'SPECTATOR_LEFT'
  | 'ERROR'
  | 'PONG';

// ============================================
// Client Events (sent to server)
// ============================================

export interface JoinQueueEvent {
  type: 'JOIN_QUEUE';
  payload: {
    playerId: string;
    username?: string;
    mode: GameMode;
    isRanked?: boolean;
  };
}

export interface LeaveQueueEvent {
  type: 'LEAVE_QUEUE';
  payload?: object;
}

export interface JoinMatchEvent {
  type: 'JOIN_MATCH';
  payload: {
    matchId: string;
    playerId?: string;
  };
}

export interface LeaveMatchEvent {
  type: 'LEAVE_MATCH';
  payload: {
    matchId: string;
  };
}

export interface MakeMoveEvent {
  type: 'MAKE_MOVE';
  payload: {
    position: Position;
    playerId?: string | null;
  };
}

export interface ForfeitEvent {
  type: 'FORFEIT';
  payload: {
    matchId: string;
  };
}
``
export interface RematchRequestEvent {
  type: 'REMATCH_REQUEST';
  payload: {
    matchId: string;
  };
}

export interface RematchAcceptEvent {
  type: 'REMATCH_ACCEPT';
  payload: {
    matchId: string;
  };
}

export interface RematchDeclineEvent {
  type: 'REMATCH_DECLINE';
  payload: {
    matchId: string;
  };
}

export interface SpectateMatchEvent {
  type: 'SPECTATE_MATCH';
  payload: {
    matchId: string;
  };
}

export interface StopSpectatingEvent {
  type: 'STOP_SPECTATING';
  payload: {
    matchId: string;
  };
}

export interface RequestGameStateEvent {
  type: 'REQUEST_GAME_STATE';
  payload: {
    matchId: string;
  };
}

export interface PingEvent {
  type: 'PING';
  payload: {
    timestamp: number;
  };
}

export type ClientEvent =
  | JoinQueueEvent
  | LeaveQueueEvent
  | JoinMatchEvent
  | LeaveMatchEvent
  | MakeMoveEvent
  | ForfeitEvent
  | RematchRequestEvent
  | RematchAcceptEvent
  | RematchDeclineEvent
  | SpectateMatchEvent
  | StopSpectatingEvent
  | RequestGameStateEvent
  | PingEvent;

// ============================================
// Server Events (received from server)
// ============================================

export interface QueueJoinedEvent {
  type: 'QUEUE_JOINED';
  payload: {
    mode: GameMode;
    ranked: boolean;
    position: number;
    estimatedWait: number;
  };
}

export interface QueueLeftEvent {
  type: 'QUEUE_LEFT';
  payload: object;
}

export interface QueueStatusEvent {
  type: 'QUEUE_STATUS';
  payload: {
    position: number;
    estimatedWait: number;
  };
}

export interface MatchFoundEvent {
  type: 'MATCH_FOUND';
  payload: {
    matchId: string;
    matchState: MatchState;
    opponent: { username: string };
    yourPlayer: Player;
  };
}

export interface MatchJoinedEvent {
  type: 'MATCH_JOINED';
  payload: {
    matchState: MatchState;
    yourPlayer: Player | null; // null if spectating
  };
}

export interface GameStateUpdateEvent {
  type: 'GAME_STATE_UPDATE';
  payload: {
    matchId: string;
    gameState: GameState;
    lastMove?: Move;
  };
}

export interface MoveAcceptedEvent {
  type: 'MOVE_ACCEPTED';
  payload: {
    matchId: string;
    move: Move;
  };
}

export interface MoveRejectedEvent {
  type: 'MOVE_REJECTED';
  payload: {
    matchId: string;
    reason: string;
    attemptedPosition: Position;
  };
}

export interface MatchEndEvent {
  type: 'MATCH_END';
  payload: {
    matchId: string;
    result: MatchResult;
    finalGameState: GameState;
  };
}

export interface PlayerDisconnectedEvent {
  type: 'PLAYER_DISCONNECTED';
  payload: {
    matchId: string;
    player: Player;
    reconnectTimeout: number;
  };
}

export interface PlayerReconnectedEvent {
  type: 'PLAYER_RECONNECTED';
  payload: {
    matchId: string;
    player: Player;
  };
}

export interface RematchRequestedEvent {
  type: 'REMATCH_REQUESTED';
  payload: {
    matchId: string;
    requestedBy: Player;
  };
}

export interface RematchStartingEvent {
  type: 'REMATCH_STARTING';
  payload: {
    oldMatchId: string;
    newMatchId: string;
    yourPlayer: Player;
    matchState: MatchState;
  };
}

export interface RematchDeclinedEvent {
  type: 'REMATCH_DECLINED';
  payload: {
    matchId: string;
    declinedBy: Player;
  };
}

export interface SpectatorJoinedEvent {
  type: 'SPECTATOR_JOINED';
  payload: {
    matchId: string;
    spectatorCount: number;
  };
}

export interface SpectatorLeftEvent {
  type: 'SPECTATOR_LEFT';
  payload: {
    matchId: string;
    spectatorCount: number;
  };
}

export interface ErrorEvent {
  type: 'ERROR';
  payload: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PongEvent {
  type: 'PONG';
  payload: {
    timestamp: number;
    serverTime: number;
  };
}

export type ServerEvent =
  | QueueJoinedEvent
  | QueueLeftEvent
  | QueueStatusEvent
  | MatchFoundEvent
  | MatchJoinedEvent
  | GameStateUpdateEvent
  | MoveAcceptedEvent
  | MoveRejectedEvent
  | MatchEndEvent
  | PlayerDisconnectedEvent
  | PlayerReconnectedEvent
  | RematchRequestedEvent
  | RematchStartingEvent
  | RematchDeclinedEvent
  | SpectatorJoinedEvent
  | SpectatorLeftEvent
  | ErrorEvent
  | PongEvent;

// ============================================
// Connection Types
// ============================================

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  latency: number;
  reconnectAttempts: number;
  lastConnectedAt: number | null;
  error: string | null;
}
