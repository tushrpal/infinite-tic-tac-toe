/**
 * Online PvP game mode using polling
 * 
 * This module implements online Player vs Player matches.
 * - Backend stores state
 * - Client applies game rules
 * - Client polls for updates
 * - Backend enforces turn ownership only
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Infinite3x3State, Board, Position } from '@infinite-ttt/game-engine';
import type { Player } from '@infinite-ttt/shared';
import type { IdentityManager } from '@infinite-ttt/identity';
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
const POLL_INTERVAL = 2000; // 2 seconds

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
  console.log('  • Polling-based multiplayer');
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

    if (status === 'waiting') {
      console.log('⏳ Waiting for opponent to join...');
      
      // Poll until opponent joins
      let match: PvPMatch;
      while (true) {
        match = await getMatch(matchId);
        if (match.status === 'active') {
          console.log('✅ Opponent joined! Game starting...\n');
          break;
        }
        await sleep(POLL_INTERVAL);
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
      return;
    }

    while (!localState.winner) {
      // Display current state
      console.clear();
      console.log(`\n🎮 Online PvP - You are ${role}\n`);
      printBoard(gameStateToBoard(localState));

      const isMyTurn = currentMatch.currentPlayer === role;

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
          
          // Poll for updated match state to get new currentPlayer
          await sleep(500);
          currentMatch = await getMatch(matchId);
        } catch (error) {
          console.error('❌ Failed to submit move:', (error as Error).message);
          await sleep(2000);
          continue;
        }

      } else {
        // Opponent's turn - poll for updates
        console.log(`\n⏳ Waiting for opponent (${currentMatch.currentPlayer}) to move...`);
        
        let previousMoveCount = localState.currentTurn;
        
        while (true) {
          await sleep(POLL_INTERVAL);
          currentMatch = await getMatch(matchId);
          const serverState = currentMatch.gameState;
          
          // Check if opponent made a move
          if (serverState.currentTurn > previousMoveCount) {
            localState = serverState;
            console.log('✅ Opponent moved!');
            await sleep(1000);
            break;
          }

          // Check if game ended
          if (serverState.winner) {
            localState = serverState;
            break;
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
    
    await sleep(3000);

  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    console.log('\nPlease make sure the backend is running on', BACKEND_URL);
    await sleep(3000);
  }

  printGoodbye();
}
