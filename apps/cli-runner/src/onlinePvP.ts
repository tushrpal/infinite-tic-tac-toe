/**
 * Online PvP game mode using WebSockets with polling fallback
 * 
 * This module implements online Player vs Player matches.
 * - Backend stores state
 * - Client applies game rules
 * - WebSocket for real-time updates (with polling fallback)
 * - Backend enforces turn ownership only
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Infinite3x3State, Board, Position } from '@infinite-ttt/game-engine';
import type { Player } from '@infinite-ttt/shared';
import type { IdentityManager } from '@infinite-ttt/identity';
import { WebSocket } from 'ws';
import { printBoard } from './printer.js';
import {
  printGameStart,
  printTurnHeader,
  promptMove,
  printInvalidMove,
  printWin,
  printHelp,
  printGoodbye,
} from './prompts.js';
import { getMoveInput } from './input.js';
import { buildMode1MatchResult } from './match/matchResultBuilder.js';
import { emitMatchResult } from './match/emitMatchResult.js';
import { promptDisplayName } from './input.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const BACKEND_WS_URL = process.env.BACKEND_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL = 2000; // 2 seconds (fallback only)

interface PvPMatch {
  matchId: string;
  mode: 'mode1' | 'mode2';
  boardSize: number;
  players: {
    X: string;
    O: string;
  };
  currentPlayer: 'X' | 'O';
  gameState: Infinite3x3State;
  lastUpdated: number;
  status: 'waiting' | 'active' | 'completed';
  matchResult?: any;
}

interface WebSocketMessage {
  type: 'join' | 'state-update' | 'match-complete' | 'error';
  playerId?: string;
  matchId?: string;
  payload?: any;
  error?: string;
}

/**
 * WebSocket connection manager with fallback to polling
 */
class PvPConnection {
  private ws: WebSocket | null = null;
  private useWebSocket = true;
  private stateUpdateCallback: ((state: PvPMatch) => void) | null = null;
  private matchCompleteCallback: ((result: any) => void) | null = null;

  constructor(
    private matchId: string,
    private playerId: string
  ) {}

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log('🔌 Connecting via WebSocket...');
        this.ws = new WebSocket(BACKEND_WS_URL);

        const timeout = setTimeout(() => {
          console.log('⚠️  WebSocket connection timeout, falling back to polling');
          this.useWebSocket = false;
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          resolve(false);
        }, 5000);

        this.ws.on('open', () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket connected');
          
          // Send join message
          this.send({
            type: 'join',
            playerId: this.playerId,
            matchId: this.matchId,
          });

          resolve(true);
        });

        this.ws.on('message', (data: Buffer) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ WebSocket message error:', error);
          }
        });

        this.ws.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket error:', error);
          console.log('⚠️  Falling back to polling');
          this.useWebSocket = false;
          resolve(false);
        });

        this.ws.on('close', () => {
          console.log('🔌 WebSocket connection closed');
          this.ws = null;
        });

      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        console.log('⚠️  Falling back to polling');
        this.useWebSocket = false;
        resolve(false);
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'state-update':
        if (this.stateUpdateCallback && message.payload) {
          // Only trigger callback if it's an actual match update, not the join confirmation
          if (message.payload.matchId) {
            this.stateUpdateCallback(message.payload);
          }
        }
        break;

      case 'match-complete':
        if (this.matchCompleteCallback && message.payload) {
          this.matchCompleteCallback(message.payload);
        }
        break;

      case 'error':
        console.error('❌ Server error:', message.error);
        break;
    }
  }

  /**
   * Send message via WebSocket
   */
  private send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Register callback for state updates
   */
  onStateUpdate(callback: (state: PvPMatch) => void) {
    this.stateUpdateCallback = callback;
  }

  /**
   * Register callback for match completion
   */
  onMatchComplete(callback: (result: any) => void) {
    this.matchCompleteCallback = callback;
  }

  /**
   * Check if using WebSocket
   */
  isUsingWebSocket(): boolean {
    return this.useWebSocket && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Close connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create or join a match
 */
async function createOrJoinMatch(
  playerId: string,
  mode: 'mode1' | 'mode2'
): Promise<{ matchId: string; role: 'X' | 'O'; status: string }> {
  const response = await fetch(`${BACKEND_URL}/pvp/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, mode }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create/join match: ${response.statusText}`);
  }

  const data = await response.json();
  return data as { matchId: string; role: 'X' | 'O'; status: string };
}

/**
 * Poll match state
 */
async function getMatch(matchId: string): Promise<PvPMatch> {
  const response = await fetch(`${BACKEND_URL}/pvp/match/${matchId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get match: ${response.statusText}`);
  }

  const data = await response.json();
  return data as PvPMatch;
}

/**
 * Submit a move
 */
async function submitMove(
  matchId: string,
  playerId: string,
  gameState: Infinite3x3State
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/pvp/match/${matchId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, gameState }),
  });

  if (!response.ok) {
    const error: any = await response.json();
    throw new Error(error.error || 'Failed to submit move');
  }
}

/**
 * Complete match with result
 */
async function completeMatch(matchId: string, matchResult: any): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/pvp/match/${matchId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchResult }),
  });

  if (!response.ok) {
    throw new Error(`Failed to complete match: ${response.statusText}`);
  }
}

/**
 * Convert GameState to Board for printing
 */
function gameStateToBoard(state: Infinite3x3State): Board {
  if (!state || !state.board) {
    // Return empty board if state is invalid
    return [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
  }
  return state.board;
}

/**
 * Convert index to position
 */
function indexToPosition(index: number): Position {
  return {
    row: Math.floor(index / 3),
    col: index % 3,
  };
}

/**
 * Main PvP game loop
 */
export async function runOnlinePvP(identityManager: IdentityManager): Promise<void> {
  console.clear();
  console.log('\n' + '='.repeat(60));
  console.log('  🌐 INFINITE TIC-TAC-TOE - ONLINE PVP');
  console.log('='.repeat(60));
  console.log('\n  Mode 1: Infinite 3×3 (Sliding Moves)');
  console.log('  • Play against another human online');
  console.log('  • Real-time WebSocket updates with polling fallback');
  console.log('\n' + '='.repeat(60) + '\n');

  // Initialize identity
  const identity = await identityManager.initialize(promptDisplayName);
  console.log(`\n🎮 Player: ${identity.displayName} (${identity.playerId.slice(0, 8)}...)`);
  console.log('📡 Connecting to backend...\n');

  try {
    // Create or join match
    console.log('🔍 Looking for opponent...');
    const { matchId, role, status } = await createOrJoinMatch(identity.playerId, 'mode1');
    
    console.log(`\n✅ Match ${status === 'waiting' ? 'created' : 'joined'}!`);
    console.log(`🎯 You are playing as: ${role}`);
    console.log(`🆔 Match ID: ${matchId.slice(0, 8)}...\n`);

    // Create WebSocket connection
    const connection = new PvPConnection(matchId, identity.playerId);
    const wsConnected = await connection.connect();

    if (!wsConnected) {
      console.log('📡 Using polling mode for updates\n');
    } else {
      console.log('⚡ Using WebSocket for instant updates\n');
    }

    // Track state updates
    let stateUpdateReceived = false;
    let latestMatch: PvPMatch | null = null;

    // Register WebSocket callbacks
    connection.onStateUpdate((match) => {
      latestMatch = match;
      stateUpdateReceived = true;
    });

    if (status === 'waiting') {
      console.log('⏳ Waiting for opponent to join...');
      
      // Wait until opponent joins
      let match: PvPMatch;
      while (true) {
        if (connection.isUsingWebSocket() && stateUpdateReceived && latestMatch) {
          // WebSocket update received
          match = latestMatch;
          stateUpdateReceived = false;
          
          if (match.status === 'active') {
            console.log('✅ Opponent joined! Game starting...\n');
            break;
          }
        } else {
          // Polling fallback
          match = await getMatch(matchId);
          if (match.status === 'active') {
            console.log('✅ Opponent joined! Game starting...\n');
            break;
          }
        }
        
        await sleep(connection.isUsingWebSocket() ? 500 : POLL_INTERVAL);
      }
    }

    // Game loop
    let currentMatch = await getMatch(matchId);
    let localState = currentMatch.gameState;
    
    // Get opponent's player ID for match result
    const opponentRole = role === 'X' ? 'O' : 'X';
    const opponentId = currentMatch.players[opponentRole];

    if (!localState || !localState.board) {
      console.error('❌ Error: Invalid game state received from server');
      console.error('Game state:', JSON.stringify(localState, null, 2));
      connection.close();
      return;
    }

    while (!localState.winner) {
      const isMyTurn = currentMatch.currentPlayer === role;

      // Display current state
      console.clear();
      console.log(`\n🎮 Online PvP - You are ${role}`);
      console.log(`${connection.isUsingWebSocket() ? '⚡ WebSocket' : '📡 Polling'}\n`);
      printBoard(gameStateToBoard(localState));

      if (isMyTurn) {
        // My turn - get move from player
        printTurnHeader(localState.currentTurn, role as Player);
        promptMove();

        const moveInput = await getMoveInput();

        if (moveInput.type === 'help') {
          printHelp();
          await sleep(3000);
          continue;
        }

        if (moveInput.type === 'quit') {
          console.log('\n👋 Quitting game...');
          connection.close();
          return;
        }

        if (moveInput.type !== 'move' || moveInput.index === undefined) {
          printInvalidMove('Invalid move input');
          await sleep(1500);
          continue;
        }

        // Apply move locally using engine
        const position = indexToPosition(moveInput.index);
        const newState = applyMove(localState, role as Player, position);

        // Check if move was valid (state changed)
        if (newState.currentTurn === localState.currentTurn) {
          printInvalidMove('Cell is occupied');
          await sleep(1500);
          continue;
        }

        localState = newState;

        // Submit to backend
        try {
          await submitMove(matchId, identity.playerId, localState);
          console.log('✅ Move submitted');
          
          // Wait for state update
          if (connection.isUsingWebSocket()) {
            // WebSocket will update automatically
            stateUpdateReceived = false;
            const startTime = Date.now();
            while (!stateUpdateReceived && Date.now() - startTime < 3000) {
              await sleep(100);
            }
            if (latestMatch) {
              currentMatch = latestMatch;
            } else {
              // Fallback to polling if no update received
              currentMatch = await getMatch(matchId);
            }
          } else {
            // Polling fallback
            await sleep(500);
            currentMatch = await getMatch(matchId);
          }
        } catch (error) {
          console.error('❌ Failed to submit move:', (error as Error).message);
          await sleep(2000);
          continue;
        }

      } else {
        // Opponent's turn - wait for updates
        console.log(`\n⏳ Waiting for opponent (${currentMatch.currentPlayer}) to move...`);
        
        let previousMoveCount = localState.currentTurn;
        
        while (true) {
          if (connection.isUsingWebSocket() && stateUpdateReceived && latestMatch) {
            // WebSocket update received
            currentMatch = latestMatch;
            const serverState = currentMatch.gameState;
            stateUpdateReceived = false;
            
            // Safety check for undefined state
            if (!serverState || !serverState.board) {
              continue;
            }
            
            if (serverState.currentTurn > previousMoveCount) {
              localState = serverState;
              console.log('✅ Opponent moved!');
              await sleep(1000);
              break;
            }

            if (serverState.winner) {
              localState = serverState;
              break;
            }
          } else {
            // Polling fallback
            await sleep(connection.isUsingWebSocket() ? 500 : POLL_INTERVAL);
            currentMatch = await getMatch(matchId);
            const serverState = currentMatch.gameState;
            
            // Safety check for undefined state
            if (!serverState || !serverState.board) {
              continue;
            }
            
            if (serverState.currentTurn > previousMoveCount) {
              localState = serverState;
              console.log('✅ Opponent moved!');
              await sleep(1000);
              break;
            }

            if (serverState.winner) {
              localState = serverState;
              break;
            }
          }
        }
      }
    }

    // Game over - display result
    console.clear();
    console.log(`\n🎮 Online PvP - Game Over!\n`);
    printBoard(gameStateToBoard(localState));

    const winningPlayer: Player = localState.winner as Player;
    const iWon = winningPlayer === role;
    printWin(winningPlayer, iWon, localState.currentTurn);
    
    // Additional message
    console.log(iWon ? '\n🎉 You won!' : '\n😔 You lost!');

    // Build and emit match result
    console.log('\n📊 Saving match result...');
    
    // Build PvP match result
    const players: Array<{id: string, type: 'human' | 'bot'}> = [
      { id: role === 'X' ? identity.playerId : opponentId, type: 'human' },
      { id: role === 'O' ? identity.playerId : opponentId, type: 'human' },
    ];
    
    const matchResult = {
      matchId: matchId,
      mode: 'mode1' as const,
      isRanked: false, // PvP matches are not ranked (yet)
      difficulty: null as any, // No difficulty for PvP
      players,
      games: [{
        winner: localState.winner,
        totalMoves: localState.moveHistory.length,
        boardSize: 3,
        moves: localState.moveHistory.map(move => ({
          index: move.position.row * 3 + move.position.col,
          player: move.player,
          turn: move.turn,
          timestamp: Date.now(),
        })),
      }],
      winner: localState.winner ? (localState.winner === role ? identity.playerId : opponentId) : null,
      roundsPlayed: 1,
      totalMoves: localState.moveHistory.length,
      drawCount: localState.winner ? 0 : 1,
      createdAt: Date.now(),
    };

    await emitMatchResult(matchResult);
    await completeMatch(matchId, matchResult);

    console.log('✅ Match result saved!');
    
    // Close WebSocket connection
    connection.close();
    
    await sleep(3000);

  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    console.log('\nPlease make sure the backend is running on', BACKEND_URL);
    await sleep(3000);
  }

  printGoodbye();
}
