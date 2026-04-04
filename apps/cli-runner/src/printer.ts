/**
 * Board printer - renders game state to console
 * 
 * STRICT RULE: This file contains NO game logic.
 * It only reads state and formats output.
 */

import type { Board, Cell } from '@infinite-ttt/game-engine';

/**
 * Format a cell for display
 * X and O are shown as-is, empty cells as '.'
 */
function formatCell(cell: Cell): string {
  if (cell === 'X') return 'X';
  if (cell === 'O') return 'O';
  return '.';
}

/**
 * Print the current board state to console
 * 
 * Format:
 *  X | O | .
 * ---+---+---
 *  . | X | .
 * ---+---+---
 *  O | . | X
 */
export function printBoard(board: Board): void {
  const rows: string[] = [];
  
  for (let row = 0; row < 3; row++) {
    const cells = [
      formatCell(board[row][0]),
      formatCell(board[row][1]),
      formatCell(board[row][2]),
    ];
    rows.push(` ${cells.join(' | ')} `);
  }
  
  const separator = '---+---+---';
  console.log('\n' + rows[0]);
  console.log(separator);
  console.log(rows[1]);
  console.log(separator);
  console.log(rows[2]);
  console.log();
}

/**
 * Print a header for the game
 */
export function printHeader(botXType: string, botOType: string): void {
  console.log('\n' + '='.repeat(50));
  console.log('  INFINITE TIC-TAC-TOE - BOT VS BOT');
  console.log('='.repeat(50));
  console.log(`  Player X: ${botXType}`);
  console.log(`  Player O: ${botOType}`);
  console.log('='.repeat(50));
}

/**
 * Print the game result
 */
export function printResult(winner: 'X' | 'O' | null, totalTurns: number): void {
  console.log('\n' + '='.repeat(50));
  console.log('  GAME OVER');
  console.log('='.repeat(50));
  
  if (winner) {
    console.log(`  Winner: ${winner}`);
  } else {
    console.log('  Result: Draw (unexpected - Mode 1 has no draws)');
  }
  
  console.log(`  Total turns: ${totalTurns}`);
  console.log('='.repeat(50) + '\n');
}

/**
 * Print a move announcement
 */
export function printMove(
  player: 'X' | 'O',
  moveIndex: number,
  turn: number
): void {
  const row = Math.floor(moveIndex / 3);
  const col = moveIndex % 3;
  console.log(`Turn ${turn}: Player ${player} plays at (${row},${col}) [index ${moveIndex}]`);
}
