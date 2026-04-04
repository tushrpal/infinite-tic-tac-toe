/**
 * User-facing prompts and messages
 * 
 * All text that appears to players should be defined here
 * for consistency and easy modification.
 */

/**
 * Display welcome banner
 */
export function printWelcome(): void {
  console.log('\n' + '='.repeat(60));
  console.log('  🎮 INFINITE TIC-TAC-TOE - HUMAN VS BOT');
  console.log('='.repeat(60));
  console.log('\n  Mode 1: Infinite 3×3 (Sliding Moves)');
  console.log('  • Maximum 3 marks per player');
  console.log('  • 4th move removes your oldest mark');
  console.log('  • First to get 3-in-a-row wins!');
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Prompt for player symbol choice
 */
export function promptPlayerSymbol(): void {
  console.log('Choose your symbol:');
  console.log('  X - You play first (first-player advantage)');
  console.log('  O - You play second');
  console.log();
}

/**
 * Prompt for bot opponent choice
 */
export function promptBotChoice(): void {
  console.log('\nChoose your opponent:');
  console.log('  1 - Random Bot (Easy)');
  console.log('  2 - Heuristic Bot (Medium)');
  console.log();
}

/**
 * Prompt for difficulty level
 */
export function promptDifficulty(): void {
  console.log('\nSelect difficulty:');
  console.log('  1 - Easy (Random moves - forgiving, unpredictable)');
  console.log('  2 - Medium (Balanced play - default, beatable)');
  console.log('  3 - Hard (Strategic play - punishing but fair)');
  console.log();
}

/**
 * Display game setup confirmation
 */
export function printGameStart(humanSymbol: 'X' | 'O', botType: string, difficulty?: string): void {
  console.log('\n' + '='.repeat(60));
  console.log('  GAME START');
  console.log('='.repeat(60));
  console.log(`  You: ${humanSymbol}`);
  console.log(`  Bot: ${humanSymbol === 'X' ? 'O' : 'X'} (${botType})`);
  if (difficulty) {
    console.log(`  Difficulty: ${difficulty}`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * Display turn header
 */
export function printTurnHeader(turn: number, currentPlayer: 'X' | 'O'): void {
  console.log(`\n--- Turn ${turn + 1} - ${currentPlayer}'s move ---`);
}

/**
 * Prompt for human move
 */
export function promptMove(): void {
  console.log('\nYour move:');
  console.log('  • Enter 0-8 for board position');
  console.log('  • Or "row col" (e.g., "1 2")');
  console.log('  • Or "h" for help, "q" to quit');
  console.log();
  process.stdout.write('> ');
}

/**
 * Display bot thinking message
 */
export function printBotThinking(): void {
  console.log('\n🤖 Bot is thinking...');
}

/**
 * Display bot move
 */
export function printBotMove(moveIndex: number, symbol: 'X' | 'O'): void {
  const row = Math.floor(moveIndex / 3);
  const col = moveIndex % 3;
  console.log(`🤖 Bot plays ${symbol} at position ${moveIndex} (row ${row}, col ${col})`);
}

/**
 * Display predictive sliding warning (before move)
 */
export function printPredictiveSlideWarning(player: 'X' | 'O', row: number, col: number): void {
  console.log('\n' + '-'.repeat(60));
  console.log(`⚠️  Warning: your next move will slide out ${player} at (${row}, ${col})`);
  console.log('-'.repeat(60));
}

/**
 * Display reactive sliding notification (after move)
 */
export function printReactiveSlideRemoval(player: 'X' | 'O', row: number, col: number): void {
  console.log(`\n⚠️  Sliding rule triggered!`);
  console.log(`Your oldest ${player} at (${row}, ${col}) slid out.`);
}

/**
 * Display invalid move error
 */
export function printInvalidMove(reason: string): void {
  console.log(`\n❌ Invalid move: ${reason}`);
  console.log('Please try again.\n');
}

/**
 * Display win message
 */
export function printWin(winner: 'X' | 'O', isHuman: boolean, turns: number): void {
  console.log('\n' + '='.repeat(60));
  console.log('  GAME OVER');
  console.log('='.repeat(60));
  
  if (isHuman) {
    console.log('  🎉 YOU WIN! 🎉');
  } else {
    console.log('  🤖 BOT WINS');
  }
  
  console.log(`  Winner: ${winner}`);
  console.log(`  Total turns: ${turns}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Display help message
 */
export function printHelp(): void {
  console.log('\n' + '='.repeat(60));
  console.log('  HELP - How to Play');
  console.log('='.repeat(60));
  console.log('\nBoard Positions:');
  console.log('  0 | 1 | 2');
  console.log('  ---------');
  console.log('  3 | 4 | 5');
  console.log('  ---------');
  console.log('  6 | 7 | 8');
  console.log('\nInput Formats:');
  console.log('  • Single number: 0-8 (board position)');
  console.log('  • Row and column: "0 2" (row 0, col 2) = position 2');
  console.log('  • Help: "h" or "help"');
  console.log('  • Quit: "q" or "quit"');
  console.log('\nSliding Rule:');
  console.log('  • You can have maximum 3 marks on the board');
  console.log('  • When you place your 4th mark, your oldest mark is removed');
  console.log('  • This keeps the game dynamic and prevents draws');
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Prompt to play again
 */
export function promptPlayAgain(): void {
  console.log('Play again? (y/n)');
  process.stdout.write('> ');
}

/**
 * Display goodbye message
 */
export function printGoodbye(): void {
  console.log('\n👋 Thanks for playing! Goodbye!\n');
}
