/**
 * WebSocket Manager for Real-Time PvP Matchmaking
 * 
 * Handles:
 * - Matchmaking queue (JOIN_QUEUE, LEAVE_QUEUE, MATCH_FOUND)
 * - Real-time game events (MAKE_MOVE, GAME_STATE_UPDATE, MATCH_END)
 * - Player connections and disconnections
 * 
 * This is a thin orchestration layer - no game logic here.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { MatchResult as SharedMatchResult } from '@infinite-ttt/shared';
import {
  Modes,
  type Infinite3x3State,
  type ExpandingBoardState,
  getNextPlayer,
} from '@infinite-ttt/game-engine';
import { matchManager } from '../match/matchManager';
import type { MatchStorage } from '../storage/MatchStorage';
import { createMatchStorage } from '../storage/createMatchStorage';
import { getPrismaClient } from '../storage/prismaClient';
import {
  matchmakingService,
  type RankedMatchFoundEvent,
} from '../matchmaking/matchmakingService';
import { calculateEloChange, resolveKFactorByExperience, type MatchOutcome } from '../rating/elo';
import { botController } from '../bots/botController';
import { positionToIndex, indexToPosition } from '@infinite-ttt/bots';
import { getRedisClient } from '../storage/redisClient';

// ============================================
// Types
// ============================================

type Player = 'X' | 'O';
type GameMode = 'MODE_1' | 'MODE_2';

interface Position {
  row: number;
  col: number;
}

interface Move {
  position: Position;
  player: Player;
  timestamp: number;
  moveNumber: number;
  removedPosition?: Position;
}

interface WinInfo {
  winner: Player;
  winningCells: Position[];
  winType: 'row' | 'column' | 'diagonal' | 'anti-diagonal';
}

interface GameState {
  board: (Player | null)[][];
  boardSize: number;
  currentPlayer: Player;
  moveHistory: Move[];
  isGameOver: boolean;
  winner: Player | null;
  winInfo: WinInfo | null;
  isDraw: boolean;
  mode: GameMode;
  moveCount: number;
}

interface MatchState {
  matchId: string;
  status: 'waiting' | 'active' | 'completed';
  mode: GameMode;
  isRanked: boolean;
  players: {
    X: PlayerInfo | null;
    O: PlayerInfo | null;
  };
  gameState: GameState;
  spectators: string[];
  spectatorCount: number;
  startedAt: number | null;
  rematchRequestedBy?: Player | null;
  isBotMatch?: boolean;
  botPlayer?: Player;
  botMultiplier?: number;
}

interface PlayerInfo {
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

// Client -> Server events
type ClientEventType =
  | 'JOIN_QUEUE'
  | 'LEAVE_QUEUE'
  | 'JOIN_MATCH'
  | 'JOIN_AS_SPECTATOR'
  | 'SPECTATE_MATCH'
  | 'LEAVE_MATCH'
  | 'STOP_SPECTATING'
  | 'MAKE_MOVE'
  | 'FORFEIT'
  | 'REMATCH_REQUEST'
  | 'REMATCH_ACCEPT'
  | 'REMATCH_DECLINE'
  | 'RECONNECT'
  | 'ACCEPT_BOT_MATCH'
  | 'DECLINE_BOT_MATCH'
  | 'CREATE_PRACTICE_MATCH'
  | 'FRIEND_REQUEST'
  | 'CHALLENGE_CREATE'
  | 'CHALLENGE_RESPOND'
  | 'PING';

interface ClientEvent {
  type: ClientEventType;
  payload?: any;
}

// Server -> Client events
type ServerEventType =
  | 'QUEUE_JOINED'
  | 'QUEUE_LEFT'
  | 'QUEUE_STATUS'
  | 'MATCH_FOUND'
  | 'MATCH_JOINED'
  | 'BOT_MATCH_OFFER'
  | 'GAME_STATE_UPDATE'
  | 'MOVE_UPDATE'
  | 'SPECTATOR_JOINED'
  | 'SPECTATOR_LEFT'
  | 'MOVE_ACCEPTED'
  | 'MOVE_REJECTED'
  | 'MATCH_END'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'RECONNECTED'
  | 'REMATCH_REQUESTED'
  | 'REMATCH_STARTING'
  | 'REMATCH_DECLINED'
  | 'FRIEND_REQUEST_RECEIVED'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REQUEST_DECLINED'
  | 'FRIEND_REMOVED'
  | 'FRIEND_ONLINE'
  | 'FRIEND_OFFLINE'
  | 'CHALLENGE_RECEIVED'
  | 'CHALLENGE_ACCEPTED'
  | 'CHALLENGE_DECLINED'
  | 'CHALLENGE_CANCELLED'
  | 'CHALLENGE_EXPIRED'
  | 'PRIVATE_MATCH_JOINED'
  | 'PRIVATE_MATCH_EXPIRED'
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

interface ServerEvent {
  type: ServerEventType;
  payload?: any;
}

// Internal types
interface QueueEntry {
  playerId: string;
  username: string;
  mode: GameMode;
  isRanked: boolean;
  joinedAt: number;
  rating?: number;
}

type ClientRole = 'player' | 'spectator';

interface ConnectedClient {
  ws: WebSocket | null;
  playerId: string;
  username: string;
  matchId: string | null;
  inQueue: boolean;
  role: ClientRole;
}

// ============================================
// Engine State Types
// ============================================

type EngineState = Infinite3x3State | ExpandingBoardState;

// ============================================
// Engine Adapter Functions
//
// All game logic is delegated to @infinite-ttt/game-engine.
// These adapters bridge between the engine's state and the
// wire format (GameState) that clients expect.
// ============================================

function initEngineState(mode: GameMode): EngineState {
  if (mode === 'MODE_1') {
    return Modes.Infinite3x3.createInitialState();
  }
  return Modes.ExpandingBoard.createInitialState();
}

function isMode1(state: EngineState): state is Infinite3x3State {
  return 'playerMarks' in state;
}

function validateMove(engineState: EngineState, mode: GameMode, position: Position, player: Player): boolean {
  if (mode === 'MODE_1') {
    return Modes.Infinite3x3.isValidMove(engineState as Infinite3x3State, player, position);
  }
  return Modes.ExpandingBoard.isValidMove(engineState as ExpandingBoardState, player, position);
}

function executeMove(engineState: EngineState, mode: GameMode, player: Player, position: Position): EngineState {
  if (mode === 'MODE_1') {
    return Modes.Infinite3x3.applyMove(engineState as Infinite3x3State, player, position);
  }
  return Modes.ExpandingBoard.applyMove(engineState as ExpandingBoardState, player, position);
}

/**
 * Find which cells form the winning line on the board.
 * This is a UI enrichment helper, NOT game logic — the engine
 * has already authoritatively determined IF someone won.
 * This just locates WHERE for client display.
 */
function findWinningLine(board: (Player | null)[][]): WinInfo | null {
  const size = board.length;

  // Rows
  for (let r = 0; r < size; r++) {
    const cells = Array.from({ length: size }, (_, c) => ({ row: r, col: c }));
    if (board[r][0] && cells.every((c) => board[c.row][c.col] === board[r][0])) {
      return { winner: board[r][0]!, winningCells: cells, winType: 'row' };
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const cells = Array.from({ length: size }, (_, r) => ({ row: r, col: c }));
    if (board[0][c] && cells.every((pos) => board[pos.row][pos.col] === board[0][c])) {
      return { winner: board[0][c]!, winningCells: cells, winType: 'column' };
    }
  }

  // Diagonals
  const diag = Array.from({ length: size }, (_, i) => ({ row: i, col: i }));
  if (board[0][0] && diag.every((c) => board[c.row][c.col] === board[0][0])) {
    return { winner: board[0][0], winningCells: diag, winType: 'diagonal' };
  }

  const antiDiag = Array.from({ length: size }, (_, i) => ({ row: i, col: size - 1 - i }));
  if (board[0][size - 1] && antiDiag.every((c) => board[c.row][c.col] === board[0][size - 1])) {
    return { winner: board[0][size - 1]!, winningCells: antiDiag, winType: 'anti-diagonal' };
  }

  return null;
}

/**
 * Convert engine state to the wire GameState format that clients expect.
 */
function engineToWireState(engineState: EngineState, mode: GameMode): GameState {
  if (isMode1(engineState)) {
    const board = engineState.board.map((row) => [...row]) as (Player | null)[][];
    const currentPlayer = getNextPlayer(engineState.currentTurn);
    const isGameOver = engineState.winner !== null;
    const winInfo = engineState.winner ? findWinningLine(board) : null;

    // Derive removedPosition by comparing consecutive board snapshots
    const moveHistory: Move[] = engineState.moveHistory.map((m, i) => ({
      position: m.position,
      player: m.player,
      timestamp: Date.now(),
      moveNumber: i + 1,
    }));

    return {
      board,
      boardSize: 3,
      currentPlayer,
      moveHistory,
      isGameOver,
      winner: engineState.winner,
      winInfo,
      isDraw: false, // Mode 1 never draws due to sliding rule
      mode,
      moveCount: engineState.currentTurn,
    };
  }

  // Mode 2 (Expanding Board)
  const state = engineState as ExpandingBoardState;
  const board = state.board.map((row) => [...row]) as (Player | null)[][];
  const currentPlayer = getNextPlayer(state.currentTurn);
  const isDraw = !state.roundWinner && board.every((row) => row.every((cell) => cell !== null));
  const isGameOver = state.roundWinner !== null || isDraw;

  let winInfo: WinInfo | null = null;
  if (state.roundWinner && state.winningLine) {
    const winType = inferWinType(state.winningLine, state.boardSize);
    winInfo = { winner: state.roundWinner, winningCells: state.winningLine, winType };
  }

  const moveHistory: Move[] = state.moveHistory.map((m, i) => ({
    position: m.position,
    player: m.player,
    timestamp: Date.now(),
    moveNumber: i + 1,
  }));

  return {
    board,
    boardSize: state.boardSize,
    currentPlayer,
    moveHistory,
    isGameOver,
    winner: state.roundWinner,
    winInfo,
    isDraw,
    mode,
    moveCount: state.currentTurn,
  };
}

function inferWinType(cells: Position[], boardSize: number): 'row' | 'column' | 'diagonal' | 'anti-diagonal' {
  if (cells.every((c) => c.row === cells[0].row)) return 'row';
  if (cells.every((c) => c.col === cells[0].col)) return 'column';
  if (cells.every((c, i) => c.row === i && c.col === i)) return 'diagonal';
  return 'anti-diagonal';
}

// ============================================
// WebSocket Manager
// ============================================

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private readonly matchStorage: MatchStorage;
  private readonly matchManager = matchManager;
  private readonly matchmakingService = matchmakingService;
  
  // Connected clients by playerId
  private clients: Map<string, ConnectedClient> = new Map();
  
  // Authoritative engine state per match (source of truth for game logic)
  private engineStates: Map<string, EngineState> = new Map();
  
  // Matchmaking queues (by mode + ranked)
  private queues: Map<string, QueueEntry[]> = new Map();
  
  // Active matches
  private matches: Map<string, MatchState> = new Map();

  // Created-at timestamps for active matches (avoids DB read on every move persist)
  private matchCreatedAt: Map<string, number> = new Map();
  
  // Disconnect timeout timers (playerId -> timer)
  private disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  // Disconnect timeout duration (60 seconds)
  private readonly DISCONNECT_TIMEOUT = 60000;
  // Kept in step with the 30s bot-fallback window. This used to be 3000ms,
  // which polled Redis for both modes continuously even with an empty queue -
  // that alone burned through the Upstash free-tier monthly request quota
  // (500k) well before any real matchmaking traffic, causing every queue
  // join to fail with "max requests limit exceeded".
  private readonly MATCHMAKING_TICK_MS = 30000;
  private readonly DEFAULT_RATING = 200;
  private matchmakingTick: ReturnType<typeof setInterval> | null = null;
  
  // Match ID counter
  private matchCounter = 0;

  constructor(matchStorage: MatchStorage = createMatchStorage()) {
    this.matchStorage = matchStorage;
    this.matchmakingService.setMatchFoundHandler((event) => {
      this.handleRankedMatchFound(event);
    });
    this.matchmakingService.setBotOfferHandler((event) => {
      this.handleBotMatchOffer(event);
    });
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server });

    // Initialize queues
    this.queues.set('MODE_1_casual', []);
    this.queues.set('MODE_2_casual', []);

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 New WebSocket connection');

      // Generate temporary ID until client identifies
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      let clientId = tempId;

      ws.on('message', (data: Buffer) => {
        try {
          const event: ClientEvent = JSON.parse(data.toString());
          this.handleClientEvent(ws, clientId, event, (newId) => {
            clientId = newId;
          });
        } catch (error) {
          console.error('❌ Invalid message:', error);
          this.send(ws, { type: 'ERROR', payload: { message: 'Invalid message format' } });
        }
      });

      ws.on('close', () => {
        // Ensure cleanup completes before allowing next operations
        this.handleDisconnect(clientId).catch((err) => {
          console.error(`❌ Error during disconnect cleanup for ${clientId.slice(0, 8)}:`, err);
        });
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    void this.recoverActiveMatchesFromRedis();
    this.startMatchmakingProcessor();

    console.log('✅ WebSocket server initialized');
  }

  private startMatchmakingProcessor() {
    if (this.matchmakingTick) {
      clearInterval(this.matchmakingTick);
    }

    this.matchmakingTick = setInterval(() => {
      void this.matchmakingService.processQueue('MODE_1');
      void this.matchmakingService.processQueue('MODE_2');
    }, this.MATCHMAKING_TICK_MS);
  }

  private async recoverActiveMatchesFromRedis() {
    try {
      const activeMatches = await this.matchManager.getActiveMatches();

      for (const snapshot of activeMatches) {
        const matchId = snapshot.matchState.matchId;
        this.matches.set(matchId, snapshot.matchState as MatchState);
        this.engineStates.set(matchId, snapshot.engineState);
        this.matchCreatedAt.set(matchId, snapshot.createdAt);
      }

      if (activeMatches.length > 0) {
        console.log(`♻️ Recovered ${activeMatches.length} active match(es) from Redis`);
      }
    } catch (error) {
      console.error('❌ Failed to recover active matches from Redis', error);
    }
  }

  /**
   * Handle incoming client event
   */
  private handleClientEvent(
    ws: WebSocket,
    clientId: string,
    event: ClientEvent,
    setClientId: (id: string) => void
  ) {
    switch (event.type) {
      case 'JOIN_QUEUE':
        void this.handleJoinQueue(ws, event.payload, setClientId);
        break;

      case 'LEAVE_QUEUE':
        void this.handleLeaveQueue(clientId);
        break;

      case 'ACCEPT_BOT_MATCH':
        void this.handleAcceptBotMatch(clientId);
        break;

      case 'DECLINE_BOT_MATCH':
        void this.handleDeclineBotMatch(clientId);
        break;

      case 'CREATE_PRACTICE_MATCH':
        void this.handleCreatePracticeMatch(ws, event.payload, setClientId);
        break;

      case 'JOIN_MATCH':
        void this.handleJoinMatch(ws, event.payload, setClientId);
        break;

      case 'JOIN_AS_SPECTATOR':
        void this.handleJoinAsSpectator(ws, event.payload, setClientId);
        break;

      case 'SPECTATE_MATCH':
        void this.handleJoinAsSpectator(
          ws,
          {
            ...(event.payload || {}),
            spectatorId: event.payload?.spectatorId || clientId,
          },
          setClientId
        );
        break;

      case 'LEAVE_MATCH':
      case 'STOP_SPECTATING':
        this.handleLeaveMatch(clientId);
        break;

      case 'MAKE_MOVE':
        void this.handleMakeMove(clientId, event.payload, ws);
        break;

      case 'FORFEIT':
        void this.handleForfeit(clientId);
        break;

      case 'REMATCH_REQUEST':
        void this.handleRematchRequest(clientId, event.payload);
        break;

      case 'REMATCH_ACCEPT':
        void this.handleRematchAccept(clientId, event.payload);
        break;

      case 'REMATCH_DECLINE':
        void this.handleRematchDecline(clientId, event.payload);
        break;

      case 'RECONNECT':
        void this.handleReconnect(ws, event.payload, setClientId);
        break;

      case 'PING':
        this.send(ws, { type: 'PONG', payload: { timestamp: Date.now() } });
        break;

      case 'FRIEND_REQUEST':
        void this.handleFriendRequest(clientId, event.payload);
        break;

      case 'CHALLENGE_CREATE':
        void this.handleChallengeCreate(clientId, event.payload);
        break;

      case 'CHALLENGE_RESPOND':
        void this.handleChallengeRespond(clientId, event.payload);
        break;

      default:
        this.send(ws, { type: 'ERROR', payload: { message: `Unknown event type: ${event.type}` } });
    }
  }

  /**
   * Handle JOIN_QUEUE
   */
  private async handleJoinQueue(
    ws: WebSocket,
    payload: { playerId: string; username?: string; mode: GameMode; isRanked?: boolean; rating?: number },
    setClientId: (id: string) => void
  ): Promise<void> {
    const { playerId, username = 'Player', mode = 'MODE_1', isRanked = false } = payload;

    try {
      const playerProfile = await this.loadPlayerProfile(playerId, mode);
      if (!playerProfile) {
        this.send(ws, {
          type: 'ERROR',
          payload: { message: 'Player not found. Create a player before joining the queue.' },
        });
        return;
      }

      const resolvedUsername = playerProfile.displayName || playerProfile.username || username || 'Player';
      const resolvedRating = playerProfile.rating ?? this.DEFAULT_RATING;

      const existingClient = this.clients.get(playerId);
      if (existingClient?.matchId && existingClient.role === 'spectator') {
        await this.removeSpectatorFromMatch(existingClient.matchId, playerId, true);
      }

      // Register client
      setClientId(playerId);
      this.clients.set(playerId, {
        ws,
        playerId,
        username: resolvedUsername,
        matchId: null,
        inQueue: true,
        role: 'player',
      });

      // Update online status
      await this.updateOnlineStatus(playerId, true);

      if (isRanked) {
        const joined = await this.matchmakingService.joinQueue(playerId, mode, {
          rating: resolvedRating,
          username: resolvedUsername,
        });

        this.send(ws, {
          type: 'QUEUE_JOINED',
          payload: {
            position: joined.position,
            estimatedWait: joined.estimatedWait,
            mode,
            isRanked,
          },
        });

        const createdMatches = await this.matchmakingService.processQueue(mode);
        console.log(`📥 ${resolvedUsername} joined ${mode} ranked queue (${createdMatches} match(es) created)`);
        return;
      }

      const queueKey = `${mode}_casual`;
      const queue = this.queues.get(queueKey) || [];

      const existingIndex = queue.findIndex((e) => e.playerId === playerId);
      if (existingIndex !== -1) {
        queue.splice(existingIndex, 1);
      }

      const entry: QueueEntry = {
        playerId,
        username: resolvedUsername,
        mode,
        isRanked,
        joinedAt: Date.now(),
        rating: resolvedRating,
      };

      queue.push(entry);
      this.queues.set(queueKey, queue);

      console.log(`📥 ${resolvedUsername} joined ${queueKey} queue (${queue.length} in queue)`);

      this.send(ws, {
        type: 'QUEUE_JOINED',
        payload: {
          position: queue.length,
          estimatedWait: queue.length > 1 ? 0 : 30000,
          mode,
          isRanked,
        },
      });

      this.tryMatch(queueKey);
    } catch (error) {
      console.error('❌ Failed to join queue', error);
      this.send(ws, {
        type: 'ERROR',
        payload: { message: 'Failed to join queue. Please try again.' },
      });
    }
  }

  /**
   * Handle LEAVE_QUEUE
   */
  private async handleLeaveQueue(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client) {
      await this.matchmakingService.leaveQueue(playerId);
      return;
    }

    // Remove from in-memory casual queues
    for (const [queueKey, queue] of this.queues.entries()) {
      const index = queue.findIndex((e) => e.playerId === playerId);
      if (index !== -1) {
        queue.splice(index, 1);
        console.log(`📤 Player ${playerId.slice(0, 8)} left ${queueKey} queue`);
      }
    }

    await this.matchmakingService.leaveQueue(playerId);

    client.inQueue = false;
    if (client.ws) {
      this.send(client.ws, { type: 'QUEUE_LEFT', payload: {} });
    }
  }

  /**
   * Handle player accepting a bot match offer
   */
  private async handleAcceptBotMatch(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client?.ws) {
      return;
    }

    try {
      console.log(`✅ Player ${playerId.slice(0, 8)} accepted bot match offer`);
      await this.matchmakingService.acceptBotMatchOffer(playerId);
      // Match creation triggers the normal MATCH_FOUND flow
    } catch (error) {
      console.error('❌ Failed to accept bot match', error);
      this.send(client.ws, {
        type: 'ERROR',
        payload: { message: 'Failed to create bot match. Please try again.' },
      });
    }
  }

  /**
   * Handle player declining a bot match offer
   */
  private async handleDeclineBotMatch(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client?.ws) {
      return;
    }

    console.log(`⏳ Player ${playerId.slice(0, 8)} declined bot match offer, continuing to wait`);
    // Player stays in queue, will get another offer in 30s
    // No action needed - they just dismiss the modal
  }

  /**
   * Handle CREATE_PRACTICE_MATCH
   * Creates an instant unranked bot match with chosen difficulty
   */
  private async handleCreatePracticeMatch(
    ws: WebSocket,
    payload: { playerId: string; username?: string; mode: GameMode; botDifficulty: 'easy' | 'medium' | 'hard' },
    setClientId: (id: string) => void
  ): Promise<void> {
    const { playerId, username = 'Player', mode = 'MODE_1', botDifficulty = 'medium' } = payload;

    try {
      const playerProfile = await this.loadPlayerProfile(playerId, mode);
      if (!playerProfile) {
        this.send(ws, {
          type: 'ERROR',
          payload: { message: 'Player not found. Create a player before starting practice mode.' },
        });
        return;
      }

      const resolvedUsername = playerProfile.displayName || playerProfile.username || username || 'Player';
      const resolvedRating = playerProfile.rating ?? this.DEFAULT_RATING;

      const existingClient = this.clients.get(playerId);
      if (existingClient?.matchId && existingClient.role === 'spectator') {
        await this.removeSpectatorFromMatch(existingClient.matchId, playerId, true);
      }

      // Register client
      setClientId(playerId);
      this.clients.set(playerId, {
        ws,
        playerId,
        username: resolvedUsername,
        matchId: null,
        inQueue: false,
        role: 'player',
      });

      // Map difficulty to bot type
      const botTypeMap: Record<'easy' | 'medium' | 'hard', 'random' | 'heuristic' | 'minimax'> = {
        easy: 'random',
        medium: 'heuristic',
        hard: 'minimax',
      };
      const botType = botTypeMap[botDifficulty];

      // Create instant unranked bot match
      const matchId = `match_practice_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const initialEngineState = initEngineState(mode);

      // Player is always X, bot is always O
      const xInfo: PlayerInfo = {
        id: playerId,
        username: resolvedUsername,
        rating: resolvedRating,
        isConnected: true,
      };

      const botId = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const botDisplayName = this.getBotDisplayName(botType, botDifficulty);

      const oInfo: PlayerInfo = {
        id: botId,
        username: botDisplayName,
        rating: resolvedRating, // Bot matches player rating
        isConnected: true,
        isBot: true,
        botType: botType,
        botDifficulty: botDifficulty,
      };

      const matchState: MatchState = {
        matchId,
        status: 'active',
        mode,
        isRanked: false, // Practice matches are UNRANKED
        players: {
          X: xInfo,
          O: oInfo,
        },
        gameState: engineToWireState(initialEngineState, mode),
        spectators: [],
        spectatorCount: 0,
        startedAt: Date.now(),
        isBotMatch: true,
        botPlayer: 'O',
        // No botMultiplier since it's unranked - ratings won't change anyway
      };

      this.matches.set(matchId, matchState);
      this.engineStates.set(matchId, initialEngineState);
      const snapshot = await this.matchManager.createMatch(matchState, initialEngineState);
      this.matchCreatedAt.set(matchId, snapshot.createdAt);

      // Register bot instance with bot controller
      const botInstance = this.createBotInstance(botType, botDifficulty);
      botController.registerBot(matchId, botInstance);

      // Update client state
      const client = this.clients.get(playerId);
      if (client) {
        client.matchId = matchId;
        client.inQueue = false;
      }

      console.log(`🎮 Practice match created: ${matchId.slice(0, 16)} (${botDifficulty} bot)`);
      console.log(`   X: ${resolvedUsername} vs O: ${botDisplayName}`);

      // Send MATCH_FOUND to player
      this.send(ws, {
        type: 'MATCH_FOUND',
        payload: {
          matchId,
          yourPlayer: 'X',
          opponent: {
            username: botDisplayName,
            isBot: true,
            botDifficulty: botDifficulty,
          },
          matchState,
          isBotMatch: true,
        },
      });
    } catch (error) {
      console.error('❌ Failed to create practice match', error);
      this.send(ws, {
        type: 'ERROR',
        payload: { message: 'Failed to create practice match. Please try again.' },
      });
    }
  }

  /**
   * Get bot display name based on type and difficulty
   */
  private getBotDisplayName(botType: 'random' | 'heuristic' | 'minimax', difficulty: 'easy' | 'medium' | 'hard'): string {
    const nameMap = {
      random: 'Random Bot',
      heuristic: 'Tactical Bot',
      minimax: 'Strategic Bot',
    };
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return `${nameMap[botType]} (${difficultyLabel})`;
  }

  /**
   * Create bot instance based on type and difficulty
   */
  private createBotInstance(botType: 'random' | 'heuristic' | 'minimax', difficulty: 'easy' | 'medium' | 'hard'): any {
    // Import bot classes
    const { RandomBot, HeuristicBot, MinimaxBot } = require('@infinite-ttt/bots');

    switch (botType) {
      case 'random':
        return new RandomBot();
      case 'heuristic':
        return new HeuristicBot();
      case 'minimax':
        return new MinimaxBot();
      default:
        return new RandomBot();
    }
  }

  /**
   * Try to match players in a queue
   */
  private tryMatch(queueKey: string) {
    const queue = this.queues.get(queueKey);
    if (!queue || queue.length < 2) return;

    if (queueKey.includes('ranked')) {
      return;
    }

    // Match first two players
    const player1 = queue.shift()!;
    const player2 = queue.shift()!;

    // Create match
    const matchId = `match_${++this.matchCounter}_${Date.now()}`;
    const mode = player1.mode;

    // Randomly assign X/O
    const [playerX, playerO] = Math.random() < 0.5 ? [player1, player2] : [player2, player1];

    const initialEngineState = initEngineState(mode);
    const matchState: MatchState = {
      matchId,
      status: 'active',
      mode,
      isRanked: player1.isRanked,
      players: {
        X: { id: playerX.playerId, username: playerX.username, rating: playerX.rating, isConnected: true },
        O: { id: playerO.playerId, username: playerO.username, rating: playerO.rating, isConnected: true },
      },
      gameState: engineToWireState(initialEngineState, mode),
      spectators: [],
      spectatorCount: 0,
      startedAt: Date.now(),
    };

    this.matches.set(matchId, matchState);
    this.engineStates.set(matchId, initialEngineState);
    void this.matchManager.createMatch(matchState, initialEngineState).then((snapshot) => {
      this.matchCreatedAt.set(matchId, snapshot.createdAt);
    });

    // Update client states
    const clientX = this.clients.get(playerX.playerId);
    const clientO = this.clients.get(playerO.playerId);

    if (clientX) {
      clientX.matchId = matchId;
      clientX.inQueue = false;
    }
    if (clientO) {
      clientO.matchId = matchId;
      clientO.inQueue = false;
    }

    console.log(`🎮 Match created: ${matchId.slice(0, 16)}`);
    console.log(`   X: ${playerX.username} vs O: ${playerO.username}`);

    // Notify both players
    if (clientX?.ws) {
      this.send(clientX.ws, {
        type: 'MATCH_FOUND',
        payload: {
          matchId,
          yourPlayer: 'X',
          opponent: {
            username: playerO.username,
            isBot: matchState.players.O?.isBot,
            botDifficulty: matchState.players.O?.botDifficulty,
          },
          matchState,
          isBotMatch: matchState.isBotMatch,
        },
      });
    }

    if (clientO?.ws) {
      this.send(clientO.ws, {
        type: 'MATCH_FOUND',
        payload: {
          matchId,
          yourPlayer: 'O',
          opponent: {
            username: playerX.username,
            isBot: matchState.players.X?.isBot,
            botDifficulty: matchState.players.X?.botDifficulty,
          },
          matchState,
          isBotMatch: matchState.isBotMatch,
        },
      });
    }
  }

  private handleRankedMatchFound(event: RankedMatchFoundEvent) {
    const { matchId, matchState, engineState, playerX, playerO } = event;

    // Store match state with all properties (including bot flags)
    this.matches.set(matchId, matchState);
    this.engineStates.set(matchId, engineState);
    this.matchCreatedAt.set(matchId, matchState.startedAt ?? Date.now());

    console.log(`🎮 Ranked match found: ${matchId.slice(0, 16)}`);
    console.log(`   isBotMatch: ${matchState.isBotMatch}, botPlayer: ${matchState.botPlayer}`);

    const clientX = this.clients.get(playerX.playerId);
    const clientO = this.clients.get(playerO.playerId);

    if (clientX) {
      clientX.matchId = matchId;
      clientX.inQueue = false;
    }

    if (clientO) {
      clientO.matchId = matchId;
      clientO.inQueue = false;
    }

    if (clientX?.ws) {
      this.send(clientX.ws, {
        type: 'MATCH_FOUND',
        payload: {
          matchId,
          yourPlayer: 'X',
          opponent: {
            username: playerO.username,
            isBot: matchState.players.O?.isBot,
            botDifficulty: matchState.players.O?.botDifficulty,
          },
          matchState,
          isBotMatch: matchState.isBotMatch,
        },
      });
    }

    if (clientO?.ws) {
      this.send(clientO.ws, {
        type: 'MATCH_FOUND',
        payload: {
          matchId,
          yourPlayer: 'O',
          opponent: {
            username: playerX.username,
            isBot: matchState.players.X?.isBot,
            botDifficulty: matchState.players.X?.botDifficulty,
          },
          matchState,
          isBotMatch: matchState.isBotMatch,
        },
      });
    }

    console.log(`🏆 Ranked match created: ${matchId.slice(0, 16)}`);
    console.log(`   X: ${playerX.username} (${playerX.rating}) vs O: ${playerO.username} (${playerO.rating})`);
  }

  /**
   * Handle bot match offer event from matchmaking service
   * Sends offer modal to player who's been waiting 30s+
   */
  private handleBotMatchOffer(event: {
    playerId: string;
    mode: GameMode;
    botDifficulty: 'easy' | 'medium' | 'hard';
    botType: 'random' | 'heuristic' | 'minimax';
    waitedMs: number;
    offerCount: number;
  }) {
    const client = this.clients.get(event.playerId);

    // Check if client exists, has active WebSocket, is in queue, and socket is open
    if (!client?.ws || !client.inQueue || client.ws.readyState !== WebSocket.OPEN) {
      console.log(`⏭️  Skipping bot offer #${event.offerCount} for ${event.playerId.slice(0, 8)} - client disconnected or not in queue`);
      return;
    }

    console.log(`🤖 Sending bot offer #${event.offerCount} to ${event.playerId.slice(0, 8)} (${event.botDifficulty})`);

    this.send(client.ws, {
      type: 'BOT_MATCH_OFFER',
      payload: {
        botDifficulty: event.botDifficulty,
        botType: event.botType,
        waitedSeconds: Math.round(event.waitedMs / 1000),
        offerCount: event.offerCount,
      },
    });
  }

  /**
   * Handle JOIN_MATCH (for reconnection)
   */
  private async handleJoinMatch(
    ws: WebSocket,
    payload: { matchId: string; playerId?: string },
    setClientId: (id: string) => void
  ) {
    const { matchId, playerId } = payload;

    // Check in-memory state first (fresher than Redis for new matches)
    let match = this.matches.get(matchId);
    let engineState = this.engineStates.get(matchId);

    // Only recover from Redis if not in memory
    if (!match || !engineState) {
      const recovered = await this.matchManager.recoverMatch(matchId);
      match = recovered?.matchState;
      engineState = recovered?.engineState;
      if (recovered) {
        this.matchCreatedAt.set(matchId, recovered.createdAt);
      }
    }

    if (!match || !engineState) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Match not found' } });
      return;
    }

    if (!this.matchCreatedAt.has(matchId)) {
      this.matchCreatedAt.set(matchId, match.startedAt ?? Date.now());
    }

    this.matches.set(matchId, match);
    this.engineStates.set(matchId, engineState);

    if (!playerId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Player ID required' } });
      return;
    }

    // Find which player this is
    let yourPlayer: Player | null = null;
    let wasDisconnected = false;
    
    if (match.players.X?.id === playerId) {
      yourPlayer = 'X';
      wasDisconnected = !match.players.X.isConnected;
      match.players.X.isConnected = true;
    } else if (match.players.O?.id === playerId) {
      yourPlayer = 'O';
      wasDisconnected = !match.players.O.isConnected;
      match.players.O.isConnected = true;
    }

    if (!yourPlayer) {
      this.send(ws, { type: 'ERROR', payload: { message: 'You are not in this match' } });
      return;
    }

    // Register/update client with actual playerId
    setClientId(playerId);
    let client = this.clients.get(playerId);
    if (client) {
      if (client.matchId && client.role === 'spectator' && client.matchId !== matchId) {
        await this.removeSpectatorFromMatch(client.matchId, playerId, true);
      }
      client.ws = ws;
      client.matchId = matchId;
      client.role = 'player';
    } else {
      // New client registration
      this.clients.set(playerId, {
        ws,
        playerId,
        username: match.players[yourPlayer]?.username || 'Player',
        matchId,
        inQueue: false,
        role: 'player',
      });
    }

    // Clear any disconnect timer since player is back
    this.clearDisconnectTimer(playerId);
    await this.matchManager.saveMatchState(match, engineState);

    console.log(`🔗 ${yourPlayer} (${playerId.slice(0, 12)}) joined match ${matchId.slice(0, 16)}`);

    // Send current state
    this.send(ws, {
      type: 'MATCH_JOINED',
      payload: {
        matchState: match,
        yourPlayer,
      },
    });

    // Only notify opponent of reconnection if they were actually disconnected
    if (wasDisconnected) {
      this.broadcastToMatch(matchId, {
        type: 'PLAYER_RECONNECTED',
        payload: { matchId, player: yourPlayer },
      }, playerId);
      console.log(`🔄 ${yourPlayer} reconnected to match ${matchId.slice(0, 16)}`);
    }
  }

  /**
   * Handle JOIN_AS_SPECTATOR
   */
  private async handleJoinAsSpectator(
    ws: WebSocket,
    payload: { matchId?: string; spectatorId?: string } = {},
    setClientId: (id: string) => void
  ) {
    const { matchId, spectatorId } = payload;

    if (!matchId || !spectatorId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'matchId and spectatorId are required' } });
      return;
    }

    const recovered = await this.matchManager.recoverMatch(matchId);
    if (!recovered) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Match not found' } });
      return;
    }

    const isPlayerInMatch = recovered.matchState.players.X?.id === spectatorId
      || recovered.matchState.players.O?.id === spectatorId;

    if (isPlayerInMatch) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Players must join using JOIN_MATCH' } });
      return;
    }

    const existingClient = this.clients.get(spectatorId);
    if (existingClient?.matchId && existingClient.role === 'player' && existingClient.matchId !== matchId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Players in a live match cannot spectate another match' } });
      return;
    }

    if (existingClient?.inQueue) {
      await this.handleLeaveQueue(spectatorId);
    }

    if (existingClient?.matchId && existingClient.role === 'spectator' && existingClient.matchId !== matchId) {
      await this.removeSpectatorFromMatch(existingClient.matchId, spectatorId, true);
    }

    const updatedSnapshot = await this.matchManager.addSpectator(matchId, spectatorId);
    if (!updatedSnapshot) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Match not found' } });
      return;
    }

    const match = updatedSnapshot.matchState as MatchState;
    const engineState = updatedSnapshot.engineState;

    this.matches.set(matchId, match);
    this.engineStates.set(matchId, engineState);

    setClientId(spectatorId);
    this.clients.set(spectatorId, {
      ws,
      playerId: spectatorId,
      username: existingClient?.username || `spectator_${spectatorId.slice(0, 8)}`,
      matchId,
      inQueue: false,
      role: 'spectator',
    });

    this.send(ws, {
      type: 'MATCH_JOINED',
      payload: {
        matchState: match,
        yourPlayer: null,
      },
    });

    this.send(ws, {
      type: 'GAME_STATE_UPDATE',
      payload: {
        matchId,
        gameState: match.gameState,
      },
    });

    this.broadcastToMatch(matchId, {
      type: 'SPECTATOR_JOINED',
      payload: {
        matchId,
        spectatorCount: match.spectatorCount,
      },
    }, spectatorId);

    console.log(`👀 Spectator ${spectatorId.slice(0, 12)} joined match ${matchId.slice(0, 16)}`);
  }

  private async removeSpectatorFromMatch(matchId: string, spectatorId: string, notify: boolean) {
    const updatedSnapshot = await this.matchManager.removeSpectator(matchId, spectatorId);
    if (!updatedSnapshot) return;

    const match = updatedSnapshot.matchState as MatchState;
    const engineState = updatedSnapshot.engineState;

    this.matches.set(matchId, match);
    this.engineStates.set(matchId, engineState);

    if (notify) {
      this.broadcastToMatch(matchId, {
        type: 'SPECTATOR_LEFT',
        payload: {
          matchId,
          spectatorCount: match.spectatorCount,
        },
      }, spectatorId);
    }
  }

  /**
   * Handle LEAVE_MATCH
   */
  private handleLeaveMatch(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client?.matchId) return;

    if (client.role === 'spectator') {
      const matchId = client.matchId;
      void this.removeSpectatorFromMatch(matchId, clientId, true);
      client.matchId = null;
      return;
    }

    const match = this.matches.get(client.matchId);
    if (!match) return;

    // Mark as disconnected
    if (match.players.X?.id === clientId) {
      match.players.X.isConnected = false;
    } else if (match.players.O?.id === clientId) {
      match.players.O.isConnected = false;
    }

    const engineState = this.engineStates.get(client.matchId);
    if (engineState) {
      void this.matchManager.saveMatchState(match, engineState);
    }

    client.matchId = null;
  }

  /**
   * Handle MAKE_MOVE
   *
   * OPTIMIZED for low latency:
   * - Uses in-memory state (no Redis read)
   * - Broadcasts immediately
   * - Persists asynchronously
   * - Sends delta updates instead of full state
   */
  private async handleMakeMove(connectionId: string, payload: { position: Position; playerId?: string }, ws: WebSocket) {
    const client = this.clients.get(connectionId);
    if (!client?.matchId) {
      console.log(`❌ Client ${connectionId.slice(0, 12)} not in a match. Known clients:`,
        [...this.clients.keys()].map((k) => k.slice(0, 12)));
      this.send(ws, { type: 'MOVE_REJECTED', payload: { reason: 'Not in a match' } });
      return;
    }

    if (client.role !== 'player') {
      this.send(ws, { type: 'MOVE_REJECTED', payload: { reason: 'Spectators cannot make moves' } });
      return;
    }

    const playerId = client.playerId;
    console.log(`🎯 MAKE_MOVE from ${playerId.slice(0, 12)} (conn: ${connectionId.slice(0, 12)})`, payload.position);

    if (payload.playerId && payload.playerId !== playerId) {
      console.warn(`⚠️ Ignoring spoofed playerId ${payload.playerId.slice(0, 12)} from ${connectionId.slice(0, 12)}`);
    }

    const activeWs = ws;
    const matchId = client.matchId;

    // OPTIMIZATION 1: Use in-memory state first, only recover from Redis if missing
    let match = this.matches.get(matchId);
    let engineState = this.engineStates.get(matchId);

    if (!match || !engineState) {
      // Fallback to Redis recovery if not in memory
      const recovered = await this.matchManager.recoverMatch(matchId);
      match = recovered?.matchState as MatchState | undefined;
      engineState = recovered?.engineState;

      if (!match || !engineState) {
        this.send(activeWs, { type: 'MOVE_REJECTED', payload: { reason: 'Match not found' } });
        return;
      }

      // Cache for next time
      this.matches.set(matchId, match);
      this.engineStates.set(matchId, engineState);
    }

    // Determine which player this is
    let player: Player | null = null;
    if (match.players.X?.id === playerId) player = 'X';
    else if (match.players.O?.id === playerId) player = 'O';

    if (!player) {
      console.log(`❌ ${playerId.slice(0, 12)} not a player. X=${match.players.X?.id?.slice(0,12)}, O=${match.players.O?.id?.slice(0,12)}`);
      this.send(activeWs, { type: 'MOVE_REJECTED', payload: { reason: 'Not a player in this match' } });
      return;
    }

    // Validate move via engine
    if (!validateMove(engineState, match.mode, payload.position, player)) {
      const currentPlayer = getNextPlayer(
        isMode1(engineState) ? engineState.currentTurn : (engineState as ExpandingBoardState).currentTurn
      );
      this.send(activeWs, {
        type: 'MOVE_REJECTED',
        payload: {
          reason: currentPlayer !== player
            ? 'Not your turn'
            : 'Invalid move position',
          matchId,
        },
      });
      return;
    }

    // Store old state for delta calculation
    const oldEngineState = engineState;
    const oldMoveCount = isMode1(engineState) ? engineState.currentTurn : (engineState as ExpandingBoardState).currentTurn;

    // Apply move via engine (single source of truth)
    const newEngineState = executeMove(engineState, match.mode, player, payload.position);

    // Calculate removed position for Mode 1 (sliding window)
    let removedPosition: Position | undefined;
    if (isMode1(newEngineState) && isMode1(oldEngineState)) {
      const oldMarks = oldEngineState.playerMarks[player];
      const newMarks = newEngineState.playerMarks[player];

      if (oldMarks.length === 3 && newMarks.length === 3) {
        // Find the position that was removed
        const removed = oldMarks.find(pos =>
          !newMarks.some(newPos => newPos.position.row === pos.position.row && newPos.position.col === pos.position.col)
        );
        removedPosition = removed?.position;
      }
    }

    // Update in-memory state
    this.engineStates.set(matchId, newEngineState);
    match.gameState = engineToWireState(newEngineState, match.mode);

    console.log(`🎯 ${player} played at (${payload.position.row},${payload.position.col}) in match ${matchId.slice(0, 12)}`);

    // Send move accepted to player who made the move
    this.send(activeWs, {
      type: 'MOVE_ACCEPTED',
      payload: { matchId, position: payload.position },
    });

    // OPTIMIZATION 2 & 3: Broadcast delta update immediately (before persistence)
    this.broadcastToMatch(matchId, {
      type: 'MOVE_UPDATE',
      payload: {
        matchId,
        position: payload.position,
        player,
        moveNumber: isMode1(newEngineState) ? newEngineState.currentTurn : (newEngineState as ExpandingBoardState).currentTurn,
        removedPosition,
        isGameOver: match.gameState.isGameOver,
        winner: match.gameState.winner,
        winInfo: match.gameState.winInfo,
        isDraw: match.gameState.isDraw,
      },
    });

    // OPTIMIZATION 2: Persist asynchronously (don't block on Redis write)
    this.matchManager.applyMove(
      matchId,
      { matchState: match, engineState: newEngineState },
      this.matchCreatedAt.get(matchId) ?? match.startedAt ?? Date.now(),
    )
      .catch(err => {
        console.error(`❌ Failed to persist move for match ${matchId.slice(0, 12)}:`, err);
        // TODO: Could implement retry logic or alert monitoring here
      });

    // Check if game ended
    if (match.gameState.isGameOver) {
      const endReason = match.gameState.isDraw ? 'draw' : 'win';
      console.log(`🏁 Player move ended game: winner=${match.gameState.winner}, isDraw=${match.gameState.isDraw}`);
      await this.finalizeMatch(match, match.gameState.winner, endReason);
    } else if (match.isBotMatch && match.botPlayer) {
      // If it's a bot match and game is not over, check if it's bot's turn
      const currentPlayer = getNextPlayer(
        isMode1(newEngineState) ? newEngineState.currentTurn : (newEngineState as ExpandingBoardState).currentTurn
      );

      console.log(`🤖 Bot match check: currentPlayer=${currentPlayer}, botPlayer=${match.botPlayer}, isBotMatch=${match.isBotMatch}`);

      if (currentPlayer === match.botPlayer) {
        console.log(`🤖 Triggering bot move for ${match.botPlayer} in match ${matchId.slice(0, 12)}`);
        // Bot's turn - trigger bot move after a small delay for natural feel
        setTimeout(() => {
          void this.executeBotMove(matchId);
        }, 300 + Math.random() * 200); // 300-500ms delay
      }
    } else {
      console.log(`⚠️ Not triggering bot move: isBotMatch=${match.isBotMatch}, botPlayer=${match.botPlayer}`);
    }
  }

  /**
   * Execute a bot move
   * Called automatically when it's the bot's turn
   */
  private async executeBotMove(matchId: string): Promise<void> {
    try {
      // Get current match state
      let match = this.matches.get(matchId);
      let engineState = this.engineStates.get(matchId);

      if (!match || !engineState) {
        // Recover from Redis if not in memory
        const recovered = await this.matchManager.recoverMatch(matchId);
        match = recovered?.matchState as MatchState | undefined;
        engineState = recovered?.engineState;

        if (!match || !engineState) {
          console.error(`❌ Bot move failed: match ${matchId.slice(0, 12)} not found`);
          return;
        }

        this.matches.set(matchId, match);
        this.engineStates.set(matchId, engineState);
      }

      // Verify it's still the bot's turn and game is not over
      if (match.gameState.isGameOver) {
        return;
      }

      if (!match.isBotMatch || !match.botPlayer) {
        console.error(`❌ executeBotMove called on non-bot match ${matchId.slice(0, 12)}`);
        return;
      }

      const currentPlayer = getNextPlayer(
        isMode1(engineState) ? engineState.currentTurn : (engineState as ExpandingBoardState).currentTurn
      );

      if (currentPlayer !== match.botPlayer) {
        console.error(`❌ Bot move triggered but it's not bot's turn in match ${matchId.slice(0, 12)}`);
        return;
      }

      // Convert engine state to bot GameState format
      const botGameState = {
        board: match.gameState.board,
        currentTurn: isMode1(engineState) ? engineState.currentTurn : (engineState as ExpandingBoardState).currentTurn,
        winner: match.gameState.winner,
        moveHistory: match.gameState.moveHistory,
      };

      // Compute bot move
      const moveIndex = await botController.computeMove(matchId, botGameState);
      const boardSize = match.gameState.boardSize;
      const position = indexToPosition(moveIndex, boardSize);

      console.log(`🤖 Bot ${match.botPlayer} playing at (${position.row},${position.col}) in match ${matchId.slice(0, 12)}`);

      // Validate bot move
      if (!validateMove(engineState, match.mode, position, match.botPlayer)) {
        console.error(`❌ Bot returned invalid move: ${moveIndex} -> (${position.row},${position.col})`);
        return;
      }

      // Store old state
      const oldEngineState = engineState;

      // Apply bot move
      const newEngineState = executeMove(engineState, match.mode, match.botPlayer, position);

      // Calculate removed position for Mode 1
      let removedPosition: Position | undefined;
      if (isMode1(newEngineState) && isMode1(oldEngineState) && match.botPlayer) {
        const botPlayer = match.botPlayer;
        const oldMarks = oldEngineState.playerMarks[botPlayer];
        const newMarks = newEngineState.playerMarks[botPlayer];

        if (oldMarks.length === 3 && newMarks.length === 3) {
          const removed = oldMarks.find((pos: { position: Position }) =>
            !newMarks.some((newPos: { position: Position }) =>
              newPos.position.row === pos.position.row && newPos.position.col === pos.position.col
            )
          );
          removedPosition = removed?.position;
        }
      }

      // Update in-memory state
      this.engineStates.set(matchId, newEngineState);
      match.gameState = engineToWireState(newEngineState, match.mode);

      // Broadcast bot move to all clients
      this.broadcastToMatch(matchId, {
        type: 'MOVE_UPDATE',
        payload: {
          matchId,
          position,
          player: match.botPlayer,
          moveNumber: isMode1(newEngineState) ? newEngineState.currentTurn : (newEngineState as ExpandingBoardState).currentTurn,
          removedPosition,
          isGameOver: match.gameState.isGameOver,
          winner: match.gameState.winner,
          winInfo: match.gameState.winInfo,
          isDraw: match.gameState.isDraw,
        },
      });

      // Persist asynchronously
      this.matchManager.applyMove(
        matchId,
        { matchState: match, engineState: newEngineState },
        this.matchCreatedAt.get(matchId) ?? match.startedAt ?? Date.now(),
      )
        .catch(err => {
          console.error(`❌ Failed to persist bot move for match ${matchId.slice(0, 12)}:`, err);
        });

      // Check if bot's move ended the game
      if (match.gameState.isGameOver) {
        const endReason = match.gameState.isDraw ? 'draw' : 'win';
        console.log(`🏁 Bot move ended game: winner=${match.gameState.winner}, isDraw=${match.gameState.isDraw}`);
        await this.finalizeMatch(match, match.gameState.winner, endReason);
      } else {
        console.log(`✅ Bot move complete, game continues. Current player: ${match.gameState.currentPlayer}`);
      }
    } catch (error) {
      console.error(`❌ Bot move execution failed for match ${matchId.slice(0, 12)}:`, error);
    }
  }

  /**
   * Handle FORFEIT
   */
  private async handleForfeit(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client?.matchId) return;

    if (client.role !== 'player') {
      if (client.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Only players can forfeit a match' } });
      }
      return;
    }

    const match = this.matches.get(client.matchId);
    if (!match || match.status !== 'active') return;

    // Determine winner (opponent)
    let winner: Player | null = null;
    if (match.players.X?.id === playerId) winner = 'O';
    else if (match.players.O?.id === playerId) winner = 'X';

    if (!winner) return;

    await this.finalizeMatch(match, winner, 'forfeit');
  }

  /**
   * Handle REMATCH_REQUEST
   */
  private async handleRematchRequest(playerId: string, payload: { matchId: string }) {
    const client = this.clients.get(playerId);

    if (client?.role === 'spectator') {
      if (client.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Spectators cannot request rematches' } });
      }
      return;
    }

    const match = this.matches.get(payload.matchId);

    if (!match || match.status !== 'completed') {
      if (client?.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Match not found or not completed' } });
      }
      return;
    }

    // Reject rematch requests for bot matches
    if (match.isBotMatch) {
      console.log(`❌ Rematch rejected: ${playerId.slice(0, 8)} tried to rematch a bot match`);
      if (client?.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Cannot rematch against bots. Please find a new match.' } });
      }
      return;
    }

    // Find which player this is
    let requestingPlayer: Player | null = null;
    if (match.players.X?.id === playerId) requestingPlayer = 'X';
    else if (match.players.O?.id === playerId) requestingPlayer = 'O';

    if (!requestingPlayer) {
      if (client?.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Not a player in this match' } });
      }
      return;
    }

    match.rematchRequestedBy = requestingPlayer;
    const engineState = this.engineStates.get(payload.matchId);
    if (engineState) {
      await this.matchManager.saveMatchState(match, engineState);
    }

    // Notify opponent
    this.broadcastToMatch(payload.matchId, {
      type: 'REMATCH_REQUESTED',
      payload: {
        matchId: payload.matchId,
        requestedBy: requestingPlayer,
      },
    }, playerId);

    console.log(`🔄 ${requestingPlayer} requested rematch in match ${payload.matchId.slice(0, 12)}`);
  }

  /**
   * Handle REMATCH_ACCEPT
   */
  private async handleRematchAccept(playerId: string, payload: { matchId: string }) {
    const client = this.clients.get(playerId);

    if (client?.role === 'spectator') {
      if (client.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Spectators cannot accept rematches' } });
      }
      return;
    }

    const oldMatch = this.matches.get(payload.matchId);
    
    if (!oldMatch || !oldMatch.rematchRequestedBy) {
      if (client?.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'No rematch request pending' } });
      }
      return;
    }

    // Find which player accepted
    let acceptingPlayer: Player | null = null;
    if (oldMatch.players.X?.id === playerId) acceptingPlayer = 'X';
    else if (oldMatch.players.O?.id === playerId) acceptingPlayer = 'O';

    // Can't accept your own request
    if (acceptingPlayer === oldMatch.rematchRequestedBy) {
      if (client?.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Cannot accept your own rematch request' } });
      }
      return;
    }

    // Create new match with swapped players
    const newMatchId = `match_${++this.matchCounter}_${Date.now()}`;
    const mode = oldMatch.mode;

    // Swap X and O for the rematch
    const initialEngineState = initEngineState(mode);
    const newMatchState: MatchState = {
      matchId: newMatchId,
      status: 'active',
      mode,
      isRanked: oldMatch.isRanked,
      players: {
        X: oldMatch.players.O ? { ...oldMatch.players.O, isConnected: true } : null,
        O: oldMatch.players.X ? { ...oldMatch.players.X, isConnected: true } : null,
      },
      gameState: engineToWireState(initialEngineState, mode),
      spectators: [],
      spectatorCount: 0,
      startedAt: Date.now(),
    };

    this.matches.set(newMatchId, newMatchState);
    this.engineStates.set(newMatchId, initialEngineState);
    const rematchSnapshot = await this.matchManager.createMatch(newMatchState, initialEngineState);
    this.matchCreatedAt.set(newMatchId, rematchSnapshot.createdAt);

    // Clean up old match engine state
    this.engineStates.delete(payload.matchId);

    // Update client match references
    const playerXId = oldMatch.players.X?.id;
    const playerOId = oldMatch.players.O?.id;
    
    if (playerXId) {
      const clientX = this.clients.get(playerXId);
      if (clientX) clientX.matchId = newMatchId;
    }
    if (playerOId) {
      const clientO = this.clients.get(playerOId);
      if (clientO) clientO.matchId = newMatchId;
    }

    // Notify both players of the new match
    // Old X is now O
    if (playerXId) {
      const clientX = this.clients.get(playerXId);
      if (clientX?.ws) {
        this.send(clientX.ws, {
          type: 'REMATCH_STARTING',
          payload: {
            oldMatchId: payload.matchId,
            newMatchId,
            yourPlayer: 'O',
            matchState: newMatchState,
          },
        });
      }
    }
    
    // Old O is now X
    if (playerOId) {
      const clientO = this.clients.get(playerOId);
      if (clientO?.ws) {
        this.send(clientO.ws, {
          type: 'REMATCH_STARTING',
          payload: {
            oldMatchId: payload.matchId,
            newMatchId,
            yourPlayer: 'X',
            matchState: newMatchState,
          },
        });
      }
    }

    console.log(`🔄 Rematch started: ${newMatchId.slice(0, 16)}`);
    console.log(`   X: ${newMatchState.players.X?.username} vs O: ${newMatchState.players.O?.username}`);

    // Clean up old match
    this.matches.delete(payload.matchId);
    this.engineStates.delete(payload.matchId);
    this.matchCreatedAt.delete(payload.matchId);
    await this.matchManager.endMatch(payload.matchId);
  }

  /**
   * Handle REMATCH_DECLINE
   */
  private async handleRematchDecline(playerId: string, payload: { matchId: string }) {
    const client = this.clients.get(playerId);

    if (client?.role === 'spectator') {
      if (client.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Spectators cannot decline rematches' } });
      }
      return;
    }

    const match = this.matches.get(payload.matchId);
    
    if (!match || !match.rematchRequestedBy) {
      return;
    }

    // Find which player declined
    let decliningPlayer: Player | null = null;
    if (match.players.X?.id === playerId) decliningPlayer = 'X';
    else if (match.players.O?.id === playerId) decliningPlayer = 'O';

    match.rematchRequestedBy = null;
    const engineState = this.engineStates.get(payload.matchId);
    if (engineState) {
      await this.matchManager.saveMatchState(match, engineState);
    }

    // Notify both players
    this.broadcastToMatch(payload.matchId, {
      type: 'REMATCH_DECLINED',
      payload: {
        matchId: payload.matchId,
        declinedBy: decliningPlayer,
      },
    });

    console.log(`❌ ${decliningPlayer} declined rematch in match ${payload.matchId.slice(0, 12)}`);
  }

  /**
   * Handle client disconnect
   */
  private async handleDisconnect(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client) return;

    console.log(`🔌 Client disconnected: ${playerId.slice(0, 8)}`);

    // Update online status
    await this.updateOnlineStatus(playerId, false);

    // Remove from queues
    for (const [, queue] of this.queues.entries()) {
      const index = queue.findIndex((e) => e.playerId === playerId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    console.log(`🗑️ Removing ${playerId.slice(0, 8)} from ranked queue...`);
    await this.matchmakingService.leaveQueue(playerId);
    console.log(`✅ Successfully removed ${playerId.slice(0, 8)} from ranked queue`);

    // Mark socket as null and clear queue flag (player may reconnect)
    client.ws = null;
    client.inQueue = false;

    if (client.matchId && client.role === 'spectator') {
      const matchId = client.matchId;
      await this.removeSpectatorFromMatch(matchId, playerId, true);
      this.clients.delete(playerId);
      return;
    }

    // Notify match and start disconnect timer
    if (client.matchId) {
      const match = this.matches.get(client.matchId);
      if (match && match.status === 'active') {
        let disconnectedPlayer: Player | null = null;
        if (match.players.X?.id === playerId) {
          match.players.X.isConnected = false;
          disconnectedPlayer = 'X';
        } else if (match.players.O?.id === playerId) {
          match.players.O.isConnected = false;
          disconnectedPlayer = 'O';
        }

        if (disconnectedPlayer) {
          const matchId = client.matchId;
          const engineState = this.engineStates.get(matchId);
          if (engineState) {
            await this.matchManager.saveMatchState(match, engineState);
          }
          
          this.broadcastToMatch(matchId, {
            type: 'PLAYER_DISCONNECTED',
            payload: {
              matchId,
              player: disconnectedPlayer,
              reconnectTimeout: this.DISCONNECT_TIMEOUT,
            },
          }, playerId);

          // Start disconnect timeout — auto-forfeit if player doesn't reconnect
          this.startDisconnectTimer(playerId, matchId);
        }
      } else {
        // Match not active (completed/waiting) — safe to fully remove client
        this.clients.delete(playerId);
      }
    } else {
      // Not in a match — safe to fully remove client
      this.clients.delete(playerId);
    }
  }

  /**
   * Start a disconnect timer for a player.
   * If the player fails to reconnect within the timeout, auto-forfeit.
   */
  private startDisconnectTimer(playerId: string, matchId: string) {
    // Clear any existing timer
    this.clearDisconnectTimer(playerId);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      void this.handleDisconnectTimeout(playerId, matchId);
    }, this.DISCONNECT_TIMEOUT);

    this.disconnectTimers.set(playerId, timer);
    console.log(`⏱ Disconnect timer started for ${playerId.slice(0, 8)} (${this.DISCONNECT_TIMEOUT / 1000}s)`);
  }

  /**
   * Clear a player's disconnect timer (e.g., on reconnect)
   */
  private clearDisconnectTimer(playerId: string) {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  /**
   * Handle disconnect timeout — auto-forfeit the disconnected player
   */
  private async handleDisconnectTimeout(playerId: string, matchId: string) {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'active') return;

    // Determine winner (opponent of the disconnected player)
    let winner: Player | null = null;
    if (match.players.X?.id === playerId) winner = 'O';
    else if (match.players.O?.id === playerId) winner = 'X';

    if (!winner) return;

    await this.finalizeMatch(match, winner, 'disconnect');

    this.clients.delete(playerId);
  }

  /**
   * Handle RECONNECT event
   * Client sends { type: "RECONNECT", payload: { playerId: "abc123" } }
   * Server finds active match, reassigns socket, sends state
   */
  private async handleReconnect(
    ws: WebSocket,
    payload: { playerId: string },
    setClientId: (id: string) => void
  ) {
    const { playerId } = payload;
    if (!playerId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Player ID required for reconnect' } });
      return;
    }

    const recovered = await this.matchManager.findActiveMatchByPlayer(playerId);
    const match = recovered?.matchState as MatchState | undefined;
    const engineState = recovered?.engineState;

    let foundMatchId: string | null = match?.matchId ?? null;
    let yourPlayer: Player | null = null;

    if (match?.players.X?.id === playerId) {
      yourPlayer = 'X';
    } else if (match?.players.O?.id === playerId) {
      yourPlayer = 'O';
    }

    if (!foundMatchId || !yourPlayer || !match || !engineState) {
      this.send(ws, { type: 'ERROR', payload: { message: 'No active match found for this player' } });
      return;
    }

    this.matches.set(foundMatchId, match);
    this.engineStates.set(foundMatchId, engineState);
    this.matchCreatedAt.set(foundMatchId, recovered.createdAt);

    // Clear disconnect timer
    this.clearDisconnectTimer(playerId);

    // Update or create client entry
    setClientId(playerId);
    const existingClient = this.clients.get(playerId);
    if (existingClient) {
      if (existingClient.matchId && existingClient.role === 'spectator' && existingClient.matchId !== foundMatchId) {
        await this.removeSpectatorFromMatch(existingClient.matchId, playerId, true);
      }
      existingClient.ws = ws;
      existingClient.matchId = foundMatchId;
      existingClient.role = 'player';
    } else {
      this.clients.set(playerId, {
        ws,
        playerId,
        username: match.players[yourPlayer]?.username || 'Player',
        matchId: foundMatchId,
        inQueue: false,
        role: 'player',
      });
    }

    // Mark player as connected
    if (match.players[yourPlayer]) {
      match.players[yourPlayer]!.isConnected = true;
    }
    await this.matchManager.saveMatchState(match, engineState);

    console.log(`🔄 ${yourPlayer} (${playerId.slice(0, 12)}) reconnected to match ${foundMatchId.slice(0, 16)}`);

    // Send RECONNECTED event
    this.send(ws, {
      type: 'RECONNECTED',
      payload: {
        matchId: foundMatchId,
        role: yourPlayer,
      },
    });

    // Send current game state
    this.send(ws, {
      type: 'MATCH_JOINED',
      payload: {
        matchState: match,
        yourPlayer,
      },
    });

    // Send latest game state update
    this.send(ws, {
      type: 'GAME_STATE_UPDATE',
      payload: {
        matchId: foundMatchId,
        gameState: match.gameState,
      },
    });

    // Notify opponent
    this.broadcastToMatch(foundMatchId, {
      type: 'PLAYER_RECONNECTED',
      payload: {
        matchId: foundMatchId,
        player: yourPlayer,
      },
    }, playerId);
  }

  /**
   * Clean up completed match
   */
  private async cleanupMatch(matchId: string) {
    const match = this.matches.get(matchId);
    if (!match) return;

    // Clear disconnect timers and match references from clients
    for (const role of ['X', 'O'] as Player[]) {
      const pid = match.players[role]?.id;
      if (pid) {
        this.clearDisconnectTimer(pid);
        const client = this.clients.get(pid);
        if (client) client.matchId = null;
      }
    }

    for (const spectatorId of match.spectators ?? []) {
      const client = this.clients.get(spectatorId);
      if (client) {
        client.matchId = null;
      }
    }

    this.matches.delete(matchId);
    this.engineStates.delete(matchId);
    this.matchCreatedAt.delete(matchId);
    await this.matchManager.endMatch(matchId);
    console.log(`🧹 Cleaned up match ${matchId.slice(0, 12)}`);
  }

  /**
   * Broadcast message to all players in a match
   */
  private broadcastToMatch(matchId: string, event: ServerEvent, excludePlayerId?: string) {
    const match = this.matches.get(matchId);
    if (!match) return;

    const recipients = new Set<string>([
      ...(match.spectators ?? []),
      ...([match.players.X?.id, match.players.O?.id].filter(Boolean) as string[]),
    ]);

    for (const pid of recipients) {
      if (pid === excludePlayerId) continue;
      const client = this.clients.get(pid);
      if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, event);
      }
    }
  }

  /**
   * Send message to WebSocket
   */
  private send(ws: WebSocket, event: ServerEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  /**
   * Get queue status (for monitoring)
   */
  getQueueStatus() {
    const status: Record<string, number> = {};
    for (const [key, queue] of this.queues.entries()) {
      status[key] = queue.length;
    }
    return status;
  }

  /**
   * Get active match count
   */
  getActiveMatchCount(): number {
    return this.matches.size;
  }

  // Legacy method for polling-based system compatibility
  broadcastStateUpdate(matchId: string, matchState: any) {
    this.broadcastToMatch(matchId, {
      type: 'GAME_STATE_UPDATE',
      payload: matchState,
    });
  }

  broadcastMatchComplete(matchId: string, matchResult: any) {
    this.broadcastToMatch(matchId, {
      type: 'MATCH_END',
      payload: matchResult,
    });
  }

  private async persistCompletedMatch(
    match: MatchState,
    ratingChanges?: { X: number; O: number } | null
  ): Promise<void> {
    try {
      const mapped = this.toSharedMatchResult(match);
      await this.matchStorage.saveMatch(mapped);
      if (ratingChanges) {
        await this.updateMatchPlayerRatingChanges(match.matchId, ratingChanges);
      }
      console.log(`💾 Persisted match ${match.matchId.slice(0, 12)} to storage`);
    } catch (error) {
      console.error(`❌ Failed to persist match ${match.matchId.slice(0, 12)}`, error);
    }
  }

  private async finalizeMatch(
    match: MatchState,
    winner: Player | null,
    endReason: 'win' | 'forfeit' | 'disconnect' | 'draw'
  ): Promise<void> {
    match.status = 'completed';
    match.gameState.isGameOver = true;
    match.gameState.winner = winner;
    match.gameState.isDraw = endReason === 'draw';

    const duration = Date.now() - (match.startedAt || Date.now());
    const ratingUpdate = await this.applyRankedRatingUpdate(match, winner);

    if (ratingUpdate?.updatedRatings) {
      if (match.players.X) {
        match.players.X.rating = ratingUpdate.updatedRatings.X;
      }
      if (match.players.O) {
        match.players.O.rating = ratingUpdate.updatedRatings.O;
      }
    }

    this.broadcastToMatch(match.matchId, {
      type: 'MATCH_END',
      payload: {
        matchId: match.matchId,
        result: {
          matchId: match.matchId,
          winner,
          isDraw: endReason === 'draw',
          winInfo: match.gameState.winInfo || null,
          players: match.players,
          ratingChanges: ratingUpdate?.ratingChanges,
          moveCount: match.gameState.moveCount,
          duration,
          endReason,
        },
        finalGameState: match.gameState,
      },
    });

    console.log(`🏁 Match ${match.matchId.slice(0, 12)} ended - Winner: ${winner || 'Draw'}`);
    await this.persistCompletedMatch(match, ratingUpdate?.ratingChanges);
    await this.matchManager.endMatch(match.matchId);

    // Update recent opponents (skip bot matches)
    const playerXId = match.players.X?.id;
    const playerOId = match.players.O?.id;
    if (playerXId && playerOId) {
      await this.updateRecentOpponents(match.matchId, playerXId, playerOId);
    }

    // Cleanup bot instance if this is a bot match
    if (match.isBotMatch) {
      botController.cleanup(match.matchId);
      console.log(`🤖 Cleaned up bot for match ${match.matchId.slice(0, 12)}`);
    }

    setTimeout(() => {
      void this.cleanupMatch(match.matchId);
    }, 60000);
  }

  private async loadPlayerProfile(playerId: string, mode: GameMode): Promise<{ id: string; rating: number; displayName: string | null; username: string } | null> {
    const prisma = getPrismaClient();
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, ratingMode1: true, ratingMode2: true, displayName: true, username: true },
    });

    if (!player) {
      return null;
    }

    return {
      id: player.id,
      rating: mode === 'MODE_1' ? player.ratingMode1 : player.ratingMode2,
      displayName: player.displayName,
      username: player.username,
    };
  }

  private async applyRankedRatingUpdate(
    match: MatchState,
    winner: Player | null
  ): Promise<{ ratingChanges: { X: number; O: number }; updatedRatings: { X: number; O: number } } | null> {
    if (!match.isRanked) {
      return null;
    }

    const xId = match.players.X?.id;
    const oId = match.players.O?.id;

    if (!xId || !oId) {
      return null;
    }

    // For bot matches, only update the human player's rating
    const isBotMatch = match.isBotMatch;
    const botMultiplier = match.botMultiplier || 1.0;

    const prisma = getPrismaClient();

    // Filter out bot IDs (they start with "bot-")
    const humanPlayerIds = [xId, oId].filter(id => !id.startsWith('bot-'));

    if (humanPlayerIds.length === 0) {
      return null; // No human players to update
    }

    const players = await prisma.player.findMany({
      where: { id: { in: humanPlayerIds } },
      select: { id: true, ratingMode1: true, ratingMode2: true },
    });

    const playerX = players.find((player) => player.id === xId);
    const playerO = players.find((player) => player.id === oId);

    // For bot matches, use the human player's rating for both sides
    // (bots are assigned the same rating as their opponent for fair ELO calc)
    const isMode1 = match.mode === 'MODE_1';
    const mode = isMode1 ? 'mode1' : 'mode2';

    let xRating: number = 1200; // Default rating
    let oRating: number = 1200; // Default rating

    if (playerX && playerO) {
      // PvP match - both players found
      xRating = isMode1 ? playerX.ratingMode1 : playerX.ratingMode2;
      oRating = isMode1 ? playerO.ratingMode1 : playerO.ratingMode2;
    } else if (playerX && !playerO) {
      // X is human, O is bot
      xRating = isMode1 ? playerX.ratingMode1 : playerX.ratingMode2;
      oRating = match.players.O?.rating || xRating; // Bot's rating from match state
    } else if (!playerX && playerO) {
      // X is bot, O is human
      xRating = match.players.X?.rating || oRating; // Bot's rating from match state
      oRating = isMode1 ? playerO.ratingMode1 : playerO.ratingMode2;
    } else {
      return null; // Both are bots (shouldn't happen)
    }

    let outcomeForX: MatchOutcome = 'draw';
    if (winner === 'X') outcomeForX = 'win';
    if (winner === 'O') outcomeForX = 'loss';

    // Get match counts for K-factor (only for human players)
    const xRankedMatches = playerX ? await prisma.matchPlayer.count({
      where: {
        playerId: xId,
        match: {
          isRanked: true,
          mode: mode,
        },
      },
    }) : 0;

    const oRankedMatches = playerO ? await prisma.matchPlayer.count({
      where: {
        playerId: oId,
        match: {
          isRanked: true,
          mode: mode,
        },
      },
    }) : 0;

    const kFactorX = resolveKFactorByExperience(xRankedMatches);
    const kFactorO = resolveKFactorByExperience(oRankedMatches);

    const { changeA, changeB } = calculateEloChange(xRating, oRating, outcomeForX, {
      kFactorA: kFactorX,
      kFactorB: kFactorO,
    });

    // Apply bot multiplier if it's a bot match
    const finalChangeA = isBotMatch ? Math.round(changeA * botMultiplier) : changeA;
    const finalChangeB = isBotMatch ? Math.round(changeB * botMultiplier) : changeB;

    const newXRating = Math.max(0, xRating + finalChangeA);
    const newORating = Math.max(0, oRating + finalChangeB);

    // Update only human players in database
    await prisma.$transaction(async (tx) => {
      if (playerX) {
        if (isMode1) {
          await tx.player.update({ where: { id: xId }, data: { ratingMode1: newXRating } });
        } else {
          await tx.player.update({ where: { id: xId }, data: { ratingMode2: newXRating } });
        }
      }

      if (playerO) {
        if (isMode1) {
          await tx.player.update({ where: { id: oId }, data: { ratingMode1: newORating } });
        } else {
          await tx.player.update({ where: { id: oId }, data: { ratingMode2: newORating } });
        }
      }
    });

    const formattedXChange = `${finalChangeA >= 0 ? '+' : ''}${finalChangeA}`;
    const formattedOChange = `${finalChangeB >= 0 ? '+' : ''}${finalChangeB}`;

    if (isBotMatch) {
      console.log(`[${mode}] Bot Match (${botMultiplier}x multiplier)`);
    }

    if (playerX) {
      console.log(`[${mode}] Player ${xId}: ${xRating} -> ${newXRating} (${formattedXChange})`);
    }
    if (playerO) {
      console.log(`[${mode}] Player ${oId}: ${oRating} -> ${newORating} (${formattedOChange})`);
    }

    return {
      ratingChanges: { X: finalChangeA, O: finalChangeB },
      updatedRatings: { X: newXRating, O: newORating },
    };
  }

  private async updateMatchPlayerRatingChanges(
    matchId: string,
    ratingChanges: { X: number; O: number }
  ): Promise<void> {
    const match = this.matches.get(matchId);
    const xId = match?.players.X?.id;
    const oId = match?.players.O?.id;

    if (!xId || !oId) {
      return;
    }

    const prisma = getPrismaClient();
    await prisma.$transaction(async (tx) => {
      await tx.matchPlayer.updateMany({
        where: { matchId, playerId: xId },
        data: { ratingChange: ratingChanges.X },
      });
      await tx.matchPlayer.updateMany({
        where: { matchId, playerId: oId },
        data: { ratingChange: ratingChanges.O },
      });
    });
  }

  private toSharedMatchResult(match: MatchState): SharedMatchResult {
    const boardSize = match.gameState.boardSize;
    const winnerId = match.gameState.winner ? match.players[match.gameState.winner]?.id ?? null : null;

    const mappedGame = {
      winner: match.gameState.winner,
      totalMoves: match.gameState.moveCount,
      boardSize,
      moves: match.gameState.moveHistory.map((move) => ({
        index: move.position.row * boardSize + move.position.col,
        player: move.player,
        turn: Math.max(0, move.moveNumber - 1),
        timestamp: move.timestamp,
      })),
    };

    const sharedMode: SharedMatchResult['mode'] = match.mode === 'MODE_1' ? 'mode1' : 'mode2';

    return {
      matchId: match.matchId,
      mode: sharedMode,
      isRanked: match.isRanked,
      // PvP matches are human-vs-human; difficulty is not meaningful but required by frozen schema.
      difficulty: 'easy',
      players: (['X', 'O'] as Player[])
        .map((symbol) => match.players[symbol])
        .filter((player): player is PlayerInfo => Boolean(player?.id))
        .map((player) => ({ id: player.id, type: 'human' })),
      games: [mappedGame],
      winner: winnerId,
      roundsPlayed: 1,
      totalMoves: match.gameState.moveCount,
      drawCount: match.gameState.isDraw ? 1 : 0,
      createdAt: match.startedAt ?? Date.now(),
    };
  }

  // ============================================
  // Social Features
  // ============================================

  /**
   * Update online status in Redis and broadcast to friends
   */
  private async updateOnlineStatus(playerId: string, isOnline: boolean): Promise<void> {
    try {
      const redis = getRedisClient();

      if (isOnline) {
        await redis.sadd('online:players', playerId);
        await this.broadcastToFriends(playerId, 'FRIEND_ONLINE', { friendId: playerId });
      } else {
        await redis.srem('online:players', playerId);
        await this.broadcastToFriends(playerId, 'FRIEND_OFFLINE', { friendId: playerId });
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  /**
   * Broadcast event to all friends of a player
   */
  private async broadcastToFriends(
    playerId: string,
    eventType: ServerEventType,
    payload: any
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();

      // Get all accepted friendships
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: playerId, status: 'ACCEPTED' },
            { addresseeId: playerId, status: 'ACCEPTED' },
          ],
        },
        select: { requesterId: true, addresseeId: true },
      });

      // Extract friend IDs
      const friendIds = friendships.map((f) =>
        f.requesterId === playerId ? f.addresseeId : f.requesterId
      );

      // Broadcast to each online friend
      friendIds.forEach((friendId) => {
        const client = this.clients.get(friendId);
        if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
          this.send(client.ws, { type: eventType, payload });
        }
      });
    } catch (error) {
      console.error('Error broadcasting to friends:', error);
    }
  }

  /**
   * Handle FRIEND_REQUEST event
   */
  private async handleFriendRequest(
    playerId: string,
    payload: { addresseeId: string }
  ): Promise<void> {
    try {
      const { addresseeId } = payload;

      const prisma = getPrismaClient();

      // Get requester info
      const requester = await prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true, username: true, displayName: true },
      });

      if (!requester) {
        return;
      }

      // Notify addressee if they're online
      const addresseeClient = this.clients.get(addresseeId);
      if (addresseeClient?.ws && addresseeClient.ws.readyState === WebSocket.OPEN) {
        this.send(addresseeClient.ws, {
          type: 'FRIEND_REQUEST_RECEIVED',
          payload: {
            friendship: {
              id: 'pending', // Will be replaced by actual API response
              requester,
            },
          },
        });
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  }

  /**
   * Handle CHALLENGE_CREATE event
   */
  private async handleChallengeCreate(
    playerId: string,
    payload: { challengedId: string; mode: number }
  ): Promise<void> {
    try {
      const { challengedId, mode } = payload;

      const prisma = getPrismaClient();

      // Get challenger info
      const challenger = await prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true, username: true, displayName: true },
      });

      if (!challenger) {
        return;
      }

      // Notify challenged player if they're online
      const challengedClient = this.clients.get(challengedId);
      if (challengedClient?.ws && challengedClient.ws.readyState === WebSocket.OPEN) {
        // Get full challenge details
        const challenge = await prisma.challenge.findFirst({
          where: {
            challengerId: playerId,
            challengedId,
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (challenge) {
          this.send(challengedClient.ws, {
            type: 'CHALLENGE_RECEIVED',
            payload: {
              challenge: {
                id: challenge.id,
                challenger,
                mode,
                expiresAt: challenge.expiresAt,
              },
            },
          });
        }
      }
    } catch (error) {
      console.error('Error handling challenge create:', error);
    }
  }

  /**
   * Handle CHALLENGE_RESPOND event
   */
  private async handleChallengeRespond(
    playerId: string,
    payload: { challengeId: string; action: 'ACCEPT' | 'DECLINE' }
  ): Promise<void> {
    try {
      const { challengeId, action } = payload;

      const prisma = getPrismaClient();

      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
          challenger: { select: { id: true, username: true } },
          challenged: { select: { id: true, username: true } },
        },
      });

      if (!challenge || challenge.challengedId !== playerId) {
        return;
      }

      const challengerClient = this.clients.get(challenge.challengerId);

      if (action === 'ACCEPT') {
        // Create match for the challenge
        const matchId = await this.createChallengeMatch(challenge);

        if (challengerClient?.ws && challengerClient.ws.readyState === WebSocket.OPEN) {
          this.send(challengerClient.ws, {
            type: 'CHALLENGE_ACCEPTED',
            payload: { challengeId, matchId },
          });
        }

        // Also notify the challenged player
        const challengedClient = this.clients.get(playerId);
        if (challengedClient?.ws && challengedClient.ws.readyState === WebSocket.OPEN) {
          this.send(challengedClient.ws, {
            type: 'CHALLENGE_ACCEPTED',
            payload: { challengeId, matchId },
          });
        }
      } else {
        // Notify challenger of decline
        if (challengerClient?.ws && challengerClient.ws.readyState === WebSocket.OPEN) {
          this.send(challengerClient.ws, {
            type: 'CHALLENGE_DECLINED',
            payload: { challengeId },
          });
        }
      }
    } catch (error) {
      console.error('Error handling challenge respond:', error);
    }
  }

  /**
   * Create a match from an accepted challenge
   */
  private async createChallengeMatch(challenge: any): Promise<string> {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const mode: GameMode = challenge.mode === 1 ? 'MODE_1' : 'MODE_2';

    const prisma = getPrismaClient();

    // Get player profiles
    const [challenger, challenged] = await Promise.all([
      prisma.player.findUnique({
        where: { id: challenge.challengerId },
        select: { username: true, ratingMode1: true, ratingMode2: true },
      }),
      prisma.player.findUnique({
        where: { id: challenge.challengedId },
        select: { username: true, ratingMode1: true, ratingMode2: true },
      }),
    ]);

    if (!challenger || !challenged) {
      throw new Error('Player not found');
    }

    const rating1 = mode === 'MODE_1' ? challenger.ratingMode1 : challenger.ratingMode2;
    const rating2 = mode === 'MODE_1' ? challenged.ratingMode1 : challenged.ratingMode2;

    // Create match state
    const matchState: MatchState = {
      matchId,
      status: 'active',
      mode,
      isRanked: false, // Challenges are always unranked
      players: {
        X: {
          id: challenge.challengerId,
          username: challenger.username,
          rating: rating1,
          isConnected: true,
        },
        O: {
          id: challenge.challengedId,
          username: challenged.username,
          rating: rating2,
          isConnected: true,
        },
      },
      gameState: {
        board: Array(3).fill(null).map(() => Array(3).fill(null)),
        boardSize: 3,
        currentPlayer: 'X',
        moveHistory: [],
        isGameOver: false,
        winner: null,
        winInfo: null,
        isDraw: false,
        mode,
        moveCount: 0,
      },
      spectators: [],
      spectatorCount: 0,
      startedAt: Date.now(),
    };

    this.matches.set(matchId, matchState);
    this.engineStates.set(matchId, initEngineState(mode));

    const challengeSnapshot = await this.matchManager.saveMatchState(
      matchState,
      this.engineStates.get(matchId)!,
    );
    this.matchCreatedAt.set(matchId, challengeSnapshot.createdAt);

    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { matchId, status: 'ACCEPTED' },
    });

    // Send MATCH_FOUND to both players
    const challengerClient = this.clients.get(challenge.challengerId);
    const challengedClient = this.clients.get(challenge.challengedId);

    const matchFoundPayload = {
      matchId,
      mode,
      isRanked: false,
      opponent: null, // Will be set individually
      yourSymbol: null, // Will be set individually
    };

    if (challengerClient?.ws && challengerClient.ws.readyState === WebSocket.OPEN) {
      this.send(challengerClient.ws, {
        type: 'MATCH_FOUND',
        payload: {
          ...matchFoundPayload,
          yourSymbol: 'X',
          opponent: { id: challenge.challengedId, username: challenged.username, rating: rating2 },
        },
      });
    }

    if (challengedClient?.ws && challengedClient.ws.readyState === WebSocket.OPEN) {
      this.send(challengedClient.ws, {
        type: 'MATCH_FOUND',
        payload: {
          ...matchFoundPayload,
          yourSymbol: 'O',
          opponent: { id: challenge.challengerId, username: challenger.username, rating: rating1 },
        },
      });
    }

    return matchId;
  }

  /**
   * Update recent opponents after match completion
   */
  private async updateRecentOpponents(
    matchId: string,
    playerXId: string,
    playerOId: string
  ): Promise<void> {
    try {
      // Skip bot matches
      if (playerXId.startsWith('bot-') || playerOId.startsWith('bot-')) {
        return;
      }

      const prisma = getPrismaClient();
      const now = new Date();

      // Upsert both directions
      await Promise.all([
        prisma.recentOpponent.upsert({
          where: {
            playerId_opponentId: {
              playerId: playerXId,
              opponentId: playerOId,
            },
          },
          update: { lastPlayedAt: now, matchId },
          create: { playerId: playerXId, opponentId: playerOId, matchId, lastPlayedAt: now },
        }),
        prisma.recentOpponent.upsert({
          where: {
            playerId_opponentId: {
              playerId: playerOId,
              opponentId: playerXId,
            },
          },
          update: { lastPlayedAt: now, matchId },
          create: { playerId: playerOId, opponentId: playerXId, matchId, lastPlayedAt: now },
        }),
      ]);

      // Prune to keep only last 20 per player
      await Promise.all([
        this.pruneRecentOpponents(playerXId),
        this.pruneRecentOpponents(playerOId),
      ]);
    } catch (error) {
      console.error('Error updating recent opponents:', error);
    }
  }

  /**
   * Prune recent opponents to keep only last 20 per player
   */
  private async pruneRecentOpponents(playerId: string): Promise<void> {
    try {
      const prisma = getPrismaClient();

      // Get all recent opponents for this player, ordered by most recent
      const recentOpponents = await prisma.recentOpponent.findMany({
        where: { playerId },
        orderBy: { lastPlayedAt: 'desc' },
        select: { id: true },
      });

      // If more than 20, delete the oldest ones
      if (recentOpponents.length > 20) {
        const toDelete = recentOpponents.slice(20).map((ro) => ro.id);

        await prisma.recentOpponent.deleteMany({
          where: { id: { in: toDelete } },
        });
      }
    } catch (error) {
      console.error('Error pruning recent opponents:', error);
    }
  }

  /**
   * PUBLIC API: Emit friend request received event
   */
  public emitFriendRequestReceived(addresseeId: string, friendship: any) {
    const client = this.clients.get(addresseeId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'FRIEND_REQUEST_RECEIVED',
        payload: friendship,
      });
    }
  }

  /**
   * PUBLIC API: Emit friend request accepted event
   */
  public emitFriendRequestAccepted(requesterId: string, friendship: any) {
    const client = this.clients.get(requesterId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'FRIEND_REQUEST_ACCEPTED',
        payload: friendship,
      });
    }
  }

  /**
   * PUBLIC API: Emit friend request declined event
   */
  public emitFriendRequestDeclined(requesterId: string, friendshipId: string) {
    const client = this.clients.get(requesterId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'FRIEND_REQUEST_DECLINED',
        payload: { friendshipId },
      });
    }
  }

  /**
   * PUBLIC API: Emit friend removed event
   */
  public emitFriendRemoved(playerId: string, friendshipId: string) {
    const client = this.clients.get(playerId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'FRIEND_REMOVED',
        payload: { friendshipId },
      });
    }
  }

  /**
   * PUBLIC API: Emit challenge received event
   */
  public emitChallengeReceived(challengedId: string, challenge: any) {
    const client = this.clients.get(challengedId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'CHALLENGE_RECEIVED',
        payload: challenge,
      });
    }
  }

  /**
   * PUBLIC API: Emit challenge accepted event
   */
  public emitChallengeAccepted(challengerId: string, challengeId: string, matchId: string) {
    const client = this.clients.get(challengerId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'CHALLENGE_ACCEPTED',
        payload: { challengeId, matchId },
      });
    }
  }

  /**
   * PUBLIC API: Emit challenge declined event
   */
  public emitChallengeDeclined(challengerId: string, challengeId: string) {
    const client = this.clients.get(challengerId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'CHALLENGE_DECLINED',
        payload: { challengeId },
      });
    }
  }

  /**
   * PUBLIC API: Emit challenge cancelled event
   */
  public emitChallengeCancelled(challengedId: string, challengeId: string) {
    const client = this.clients.get(challengedId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'CHALLENGE_CANCELLED',
        payload: { challengeId },
      });
    }
  }

  /**
   * PUBLIC API: Emit challenge expired event
   */
  public emitChallengeExpired(playerId: string, challengeId: string) {
    const client = this.clients.get(playerId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'CHALLENGE_EXPIRED',
        payload: { challengeId },
      });
    }
  }

  /**
   * PUBLIC API: Emit private match joined event
   */
  public emitPrivateMatchJoined(creatorId: string, matchId: string) {
    const client = this.clients.get(creatorId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'PRIVATE_MATCH_JOINED',
        payload: { matchId },
      });
    }
  }

  /**
   * PUBLIC API: Emit private match expired event
   */
  public emitPrivateMatchExpired(creatorId: string, matchId: string) {
    const client = this.clients.get(creatorId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'PRIVATE_MATCH_EXPIRED',
        payload: { matchId },
      });
    }
  }

  /**
   * Broadcast message to all members of a room
   */
  private async broadcastToRoom(roomId: string, event: ServerEvent) {
    try {
      const prisma = getPrismaClient();

      const members = await prisma.roomMember.findMany({
        where: { roomId },
        select: { playerId: true },
      });

      members.forEach((member) => {
        const client = this.clients.get(member.playerId);
        if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
          this.send(client.ws, event);
        }
      });
    } catch (error) {
      console.error('Error broadcasting to room:', error);
    }
  }

  /**
   * PUBLIC API: Emit room created event
   */
  public emitRoomCreated(hostId: string, payload: any) {
    const client = this.clients.get(hostId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'ROOM_CREATED',
        payload,
      });
    }
  }

  /**
   * PUBLIC API: Emit room member joined event to all room members
   */
  public emitRoomMemberJoined(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_MEMBER_JOINED',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit room member left event to all room members
   */
  public emitRoomMemberLeft(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_MEMBER_LEFT',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit ready state changed event to all room members
   */
  public emitRoomReadyStateChanged(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_READY_STATE_CHANGED',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit players assigned event to all room members
   */
  public emitRoomPlayersAssigned(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_PLAYERS_ASSIGNED',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit game starting event to all room members
   */
  public emitRoomGameStarting(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_GAME_STARTING',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit game ended event to all room members
   */
  public emitRoomGameEnded(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_GAME_ENDED',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit room closed event to all room members
   */
  public emitRoomClosed(roomId: string, payload: any) {
    this.broadcastToRoom(roomId, {
      type: 'ROOM_CLOSED',
      payload,
    });
  }

  /**
   * PUBLIC API: Emit room invite received event to invitee
   */
  public emitRoomInviteReceived(inviteeId: string, payload: any) {
    const client = this.clients.get(inviteeId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'ROOM_INVITE_RECEIVED',
        payload,
      });
    }
  }

  /**
   * PUBLIC API: Emit room invite accepted event to inviter
   */
  public emitRoomInviteAccepted(inviterId: string, payload: any) {
    const client = this.clients.get(inviterId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'ROOM_INVITE_ACCEPTED',
        payload,
      });
    }
  }

  /**
   * PUBLIC API: Emit room invite declined event to inviter
   */
  public emitRoomInviteDeclined(inviterId: string, payload: any) {
    const client = this.clients.get(inviterId);
    if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, {
        type: 'ROOM_INVITE_DECLINED',
        payload,
      });
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();
