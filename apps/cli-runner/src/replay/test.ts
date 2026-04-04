/**
 * Replay Viewer Test Script
 * 
 * This script demonstrates and validates the replay viewer functionality.
 * Run this to verify that replay works correctly.
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Move, MatchResult, GameResult } from '@infinite-ttt/shared';
import { replayGame } from './ReplayStepper.js';

/**
 * Create a simple test match for Mode 1
 */
function createTestMatchMode1(): MatchResult {
  // Simulate a game where X wins with a diagonal
  const moves: Move[] = [
    { index: 4, player: 'X', turn: 0, timestamp: Date.now() },     // Center
    { index: 0, player: 'O', turn: 1, timestamp: Date.now() + 1 }, // Top-left
    { index: 8, player: 'X', turn: 2, timestamp: Date.now() + 2 }, // Bottom-right
    { index: 1, player: 'O', turn: 3, timestamp: Date.now() + 3 }, // Top-center
    { index: 0, player: 'X', turn: 4, timestamp: Date.now() + 4 }, // Top-left (wins diagonal)
  ];

  const game: GameResult = {
    winner: 'X',
    totalMoves: 5,
    boardSize: 3,
    moves,
  };

  const match: MatchResult = {
    matchId: 'test_match_mode1',
    mode: 'mode1',
    isRanked: false,
    difficulty: 'medium',
    players: [
      { id: 'testX', type: 'bot' },
      { id: 'testO', type: 'bot' },
    ],
    games: [game],
    winner: 'testX',
    roundsPlayed: 1,
    totalMoves: 5,
    drawCount: 0,
    createdAt: Date.now(),
  };

  return match;
}

/**
 * Verify that replay produces the expected board states
 */
function testMode1Replay(): boolean {
  console.log('🧪 Testing Mode 1 Replay...\n');

  const match = createTestMatchMode1();
  const game = match.games[0];

  // Reconstruct states
  const states = replayGame(game, 'mode1');

  console.log(`✓ Reconstructed ${states.length} states (including initial)`);
  console.log(`✓ Expected: ${game.totalMoves + 1} states\n`);

  // Verify state count
  if (states.length !== game.totalMoves + 1) {
    console.error(`❌ FAIL: Expected ${game.totalMoves + 1} states, got ${states.length}`);
    return false;
  }

  // Check initial state
  const initial = states[0];
  if (initial.board.some((cell) => cell !== null)) {
    console.error('❌ FAIL: Initial board should be empty');
    return false;
  }
  console.log('✓ Initial state is empty');

  // Check final state
  const final = states[states.length - 1];
  if (!final.isGameOver) {
    console.error('❌ FAIL: Final state should have game over');
    return false;
  }
  if (final.winner !== 'X') {
    console.error('❌ FAIL: Final winner should be X');
    return false;
  }
  console.log('✓ Final state has correct winner (X)');

  // Verify move progression
  for (let i = 1; i < states.length; i++) {
    const state = states[i];
    const expectedMoves = i;

    if (state.moves.length !== expectedMoves) {
      console.error(`❌ FAIL: State ${i} should have ${expectedMoves} moves, got ${state.moves.length}`);
      return false;
    }
  }
  console.log('✓ Move progression is correct');

  // Print final board for visual verification
  console.log('\n📊 Final Board State:');
  printBoardSimple(final.board, final.boardSize);

  console.log('\n✅ Mode 1 Replay Test PASSED\n');
  return true;
}

/**
 * Simple board printer for testing
 */
function printBoardSimple(board: any[], size: number): void {
  const colHeader = '  ' + Array.from({ length: size }, (_, i) => i).join(' ');
  console.log(colHeader);

  for (let row = 0; row < size; row++) {
    let rowStr = `${row} `;

    for (let col = 0; col < size; col++) {
      const index = row * size + col;
      const cell = board[index];

      if (cell === 'X') {
        rowStr += 'X';
      } else if (cell === 'O') {
        rowStr += 'O';
      } else {
        rowStr += '·';
      }

      if (col < size - 1) {
        rowStr += ' ';
      }
    }

    console.log(rowStr);
  }
}

/**
 * Test determinism by replaying multiple times
 */
function testDeterminism(): boolean {
  console.log('🧪 Testing Determinism (multiple replays)...\n');

  const match = createTestMatchMode1();
  const game = match.games[0];

  // Replay 3 times
  const replay1 = replayGame(game, 'mode1');
  const replay2 = replayGame(game, 'mode1');
  const replay3 = replayGame(game, 'mode1');

  // Compare lengths
  if (
    replay1.length !== replay2.length ||
    replay2.length !== replay3.length
  ) {
    console.error('❌ FAIL: Replay lengths differ');
    return false;
  }

  console.log(`✓ All replays produced ${replay1.length} states`);

  // Compare each state
  for (let i = 0; i < replay1.length; i++) {
    const s1 = replay1[i];
    const s2 = replay2[i];
    const s3 = replay3[i];

    // Compare boards
    if (
      JSON.stringify(s1.board) !== JSON.stringify(s2.board) ||
      JSON.stringify(s2.board) !== JSON.stringify(s3.board)
    ) {
      console.error(`❌ FAIL: Boards differ at state ${i}`);
      return false;
    }

    // Compare winners
    if (s1.winner !== s2.winner || s2.winner !== s3.winner) {
      console.error(`❌ FAIL: Winners differ at state ${i}`);
      return false;
    }
  }

  console.log('✓ All replays produced identical results');
  console.log('\n✅ Determinism Test PASSED\n');
  return true;
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🎬 REPLAY VIEWER TEST SUITE');
  console.log('═'.repeat(60));
  console.log();

  let allPassed = true;

  // Test 1: Basic Mode 1 Replay
  if (!testMode1Replay()) {
    allPassed = false;
  }

  // Test 2: Determinism
  if (!testDeterminism()) {
    allPassed = false;
  }

  // Summary
  console.log('═'.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
  console.log('═'.repeat(60));
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testMode1Replay, testDeterminism };
