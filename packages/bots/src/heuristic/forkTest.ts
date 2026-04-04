/**
 * Test fork detection manually
 */

import { Modes } from '@infinite-ttt/game-engine';
import { createHeuristicBot, Difficulty, getConfig } from '../index.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

// Set up the classic fork scenario
let state = createInitialState();

console.log('Initial board:');
console.log(state.board.map(row => row.map(cell => cell || '.').join(' ')).join('\n'));

// X plays corner (0,0)
state = applyMove(state, 'X', { row: 0, col: 0 });
console.log('\nAfter X plays (0,0):');
console.log(state.board.map(row => row.map(cell => cell || '.').join(' ')).join('\n'));

// O plays center (1,1)
state = applyMove(state, 'O', { row: 1, col: 1 });
console.log('\nAfter O plays (1,1):');
console.log(state.board.map(row => row.map(cell => cell || '.').join(' ')).join('\n'));

// X plays opposite corner (2,2)
state = applyMove(state, 'X', { row: 2, col: 2 });
console.log('\nAfter X plays (2,2):');
console.log(state.board.map(row => row.map(cell => cell || '.').join(' ')).join('\n'));

// Now test what Hard bot does
const hardConfig = getConfig(Difficulty.Hard);
const hardBot = createHeuristicBot(hardConfig!);

console.log('\n--- Testing Hard Bot Response ---');
for (let i = 0; i < 5; i++) {
  const move = hardBot.getMove(state);
  const row = Math.floor(move / 3);
  const col = move % 3;
  console.log(`Attempt ${i + 1}: Bot chooses move ${move} (${row},${col})`);
}

// Test what happens if bot plays (2,0) - this should allow fork
console.log('\n--- Simulating bot plays (2,0) - FORK SCENARIO ---');
const testState = applyMove(state, 'O', { row: 2, col: 0 });
console.log('Board after O plays (2,0):');
console.log(testState.board.map(row => row.map(cell => cell || '.').join(' ')).join('\n'));

// X can now win - check ALL possible X moves
console.log('\nChecking ALL X moves for winning:');
const possibleMoves = [
  { index: 1, pos: { row: 0, col: 1 } },
  { index: 2, pos: { row: 0, col: 2 } },
  { index: 3, pos: { row: 1, col: 0 } },
  { index: 5, pos: { row: 1, col: 2 } },
  { index: 7, pos: { row: 2, col: 1 } },
];

let winningMoves = 0;
for (const {index, pos} of possibleMoves) {
  const testMove = applyMove(testState, 'X', pos);
  const wins = testMove.winner === 'X';
  console.log(`Move ${index} (${pos.row},${pos.col}): ${wins ? 'WINS' : 'no win'}`);
  if (wins) winningMoves++;
}
console.log(`\nTotal winning moves for X: ${winningMoves} (Fork = ${winningMoves >= 2 ? 'YES' : 'NO'})`);
