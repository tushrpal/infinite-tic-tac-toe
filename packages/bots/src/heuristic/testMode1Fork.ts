/**
 * Test Mode 1 fork detection - exact scenario from user's game
 * After turn 3: X at (0,0) and (2,2), O at (1,1)
 * Bot (O) should NOT play (2,0) as it allows X to fork
 */

import { Modes } from '@infinite-ttt/game-engine';
import { createHeuristicBot, getConfig, Difficulty } from '../index.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

// Recreate the exact game state from turn 3
let state = createInitialState();
state = applyMove(state, 'X', { row: 0, col: 0 }); // Turn 1: X at (0,0)
state = applyMove(state, 'O', { row: 1, col: 1 }); // Turn 2: O at (1,1) - center
state = applyMove(state, 'X', { row: 2, col: 2 }); // Turn 3: X at (2,2) - opposite corner

console.log('Current board state (after turn 3):');
console.log('X . .');
console.log('. O .');
console.log('. . X');
console.log('\nO to move (turn 4)');
console.log('\nDangerous moves: 6 (2,0) and 2 (0,2) - both allow X to fork');

const hardBot = createHeuristicBot(getConfig(Difficulty.Hard)!);

// Test bot's choice 20 times
const moves = new Map<number, number>();
for (let i = 0; i < 20; i++) {
  const move = hardBot.getMove(state);
  moves.set(move, (moves.get(move) || 0) + 1);
}

console.log('\nHard bot move distribution:');
for (const [move, count] of moves.entries()) {
  const row = Math.floor(move / 3);
  const col = move % 3;
  const danger = (move === 6 || move === 2) ? ' ⚠️ DANGEROUS' : ' ✓ safe';
  console.log(`  Move ${move} (${row},${col}): ${count} times${danger}`);
}

const choseDangerous = moves.has(6) || moves.has(2);
console.log(`\n${choseDangerous ? '❌ FAILED' : '✅ PASSED'}: Hard bot ${choseDangerous ? 'chose dangerous corner' : 'avoided fork-enabling corners'}`);
