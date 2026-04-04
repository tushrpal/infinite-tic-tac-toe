/**
 * Debug fork detection - trace through the logic
 */

import { Modes } from '@infinite-ttt/game-engine';
import { createHeuristicBot, getConfig, Difficulty } from '../index.js';
import { getValidMoves, indexToPosition } from '../core/types.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

// Recreate the exact game state
let state = createInitialState();
state = applyMove(state, 'X', { row: 0, col: 0 }); // X at (0,0)
state = applyMove(state, 'O', { row: 1, col: 1 }); // O at (1,1)
state = applyMove(state, 'X', { row: 2, col: 2 }); // X at (2,2)

console.log('State after turn 3:');
console.log('X . .');
console.log('. O .');
console.log('. . X');

// Manually check if X can create a fork after O plays (2,0)
console.log('\n=== Testing move 6 (2,0) ===');
const afterMove6 = applyMove(state, 'O', { row: 2, col: 0 });
console.log('After O plays (2,0):');
for (let r = 0; r < 3; r++) {
  const row = afterMove6.board[r].map(c => c || '.').join(' ');
  console.log(row);
}

// Now check each possible X move to see if any create 2+ winning threats
const validXMoves = getValidMoves(afterMove6);
console.log(`\nX has ${validXMoves.length} valid moves: ${validXMoves.join(', ')}`);

for (const xMove of validXMoves) {
  const pos = indexToPosition(xMove);
  const afterXMove = applyMove(afterMove6, 'X', pos);
  
  if (afterXMove === afterMove6) {
    console.log(`  Move ${xMove} (${pos.row},${pos.col}): INVALID`);
    continue; // Invalid
  }
  
  // Check the board state after X's move
  console.log(`  Move ${xMove} (${pos.row},${pos.col}):`);
  for (let r = 0; r < 3; r++) {
    console.log(`    ${afterXMove.board[r].map(c => c || '.').join(' ')}`);
  }
  
  // Check if X has won
  if (afterXMove.winner === 'X') {
    console.log(`    → X WINS immediately! ⚠️`);
    continue;
  }
  
  // Check how many winning moves X would have
  let xWinningMoves = 0;
  const validNextMoves = getValidMoves(afterXMove);
  for (const nextMove of validNextMoves) {
    const nextPos = indexToPosition(nextMove);
    const afterNext = applyMove(afterXMove, 'X', nextPos);
    if (afterNext !== afterXMove && afterNext.winner === 'X') {
      xWinningMoves++;
    }
  }
  
  console.log(`    → X would have ${xWinningMoves} winning moves next turn`);
}
