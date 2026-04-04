/**
 * ReplayPrinter - Board rendering for replay viewer
 * 
 * RULES:
 * - No game logic
 * - Read-only display
 * - Works for any board size
 */

import type { GameState, Move, MatchResult, GameResult } from '@infinite-ttt/shared';

/**
 * Print replay header with match information
 */
export function printReplayHeader(
  match: MatchResult,
  gameIndex: number,
  moveIndex: number,
  totalMoves: number
): void {
  const game = match.games[gameIndex];
  
  console.clear();
  console.log('═'.repeat(60));
  console.log(`🎬 REPLAY — MATCH ${match.matchId.substring(0, 12)}...`);
  console.log('═'.repeat(60));
  console.log(`Mode: ${match.mode}`);
  console.log(`Difficulty: ${match.difficulty}`);
  
  if (match.mode === 'mode2') {
    console.log(`Round: ${gameIndex + 1} / ${match.games.length}`);
  }
  
  console.log(`Move: ${moveIndex} / ${totalMoves}`);
  
  if (moveIndex > 0) {
    const currentMove = game.moves[moveIndex - 1];
    console.log(`Player: ${currentMove.player}`);
  } else {
    console.log(`Player: (start)`);
  }
  
  console.log('═'.repeat(60));
  console.log();
}

/**
 * Print the board state
 * 
 * Supports any NxN board size
 */
export function printBoardState(state: GameState): void {
  const size = state.boardSize;
  
  // Print column numbers
  const colHeader = '  ' + Array.from({ length: size }, (_, i) => i).join(' ');
  console.log(colHeader);
  
  // Print each row
  for (let row = 0; row < size; row++) {
    let rowStr = `${row} `;
    
    for (let col = 0; col < size; col++) {
      const index = row * size + col;
      const cell = state.board[index];
      
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
  
  console.log();
}

/**
 * Print game result summary
 */
export function printGameResult(game: GameResult): void {
  console.log('─'.repeat(60));
  
  if (game.winner) {
    console.log(`🏆 Winner: ${game.winner}`);
  } else {
    console.log('🤝 Draw');
  }
  
  console.log(`Total moves: ${game.totalMoves}`);
  console.log('─'.repeat(60));
  console.log();
}

/**
 * Print replay controls help
 */
export function printReplayControls(): void {
  console.log('Controls:');
  console.log('  n → next move');
  console.log('  p → previous move');
  console.log('  a → autoplay (500ms)');
  console.log('  f → fast-forward to end');
  console.log('  r → restart');
  console.log('  q → quit replay');
  console.log();
}

/**
 * Print match summary
 */
export function printMatchSummary(match: MatchResult): void {
  console.log('═'.repeat(60));
  console.log('📊 MATCH SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Match ID: ${match.matchId}`);
  console.log(`Mode: ${match.mode}`);
  console.log(`Difficulty: ${match.difficulty}`);
  console.log(`Rounds played: ${match.roundsPlayed}`);
  console.log(`Total moves: ${match.totalMoves}`);
  console.log(`Draws: ${match.drawCount}`);
  
  if (match.winner) {
    const winnerPlayer = match.players.find(p => p.id === match.winner);
    console.log(`Winner: ${winnerPlayer?.type} (${match.winner})`);
  } else {
    console.log('Winner: Draw');
  }
  
  console.log('═'.repeat(60));
  console.log();
  
  // Print per-game results
  console.log('Game Results:');
  match.games.forEach((game, index) => {
    const result = game.winner ? `${game.winner} wins` : 'Draw';
    console.log(`  Round ${index + 1}: ${result} (${game.totalMoves} moves, ${game.boardSize}×${game.boardSize})`);
  });
  console.log();
}
