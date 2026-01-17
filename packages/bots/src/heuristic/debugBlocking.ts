/**
 * Debug why bot didn't block the column win on turn 6
 */

import { Modes } from '@infinite-ttt/game-engine';
import { createHeuristicBot, getConfig, Difficulty } from '../index.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

// Recreate turn 6 state
let state = createInitialState();
state = applyMove(state, 'X', { row: 0, col: 0 }); // Turn 1
state = applyMove(state, 'O', { row: 1, col: 1 }); // Turn 2
state = applyMove(state, 'X', { row: 2, col: 2 }); // Turn 3
state = applyMove(state, 'O', { row: 1, col: 0 }); // Turn 4
state = applyMove(state, 'X', { row: 1, col: 2 }); // Turn 5

console.log('Turn 6 - O to move:');
console.log('X . .');
console.log('O O X');
console.log('. . X');
console.log('\nX has 2 in column 2 (positions 5 and 8)');
console.log('O MUST block at position 2 (0,2) to prevent X from winning');

// Check if X can win at position 2
const testWin = applyMove(state, 'X', { row: 0, col: 2 });
console.log(`\nIf X plays position 2: Winner = ${testWin.winner}`);
console.log('Board after X plays (0,2):');
for (let r = 0; r < 3; r++) {
  console.log(testWin.board[r].map(c => c || '.').join(' '));
}
console.log(`X's marks: ${JSON.stringify(testWin.playerMarks.X)}`);

// Now check what the Hard bot chooses
const hardBot = createHeuristicBot(getConfig(Difficulty.Hard)!);

console.log('\nBot decisions (20 trials):');
const moves = new Map<number, number>();
for (let i = 0; i < 20; i++) {
  const move = hardBot.getMove(state);
  moves.set(move, (moves.get(move) || 0) + 1);
}

for (const [move, count] of moves.entries()) {
  const row = Math.floor(move / 3);
  const col = move % 3;
  const isBlock = move === 2;
  console.log(`  Position ${move} (${row},${col}): ${count} times ${isBlock ? '✓ BLOCKS WIN' : '✗ does not block'}`);
}

if (!moves.has(2)) {
  console.log('\n❌ CRITICAL BUG: Bot never chose the blocking move!');
} else if (moves.get(2) === 20) {
  console.log('\n✅ Bot correctly blocks every time');
} else {
  console.log(`\n⚠️ Bot only blocks ${moves.get(2)}/20 times`);
}
