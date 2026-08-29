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
  isBot?: boolean;
  botType?: 'random' | 'heuristic' | 'minimax';
  botDifficulty?: 'easy' | 'medium' | 'hard';
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
  isRanked: boolean;
  players: {
    X: PlayerInfo | null;
    O: PlayerInfo | null;
  };
  gameState: GameState;
  spectatorCount: number;
  startedAt: number | null;
  turnTimeLimit?: number;
  turnStartedAt?: number;
  isBotMatch?: boolean;
  botPlayer?: Player;
  botMultiplier?: number;
}

// ============================================
// WebSocket Event Types
// ============================================

export type ClientEventType =
  | 'JOIN_QUEUE'
  | 'LEAVE_QUEUE'
  | 'ACCEPT_BOT_MATCH'
  | 'DECLINE_BOT_MATCH'
  | 'CREATE_PRACTICE_MATCH'
  | 'JOIN_MATCH'
  | 'JOIN_AS_SPECTATOR'
  | 'LEAVE_MATCH'
  | 'MAKE_MOVE'
  | 'FORFEIT'
  | 'REMATCH_REQUEST'
  | 'REMATCH_ACCEPT'
  | 'REMATCH_DECLINE'
  | 'SPECTATE_MATCH'
  | 'STOP_SPECTATING'
  | 'REQUEST_GAME_STATE'
  | 'RECONNECT'
  | 'PING';

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

// ============================================
// Client Events (sent to server)
// ============================================

export interface JoinQueueEvent {
  type: 'JOIN_QUEUE';
  payload: {
    playerId: string;
    username?: string;
    rating?: number;
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

export interface JoinAsSpectatorEvent {
  type: 'JOIN_AS_SPECTATOR';
  payload: {
    matchId: string;
    spectatorId: string;
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

export interface ReconnectEvent {
  type: 'RECONNECT';
  payload: {
    playerId: string;
  };
}

export interface AcceptBotMatchEvent {
  type: 'ACCEPT_BOT_MATCH';
  payload?: object;
}

export interface DeclineBotMatchEvent {
  type: 'DECLINE_BOT_MATCH';
  payload?: object;
}

export interface CreatePracticeMatchEvent {
  type: 'CREATE_PRACTICE_MATCH';
  payload: {
    playerId: string;
    username?: string;
    mode: GameMode;
    botDifficulty: 'easy' | 'medium' | 'hard';
  };
}

export type ClientEvent =
  | JoinQueueEvent
  | LeaveQueueEvent
  | AcceptBotMatchEvent
  | DeclineBotMatchEvent
  | CreatePracticeMatchEvent
  | JoinMatchEvent
  | LeaveMatchEvent
  | MakeMoveEvent
  | ForfeitEvent
  | RematchRequestEvent
  | RematchAcceptEvent
  | RematchDeclineEvent
  | JoinAsSpectatorEvent
  | SpectateMatchEvent
  | StopSpectatingEvent
  | RequestGameStateEvent
  | ReconnectEvent
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

export interface BotMatchOfferEvent {
  type: 'BOT_MATCH_OFFER';
  payload: {
    botDifficulty: 'easy' | 'medium' | 'hard';
    botType: 'random' | 'heuristic' | 'minimax';
    waitedSeconds: number;
    offerCount: number;
  };
}

export interface MatchFoundEvent {
  type: 'MATCH_FOUND';
  payload: {
    matchId: string;
    matchState: MatchState;
    opponent: {
      username: string;
      isBot?: boolean;
      botDifficulty?: 'easy' | 'medium' | 'hard';
    };
    yourPlayer: Player;
    isBotMatch?: boolean;
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

export interface MoveUpdateEvent {
  type: 'MOVE_UPDATE';
  payload: {
    matchId: string;
    position: Position;
    player: Player;
    moveNumber: number;
    removedPosition?: Position;
    isGameOver: boolean;
    winner: Player | null;
    winInfo: WinInfo | null;
    isDraw: boolean;
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

export interface ReconnectedEvent {
  type: 'RECONNECTED';
  payload: {
    matchId: string;
    role: Player;
  };
}

export interface ChallengeReceivedEvent {
  type: 'CHALLENGE_RECEIVED';
  payload: {
    challengeId: string;
    challengerId: string;
    challengerUsername: string;
    challengerDisplayName: string;
    challengerRating: number;
    challengedId: string;
    challengedUsername: string;
    challengedDisplayName: string;
    challengedRating: number;
    mode: GameMode;
    expiresAt: string;
    createdAt: string;
  };
}

export interface ChallengeAcceptedEvent {
  type: 'CHALLENGE_ACCEPTED';
  payload: {
    challengeId: string;
    matchId: string;
  };
}

export interface ChallengeDeclinedEvent {
  type: 'CHALLENGE_DECLINED';
  payload: {
    challengeId: string;
  };
}

export interface ChallengeCancelledEvent {
  type: 'CHALLENGE_CANCELLED';
  payload: {
    challengeId: string;
  };
}

export interface ChallengeExpiredEvent {
  type: 'CHALLENGE_EXPIRED';
  payload: {
    challengeId: string;
  };
}

export interface PrivateMatchJoinedEvent {
  type: 'PRIVATE_MATCH_JOINED';
  payload: {
    matchId: string;
  };
}

export interface PrivateMatchExpiredEvent {
  type: 'PRIVATE_MATCH_EXPIRED';
  payload: {
    matchId: string;
  };
}

export interface FriendRequestReceivedEvent {
  type: 'FRIEND_REQUEST_RECEIVED';
  payload: {
    friendshipId: string;
    requesterId: string;
    requesterUsername: string;
    requesterDisplayName: string;
    requesterRating: number;
    addresseeId: string;
    addresseeUsername: string;
    addresseeDisplayName: string;
    addresseeRating: number;
    createdAt: string;
  };
}

export interface FriendRequestAcceptedEvent {
  type: 'FRIEND_REQUEST_ACCEPTED';
  payload: {
    friendshipId: string;
    friendId: string;
    friendUsername: string;
    friendDisplayName: string;
    friendRating: number;
    isOnline: boolean;
  };
}

export interface FriendRequestDeclinedEvent {
  type: 'FRIEND_REQUEST_DECLINED';
  payload: {
    friendshipId: string;
  };
}

export interface FriendRemovedEvent {
  type: 'FRIEND_REMOVED';
  payload: {
    friendshipId: string;
  };
}

export interface FriendOnlineEvent {
  type: 'FRIEND_ONLINE';
  payload: {
    playerId: string;
  };
}

export interface FriendOfflineEvent {
  type: 'FRIEND_OFFLINE';
  payload: {
    playerId: string;
  };
}

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
    mode: 1 | 2;
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
