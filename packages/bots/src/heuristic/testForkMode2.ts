/**
 * Quick test to verify fork detection works in Mode 2 (standard 3×3)
 */

import { createHeuristicBot, getConfig, Difficulty } from '../index.js';
import type { GameState } from '../core/types.js';

// Classic fork setup - X at opposite corners
const state: GameState = {
  board: [
    ['X', null, null],
    [null, 'O', null],
    [null, null, 'X'],
  ],
  currentTurn: 3,
  winner: null,
  moveHistory: [],
};

console.log('Board state:');
console.log('X . .');
console.log('. O .');
console.log('. . X');
console.log('\nO to move');

const hardBot = createHeuristicBot(getConfig(Difficulty.Hard)!);
const mediumBot = createHeuristicBot(getConfig(Difficulty.Medium)!);

console.log('\n--- Testing Hard bot (should avoid corners) ---');
const hardMoves = new Map<number, number>();
for (let i = 0; i < 20; i++) {
  const move = hardBot.getMove(state);
  hardMoves.set(move, (hardMoves.get(move) || 0) + 1);
}

console.log('Hard bot move distribution:');
for (const [move, count] of hardMoves.entries()) {
  const row = Math.floor(move / 3);
  const col = move % 3;
  console.log(`  Move ${move} (${row},${col}): ${count} times`);
}

console.log('\n--- Testing Medium bot (may choose corners) ---');
const mediumMoves = new Map<number, number>();
for (let i = 0; i < 20; i++) {
  const move = mediumBot.getMove(state);
  mediumMoves.set(move, (mediumMoves.get(move) || 0) + 1);
}

console.log('Medium bot move distribution:');
for (const [move, count] of mediumMoves.entries()) {
  const row = Math.floor(move / 3);
  const col = move % 3;
  console.log(`  Move ${move} (${row},${col}): ${count} times`);
}

// Check if Hard avoided dangerous corners (2 and 6)
const hardChoseCorner = hardMoves.has(2) || hardMoves.has(6);
console.log(`\n✓ Hard avoided fork-enabling corners: ${!hardChoseCorner ? 'YES' : 'NO'}`);
