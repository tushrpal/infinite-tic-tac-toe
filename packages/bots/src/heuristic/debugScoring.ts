/**
 * Detailed debug of move evaluation
 */

import { Modes } from '@infinite-ttt/game-engine';
import { evaluateMove } from './evaluator.js';
import { getConfig, Difficulty } from '../index.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

// Recreate turn 6 state
let state = createInitialState();
state = applyMove(state, 'X', { row: 0, col: 0 });
state = applyMove(state, 'O', { row: 1, col: 1 });
state = applyMove(state, 'X', { row: 2, col: 2 });
state = applyMove(state, 'O', { row: 1, col: 0 });
state = applyMove(state, 'X', { row: 1, col: 2 });

console.log('Turn 6 board:');
for (let r = 0; r < 3; r++) {
  console.log(state.board[r].map(c => c || '.').join(' '));
}

console.log('\nEvaluating all valid moves for O (bot):');
const config = getConfig(Difficulty.Hard)!;

const validMoves = [1, 2, 6, 7]; // Positions 0,3,4,5,8 are occupied
for (const move of validMoves) {
  const row = Math.floor(move / 3);
  const col = move % 3;
  const score = evaluateMove(state, move, 'O', config);
  console.log(`  Move ${move} (${row},${col}): score = ${score}`);
}
