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
  type Position as EnginePosition,
  getNextPlayer,
} from '@infinite-ttt/game-engine';
import type { MatchStorage } from '../storage/MatchStorage';
import { createMatchStorage } from '../storage/createMatchStorage';

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
  spectatorCount: number;
  startedAt: number | null;
  rematchRequestedBy?: Player | null;
}

interface PlayerInfo {
  id: string;
  username: string;
  rating?: number;
  rank?: string;
  avatar?: string;
  isConnected: boolean;
}

// Client -> Server events
type ClientEventType =
  | 'JOIN_QUEUE'
  | 'LEAVE_QUEUE'
  | 'JOIN_MATCH'
  | 'LEAVE_MATCH'
  | 'MAKE_MOVE'
  | 'FORFEIT'
  | 'REMATCH_REQUEST'
  | 'REMATCH_ACCEPT'
  | 'REMATCH_DECLINE'
  | 'RECONNECT'
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
  | 'GAME_STATE_UPDATE'
  | 'MOVE_ACCEPTED'
  | 'MOVE_REJECTED'
  | 'MATCH_END'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'RECONNECTED'
  | 'REMATCH_REQUESTED'
  | 'REMATCH_STARTING'
  | 'REMATCH_DECLINED'
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
  ws: WebSocket;
  mode: GameMode;
  isRanked: boolean;
  joinedAt: number;
}

interface ConnectedClient {
  ws: WebSocket | null;
  playerId: string;
  username: string;
  matchId: string | null;
  inQueue: boolean;
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
  
  // Connected clients by playerId
  private clients: Map<string, ConnectedClient> = new Map();
  
  // Authoritative engine state per match (source of truth for game logic)
  private engineStates: Map<string, EngineState> = new Map();
  
  // Matchmaking queues (by mode + ranked)
  private queues: Map<string, QueueEntry[]> = new Map();
  
  // Active matches
  private matches: Map<string, MatchState> = new Map();
  
  // Disconnect timeout timers (playerId -> timer)
  private disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  // Disconnect timeout duration (60 seconds)
  private readonly DISCONNECT_TIMEOUT = 60000;
  
  // Match ID counter
  private matchCounter = 0;

  constructor(matchStorage: MatchStorage = createMatchStorage()) {
    this.matchStorage = matchStorage;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server });

    // Initialize queues
    this.queues.set('MODE_1_casual', []);
    this.queues.set('MODE_2_casual', []);
    this.queues.set('MODE_1_ranked', []);
    this.queues.set('MODE_2_ranked', []);

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
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    console.log('✅ WebSocket server initialized');
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
        this.handleJoinQueue(ws, event.payload, setClientId);
        break;

      case 'LEAVE_QUEUE':
        this.handleLeaveQueue(clientId);
        break;

      case 'JOIN_MATCH':
        this.handleJoinMatch(ws, event.payload, setClientId);
        break;

      case 'LEAVE_MATCH':
        this.handleLeaveMatch(clientId);
        break;

      case 'MAKE_MOVE':
        this.handleMakeMove(clientId, event.payload, ws);
        break;

      case 'FORFEIT':
        this.handleForfeit(clientId);
        break;

      case 'REMATCH_REQUEST':
        this.handleRematchRequest(clientId, event.payload);
        break;

      case 'REMATCH_ACCEPT':
        this.handleRematchAccept(clientId, event.payload);
        break;

      case 'REMATCH_DECLINE':
        this.handleRematchDecline(clientId, event.payload);
        break;

      case 'RECONNECT':
        this.handleReconnect(ws, event.payload, setClientId);
        break;

      case 'PING':
        this.send(ws, { type: 'PONG', payload: { timestamp: Date.now() } });
        break;

      default:
        this.send(ws, { type: 'ERROR', payload: { message: `Unknown event type: ${event.type}` } });
    }
  }

  /**
   * Handle JOIN_QUEUE
   */
  private handleJoinQueue(
    ws: WebSocket,
    payload: { playerId: string; username?: string; mode: GameMode; isRanked?: boolean },
    setClientId: (id: string) => void
  ) {
    const { playerId, username = 'Player', mode = 'MODE_1', isRanked = false } = payload;

    // Register client
    setClientId(playerId);
    this.clients.set(playerId, {
      ws,
      playerId,
      username,
      matchId: null,
      inQueue: true,
    });

    // Add to queue
    const queueKey = `${mode}_${isRanked ? 'ranked' : 'casual'}`;
    const queue = this.queues.get(queueKey) || [];

    // Remove if already in queue
    const existingIndex = queue.findIndex((e) => e.playerId === playerId);
    if (existingIndex !== -1) {
      queue.splice(existingIndex, 1);
    }

    const entry: QueueEntry = {
      playerId,
      username,
      ws,
      mode,
      isRanked,
      joinedAt: Date.now(),
    };

    queue.push(entry);
    this.queues.set(queueKey, queue);

    console.log(`📥 ${username} joined ${queueKey} queue (${queue.length} in queue)`);

    // Send confirmation
    this.send(ws, {
      type: 'QUEUE_JOINED',
      payload: {
        position: queue.length,
        estimatedWait: queue.length > 1 ? 0 : 30000,
        mode,
        isRanked,
      },
    });

    // Try to match
    this.tryMatch(queueKey);
  }

  /**
   * Handle LEAVE_QUEUE
   */
  private handleLeaveQueue(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client) return;

    // Remove from all queues
    for (const [queueKey, queue] of this.queues.entries()) {
      const index = queue.findIndex((e) => e.playerId === playerId);
      if (index !== -1) {
        queue.splice(index, 1);
        console.log(`📤 Player ${playerId.slice(0, 8)} left ${queueKey} queue`);
      }
    }

    client.inQueue = false;
    if (client.ws) {
      this.send(client.ws, { type: 'QUEUE_LEFT', payload: {} });
    }
  }

  /**
   * Try to match players in a queue
   */
  private tryMatch(queueKey: string) {
    const queue = this.queues.get(queueKey);
    if (!queue || queue.length < 2) return;

    // Match first two players
    const player1 = queue.shift()!;
    const player2 = queue.shift()!;

    // Create match
    const matchId = `match_${++this.matchCounter}_${Date.now()}`;
    const mode = player1.mode;

    // Randomly assign X/O
    const [playerX, playerO] = Math.random() < 0.5 ? [player1, player2] : [player2, player1];

    const matchState: MatchState = {
      matchId,
      status: 'active',
      mode,
      isRanked: player1.isRanked,
      players: {
        X: { id: playerX.playerId, username: playerX.username, isConnected: true },
        O: { id: playerO.playerId, username: playerO.username, isConnected: true },
      },
      gameState: engineToWireState(initEngineState(mode), mode),
      spectatorCount: 0,
      startedAt: Date.now(),
    };

    this.matches.set(matchId, matchState);
    this.engineStates.set(matchId, initEngineState(mode));

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
    this.send(playerX.ws, {
      type: 'MATCH_FOUND',
      payload: {
        matchId,
        yourPlayer: 'X',
        opponent: { username: playerO.username },
        matchState,
      },
    });

    this.send(playerO.ws, {
      type: 'MATCH_FOUND',
      payload: {
        matchId,
        yourPlayer: 'O',
        opponent: { username: playerX.username },
        matchState,
      },
    });
  }

  /**
   * Handle JOIN_MATCH (for reconnection)
   */
  private handleJoinMatch(
    ws: WebSocket,
    payload: { matchId: string; playerId?: string },
    setClientId: (id: string) => void
  ) {
    const { matchId, playerId } = payload;
    const match = this.matches.get(matchId);

    if (!match) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Match not found' } });
      return;
    }

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
      client.ws = ws;
      client.matchId = matchId;
    } else {
      // New client registration
      this.clients.set(playerId, {
        ws,
        playerId,
        username: match.players[yourPlayer]?.username || 'Player',
        matchId,
        inQueue: false,
      });
    }

    // Clear any disconnect timer since player is back
    this.clearDisconnectTimer(playerId);

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
   * Handle LEAVE_MATCH
   */
  private handleLeaveMatch(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client?.matchId) return;

    const match = this.matches.get(client.matchId);
    if (!match) return;

    // Mark as disconnected
    if (match.players.X?.id === playerId) {
      match.players.X.isConnected = false;
    } else if (match.players.O?.id === playerId) {
      match.players.O.isConnected = false;
    }

    client.matchId = null;
  }

  /**
   * Handle MAKE_MOVE
   */
  private handleMakeMove(connectionId: string, payload: { position: Position; playerId?: string }, ws: WebSocket) {
    // Use playerId from payload if provided, otherwise fall back to connection tracking
    const playerId = payload.playerId || connectionId;
    console.log(`🎯 MAKE_MOVE from ${playerId.slice(0, 12)} (conn: ${connectionId.slice(0, 12)})`, payload.position);
    
    const client = this.clients.get(playerId);
    if (!client?.matchId) {
      console.log(`❌ Client ${playerId.slice(0, 12)} not in a match. Known clients:`, 
        [...this.clients.keys()].map(k => k.slice(0, 12)));
      this.send(ws, { type: 'MOVE_REJECTED', payload: { reason: 'Not in a match' } });
      return;
    }

    // Use the active ws (from the incoming message) for responses
    const activeWs = ws;

    const match = this.matches.get(client.matchId);
    if (!match) {
      this.send(activeWs, { type: 'MOVE_REJECTED', payload: { reason: 'Match not found' } });
      return;
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

    // Get authoritative engine state
    const engineState = this.engineStates.get(client.matchId);
    if (!engineState) {
      this.send(activeWs, { type: 'MOVE_REJECTED', payload: { reason: 'Engine state not found' } });
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
          matchId: client.matchId,
        },
      });
      return;
    }

    // Apply move via engine (single source of truth)
    const newEngineState = executeMove(engineState, match.mode, player, payload.position);
    this.engineStates.set(client.matchId, newEngineState);
    match.gameState = engineToWireState(newEngineState, match.mode);

    console.log(`🎯 ${player} played at (${payload.position.row},${payload.position.col}) in match ${client.matchId.slice(0, 12)}`);

    // Send move accepted to player who made the move
    this.send(activeWs, {
      type: 'MOVE_ACCEPTED',
      payload: { matchId: client.matchId, position: payload.position },
    });

    // Broadcast updated state
    this.broadcastToMatch(client.matchId, {
      type: 'GAME_STATE_UPDATE',
      payload: {
        matchId: client.matchId,
        gameState: match.gameState,
      },
    });

    // Check if game ended
    if (match.gameState.isGameOver) {
      match.status = 'completed';
      
      const duration = Date.now() - (match.startedAt || Date.now());
      
      this.broadcastToMatch(client.matchId, {
        type: 'MATCH_END',
        payload: {
          matchId: client.matchId,
          result: {
            matchId: client.matchId,
            winner: match.gameState.winner,
            isDraw: match.gameState.isDraw,
            winInfo: match.gameState.winInfo || null,
            players: match.players,
            moveCount: match.gameState.moveCount,
            duration,
            endReason: 'win',
          },
          finalGameState: match.gameState,
        },
      });

      console.log(`🏁 Match ${client.matchId.slice(0, 12)} ended - Winner: ${match.gameState.winner || 'Draw'}`);
      void this.persistCompletedMatch(match);

      // Clean up after delay (60s to allow rematch requests)
      setTimeout(() => {
        this.cleanupMatch(client.matchId!);
      }, 60000);
    }
  }

  /**
   * Handle FORFEIT
   */
  private handleForfeit(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client?.matchId) return;

    const match = this.matches.get(client.matchId);
    if (!match || match.status !== 'active') return;

    // Determine winner (opponent)
    let winner: Player | null = null;
    if (match.players.X?.id === playerId) winner = 'O';
    else if (match.players.O?.id === playerId) winner = 'X';

    if (!winner) return;

    match.status = 'completed';
    match.gameState.isGameOver = true;
    match.gameState.winner = winner;

    const duration = Date.now() - (match.startedAt || Date.now());

    this.broadcastToMatch(client.matchId, {
      type: 'MATCH_END',
      payload: {
        matchId: client.matchId,
        result: {
          matchId: client.matchId,
          winner,
          isDraw: false,
          winInfo: null,
          players: match.players,
          moveCount: match.gameState.moveCount,
          duration,
          endReason: 'forfeit',
        },
        finalGameState: match.gameState,
      },
    });

    console.log(`🏳️ Player forfeited in match ${client.matchId.slice(0, 12)} - Winner: ${winner}`);
    void this.persistCompletedMatch(match);

    setTimeout(() => {
      this.cleanupMatch(client.matchId!);
    }, 60000);
  }

  /**
   * Handle REMATCH_REQUEST
   */
  private handleRematchRequest(playerId: string, payload: { matchId: string }) {
    const client = this.clients.get(playerId);
    const match = this.matches.get(payload.matchId);
    
    if (!match || match.status !== 'completed') {
      if (client?.ws) {
        this.send(client.ws, { type: 'ERROR', payload: { message: 'Match not found or not completed' } });
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
  private handleRematchAccept(playerId: string, payload: { matchId: string }) {
    const client = this.clients.get(playerId);
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
    const newMatchState: MatchState = {
      matchId: newMatchId,
      status: 'active',
      mode,
      isRanked: oldMatch.isRanked,
      players: {
        X: oldMatch.players.O ? { ...oldMatch.players.O, isConnected: true } : null,
        O: oldMatch.players.X ? { ...oldMatch.players.X, isConnected: true } : null,
      },
      gameState: engineToWireState(initEngineState(mode), mode),
      spectatorCount: 0,
      startedAt: Date.now(),
    };

    this.matches.set(newMatchId, newMatchState);
    this.engineStates.set(newMatchId, initEngineState(mode));

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
  }

  /**
   * Handle REMATCH_DECLINE
   */
  private handleRematchDecline(playerId: string, payload: { matchId: string }) {
    const client = this.clients.get(playerId);
    const match = this.matches.get(payload.matchId);
    
    if (!match || !match.rematchRequestedBy) {
      return;
    }

    // Find which player declined
    let decliningPlayer: Player | null = null;
    if (match.players.X?.id === playerId) decliningPlayer = 'X';
    else if (match.players.O?.id === playerId) decliningPlayer = 'O';

    match.rematchRequestedBy = null;

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
  private handleDisconnect(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client) return;

    console.log(`🔌 Client disconnected: ${playerId.slice(0, 8)}`);

    // Remove from queues
    for (const [, queue] of this.queues.entries()) {
      const index = queue.findIndex((e) => e.playerId === playerId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    // Mark socket as null (player may reconnect)
    client.ws = null;

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
      this.handleDisconnectTimeout(playerId, matchId);
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
  private handleDisconnectTimeout(playerId: string, matchId: string) {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'active') return;

    // Determine winner (opponent of the disconnected player)
    let winner: Player | null = null;
    if (match.players.X?.id === playerId) winner = 'O';
    else if (match.players.O?.id === playerId) winner = 'X';

    if (!winner) return;

    match.status = 'completed';
    match.gameState.isGameOver = true;
    match.gameState.winner = winner;

    const duration = Date.now() - (match.startedAt || Date.now());

    this.broadcastToMatch(matchId, {
      type: 'MATCH_END',
      payload: {
        matchId,
        result: {
          matchId,
          winner,
          isDraw: false,
          winInfo: null,
          players: match.players,
          moveCount: match.gameState.moveCount,
          duration,
          endReason: 'disconnect',
        },
        finalGameState: match.gameState,
      },
    });

    console.log(`⏱ Disconnect timeout for ${playerId.slice(0, 8)} in match ${matchId.slice(0, 12)} — Winner: ${winner}`);
    void this.persistCompletedMatch(match);

    // Clean up the disconnected client
    this.clients.delete(playerId);

    setTimeout(() => {
      this.cleanupMatch(matchId);
    }, 60000);
  }

  /**
   * Handle RECONNECT event
   * Client sends { type: "RECONNECT", payload: { playerId: "abc123" } }
   * Server finds active match, reassigns socket, sends state
   */
  private handleReconnect(
    ws: WebSocket,
    payload: { playerId: string },
    setClientId: (id: string) => void
  ) {
    const { playerId } = payload;
    if (!playerId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Player ID required for reconnect' } });
      return;
    }

    // Find active match containing this player
    let foundMatchId: string | null = null;
    let yourPlayer: Player | null = null;

    for (const [matchId, match] of this.matches.entries()) {
      if (match.status !== 'active') continue;
      if (match.players.X?.id === playerId) {
        foundMatchId = matchId;
        yourPlayer = 'X';
        break;
      }
      if (match.players.O?.id === playerId) {
        foundMatchId = matchId;
        yourPlayer = 'O';
        break;
      }
    }

    if (!foundMatchId || !yourPlayer) {
      this.send(ws, { type: 'ERROR', payload: { message: 'No active match found for this player' } });
      return;
    }

    const match = this.matches.get(foundMatchId)!;

    // Clear disconnect timer
    this.clearDisconnectTimer(playerId);

    // Update or create client entry
    setClientId(playerId);
    const existingClient = this.clients.get(playerId);
    if (existingClient) {
      existingClient.ws = ws;
      existingClient.matchId = foundMatchId;
    } else {
      this.clients.set(playerId, {
        ws,
        playerId,
        username: match.players[yourPlayer]?.username || 'Player',
        matchId: foundMatchId,
        inQueue: false,
      });
    }

    // Mark player as connected
    if (match.players[yourPlayer]) {
      match.players[yourPlayer]!.isConnected = true;
    }

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
  private cleanupMatch(matchId: string) {
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

    this.matches.delete(matchId);
    this.engineStates.delete(matchId);
    console.log(`🧹 Cleaned up match ${matchId.slice(0, 12)}`);
  }

  /**
   * Broadcast message to all players in a match
   */
  private broadcastToMatch(matchId: string, event: ServerEvent, excludePlayerId?: string) {
    const match = this.matches.get(matchId);
    if (!match) return;

    const playerIds = [match.players.X?.id, match.players.O?.id].filter(Boolean) as string[];

    for (const pid of playerIds) {
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

  private async persistCompletedMatch(match: MatchState): Promise<void> {
    try {
      const mapped = this.toSharedMatchResult(match);
      await this.matchStorage.saveMatch(mapped);
      console.log(`💾 Persisted match ${match.matchId.slice(0, 12)} to storage`);
    } catch (error) {
      console.error(`❌ Failed to persist match ${match.matchId.slice(0, 12)}`, error);
    }
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
}

// Singleton instance
export const wsManager = new WebSocketManager();
