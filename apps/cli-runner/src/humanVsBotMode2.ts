/**
 * Human vs Bot Interactive Mode for Mode 2: Expanding Board
 * 
 * UX-focused implementation that emphasizes:
 * - Clear round progression
 * - Pacing and player understanding
 * - Explicit explanations for transitions
 * - Friendly error handling
 */

import * as readline from 'readline';
import { Modes, type Player, type Position } from '@infinite-ttt/game-engine';
import { createHeuristicBot, createRandomBot, type Bot } from '@infinite-ttt/bots';
// Note: Not importing printBoard from printer.js as it's hardcoded for 3×3

const { ExpandingBoard } = Modes;
const {
  createInitialState,
  applyMove,
  isValidMove,
  isRoundComplete,
  detectWinner,
  createNextRoundState,
  getRoundStartingPlayer,
} = ExpandingBoard;

type ExpandingBoardState = ReturnType<typeof createInitialState>;

/**
 * Configuration for Human vs Bot Mode 2
 */
interface HumanVsBotMode2Config {
  humanPlayer: Player;
  botType: 'random' | 'heuristic';
  targetScore: number;
  botThinkingDelay: number; // milliseconds
}

/**
 * Print board state for any size
 */
function printBoard(state: ExpandingBoardState): void {
  const board = state.board;
  const size = state.boardSize;
  
  console.log();
  
  // Print column indices
  console.log('  ' + Array.from({ length: size }, (_, i) => i).join(' '));
  
  // Print rows
  for (let row = 0; row < size; row++) {
    const rowStr = board[row]
      .map((cell: any) => (cell === null ? '·' : cell))
      .join(' ');
    console.log(`${row} ${rowStr}`);
  }
  
  console.log();
}

/**
 * Get valid moves for the current board state
 */
function getValidMoves(state: ExpandingBoardState): number[] {
  const moves: number[] = [];
  const size = state.boardSize;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (state.board[row][col] === null) {
        moves.push(row * size + col);
      }
    }
  }
  
  return moves;
}

/**
 * Convert board index to position
 */
function indexToPosition(index: number, boardSize: number): Position {
  return {
    row: Math.floor(index / boardSize),
    col: index % boardSize,
  };
}

/**
 * Convert position to board index
 */
function positionToIndex(row: number, col: number, boardSize: number): number {
  return row * boardSize + col;
}

/**
 * Get current player from state
 */
function getCurrentPlayer(state: ExpandingBoardState): Player {
  return state.currentTurn % 2 === 0 ? 'X' : 'O';
}

/**
 * Calculate scores from round history
 */
function calculateScores(state: ExpandingBoardState): { scoreX: number; scoreO: number } {
  let scoreX = 0;
  let scoreO = 0;
  
  for (const result of state.roundHistory) {
    if (result.winner === 'X') scoreX++;
    else if (result.winner === 'O') scoreO++;
  }
  
  return { scoreX, scoreO };
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create readline interface
 */
function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a question and get user input
 */
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * Display game introduction
 */
function displayIntroduction(config: HumanVsBotMode2Config): void {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  🎮 MODE 2: EXPANDING BOARD — HUMAN VS BOT');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  You are: ${config.humanPlayer}`);
  console.log(`  Bot is: ${config.humanPlayer === 'X' ? 'O' : 'X'} (${config.botType})`);
  const roundWord = config.targetScore === 1 ? 'round' : 'rounds';
  console.log(`  Target Score: ${config.targetScore} ${roundWord} to win`);
  console.log('════════════════════════════════════════════════════════════\n');
  
  console.log('📖 HOW TO PLAY:\n');
  console.log('  • Boards grow each round: 3×3 → 4×4 → 5×5...');
  console.log('  • Win condition: N-in-a-row (N = board size)');
  console.log('  • Drawn rounds are replayed (up to 3 attempts)');
  console.log('  • First to reach target score wins the game!\n');
  
  console.log('💡 CONTROLS:\n');
  console.log('  • Enter move as: row col (e.g., "1 2")');
  console.log('  • Type "h" for help');
  console.log('  • Type "q" to quit\n');
  
  console.log('Press Enter to start...');
}

/**
 * Display round header
 */
function displayRoundHeader(state: ExpandingBoardState, config: HumanVsBotMode2Config): void {
  const { scoreX, scoreO } = calculateScores(state);
  const humanScore = config.humanPlayer === 'X' ? scoreX : scoreO;
  const botScore = config.humanPlayer === 'X' ? scoreO : scoreX;
  const roundStarter = getRoundStartingPlayer(state.roundNumber, 'X');
  
  console.log(`\n━━━ Round ${state.roundNumber} (${state.boardSize}×${state.boardSize} board) ━━━`);
  console.log(`📊 Score: You ${humanScore} — Bot ${botScore}`);
  console.log(`🎲 Starting player: ${roundStarter}`);
  console.log();
}

/**
 * Display help message
 */
function displayHelp(boardSize: number): void {
  console.log('\n📖 HELP');
  console.log('═══════════════════════════════════════');
  console.log('HOW TO ENTER MOVES:');
  console.log('  • Format: row col (both 0-indexed)');
  console.log(`  • Valid rows: 0 to ${boardSize - 1}`);
  console.log(`  • Valid cols: 0 to ${boardSize - 1}`);
  console.log('  • Example: "1 2" places mark at row 1, column 2\n');
  console.log('COMMANDS:');
  console.log('  h - Show this help');
  console.log('  q - Quit game');
  console.log('═══════════════════════════════════════\n');
}

/**
 * Parse human input into a move
 */
function parseHumanInput(input: string, boardSize: number): Position | 'help' | 'quit' | null {
  const trimmed = input.toLowerCase().trim();
  
  // Handle commands
  if (trimmed === 'h' || trimmed === 'help') return 'help';
  if (trimmed === 'q' || trimmed === 'quit') return 'quit';
  
  // Parse coordinates
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 2) {
    const row = parseInt(parts[0], 10);
    const col = parseInt(parts[1], 10);
    
    if (!isNaN(row) && !isNaN(col)) {
      return { row, col };
    }
  }
  
  return null;
}

/**
 * Get human move with validation
 */
async function getHumanMove(
  rl: readline.Interface,
  state: ExpandingBoardState,
  humanPlayer: Player
): Promise<Position | 'quit'> {
  while (true) {
    const input = await askQuestion(rl, `\n${humanPlayer}'s turn (row col): `);
    const parsed = parseHumanInput(input, state.boardSize);
    
    if (parsed === 'quit') {
      return 'quit';
    }
    
    if (parsed === 'help') {
      displayHelp(state.boardSize);
      continue;
    }
    
    if (parsed === null) {
      console.log('❌ Invalid input. Type "h" for help.');
      continue;
    }
    
    // Validate position
    const { row, col } = parsed;
    
    if (row < 0 || row >= state.boardSize || col < 0 || col >= state.boardSize) {
      console.log(`❌ Out of bounds! Valid range: 0-${state.boardSize - 1}`);
      continue;
    }
    
    if (state.board[row][col] !== null) {
      console.log('❌ Cell already occupied. Choose another.');
      continue;
    }
    
    // Valid move!
    return parsed;
  }
}

/**
 * Get bot move with thinking animation
 */
async function getBotMove(
  state: ExpandingBoardState,
  bot: Bot,
  botPlayer: Player,
  thinkingDelay: number
): Promise<Position> {
  console.log(`\n🤖 ${botPlayer} (Bot) is thinking...`);
  
  // Add delay for better UX
  await sleep(thinkingDelay);
  
  // Adapt state for bot
  // For 3×3 boards, convert to Mode 1 format with playerMarks as Move arrays
  const xMoves: any[] = [];
  const oMoves: any[] = [];
  
  for (let row = 0; row < state.boardSize; row++) {
    for (let col = 0; col < state.boardSize; col++) {
      if (state.board[row][col] === 'X') {
        xMoves.push({ row, col, player: 'X' as Player });
      } else if (state.board[row][col] === 'O') {
        oMoves.push({ row, col, player: 'O' as Player });
      }
    }
  }
  
  const adaptedState = {
    ...state,
    winner: state.roundWinner,
    playerMarks: {
      X: xMoves,
      O: oMoves,
    },
  };
  
  const moveIndex = bot.getMove(adaptedState);
  return indexToPosition(moveIndex, state.boardSize);
}

/**
 * Play a single round
 */
async function playRound(
  rl: readline.Interface,
  state: ExpandingBoardState,
  bot: Bot,
  config: HumanVsBotMode2Config,
  replayCount: number = 0
): Promise<ExpandingBoardState | 'quit'> {
  const MAX_REPLAYS = 3;
  const botPlayer = config.humanPlayer === 'X' ? 'O' : 'X';
  
  displayRoundHeader(state, config);
  printBoard(state);
  
  let roundState = state;
  
  // Play until round is complete
  while (!isRoundComplete(roundState)) {
    const currentPlayer = getCurrentPlayer(roundState);
    const isHumanTurn = currentPlayer === config.humanPlayer;
    
    let position: Position | 'quit';
    
    if (isHumanTurn) {
      position = await getHumanMove(rl, roundState, config.humanPlayer);
      if (position === 'quit') return 'quit';
    } else {
      // Calculate adaptive delay for current board size
      const adaptiveDelay = 200 + roundState.boardSize * 50;
      position = await getBotMove(roundState, bot, botPlayer, adaptiveDelay);
    }
    
    // Apply move
    roundState = applyMove(roundState, currentPlayer, position);
    
    // Display move
    console.log(`\n${currentPlayer} plays (${position.row},${position.col})`);
    printBoard(roundState);
    
    // Check if round ended in draw (board full but no winner)
    const validMoves = getValidMoves(roundState);
    if (validMoves.length === 0 && !isRoundComplete(roundState)) {
      replayCount++;
      
      if (replayCount >= MAX_REPLAYS) {
        console.log('\n🤝 Round ended in a draw after multiple replays.');
        console.log('Moving to next round without awarding points.');
        return roundState;
      }
      
      console.log('\n🤝 Round ended in a draw (board full, no winner).');
      console.log(`This round will be replayed (attempt ${replayCount}/${MAX_REPLAYS}).`);
      console.log('\nPress Enter to replay...');
      await askQuestion(rl, '');
      
      // Reset to start of this round
      const roundStartPlayer = getRoundStartingPlayer(state.roundNumber, 'X');
      roundState = createInitialState({ initialBoardSize: state.boardSize, firstPlayer: roundStartPlayer });
      roundState.roundNumber = state.roundNumber;
      roundState.roundHistory = state.roundHistory;
      
      displayRoundHeader(roundState, config);
      printBoard(roundState);
    }
  }
  
  // Round complete - display result
  const winResult = detectWinner(roundState.board, roundState.boardSize);
  const winner = winResult ? winResult.winner : null;
  const { scoreX, scoreO } = calculateScores(roundState);
  const humanScore = config.humanPlayer === 'X' ? scoreX : scoreO;
  const botScore = config.humanPlayer === 'X' ? scoreO : scoreX;
  
  if (winner) {
    const isHumanWin = winner === config.humanPlayer;
    console.log(`\n🏆 Round ${state.roundNumber} winner: ${winner}${isHumanWin ? ' (You!)' : ' (Bot)'}`);
  }
  
  console.log(`📊 Score: You ${humanScore} — Bot ${botScore}`);
  
  return roundState;
}

/**
 * Play a complete game
 */
async function playGame(rl: readline.Interface, config: HumanVsBotMode2Config): Promise<void> {
  // Create bot
  const bot = config.botType === 'heuristic' ? createHeuristicBot() : createRandomBot();
  
  // Initialize game state
  let state = createInitialState({ firstPlayer: 'X' });
  
  // Play until someone reaches target score
  while (true) {
    const result = await playRound(rl, state, bot, config);
    
    if (result === 'quit') {
      console.log('\n👋 Thanks for playing!');
      return;
    }
    
    state = result;
    
    // Check if game is over
    const { scoreX, scoreO } = calculateScores(state);
    const humanScore = config.humanPlayer === 'X' ? scoreX : scoreO;
    const botScore = config.humanPlayer === 'X' ? scoreO : scoreX;
    
    if (humanScore >= config.targetScore || botScore >= config.targetScore) {
      // Game over!
      const humanWon = humanScore >= config.targetScore;
      
      console.log('\n════════════════════════════════════════════════════════════');
      console.log(`  ${humanWon ? '🎉 YOU WIN!' : '🤖 BOT WINS!'}`);
      console.log('════════════════════════════════════════════════════════════');
      console.log(`  Final Score: You ${humanScore} — Bot ${botScore}`);
      console.log(`  Rounds Played: ${state.roundNumber}`);
      
      // Count exact total moves from all rounds
      const totalMoves = state.moveHistory.length + 
        state.roundHistory.reduce((sum, round) => sum + (round.winningLine?.length || 0) * 2, 0);
      
      console.log(`  Total Moves: ${totalMoves}`);
      console.log('════════════════════════════════════════════════════════════\n');
      
      return;
    }
    
    // Advance to next round
    const nextBoardSize = state.boardSize + 1;
    console.log('\n⏭️  Advancing to next round...');
    console.log(`📈 Board expanding to ${nextBoardSize}×${nextBoardSize}`);
    
    // Add breathing room for longer games with larger boards
    if (config.targetScore > 1 && state.boardSize >= 4) {
      console.log('Press Enter to continue...');
      await askQuestion(rl, '');
    } else {
      // Short pause without blocking
      await sleep(800);
    }
    
    // Determine starting player for next round (alternate)
    const nextRoundStarter = getRoundStartingPlayer(state.roundNumber + 1, 'X');
    state = createNextRoundState(state, nextRoundStarter);
  }
}

/**
 * Prompt for game configuration
 */
async function promptConfiguration(rl: readline.Interface): Promise<HumanVsBotMode2Config> {
  console.log('\n🎮 GAME SETUP\n');
  
  // Choose symbol
  let humanPlayer: Player = 'X';
  while (true) {
    const symbol = await askQuestion(rl, 'Choose your symbol (X/O) [default: X]: ');
    if (symbol === '' || symbol.toUpperCase() === 'X') {
      humanPlayer = 'X';
      break;
    } else if (symbol.toUpperCase() === 'O') {
      humanPlayer = 'O';
      break;
    } else {
      console.log('Invalid choice. Please enter X or O.');
    }
  }
  
  // Choose bot difficulty
  let botType: 'random' | 'heuristic' = 'heuristic';
  while (true) {
    const difficulty = await askQuestion(rl, 'Bot difficulty (random/heuristic) [default: heuristic]: ');
    if (difficulty === '' || difficulty.toLowerCase() === 'heuristic') {
      botType = 'heuristic';
      break;
    } else if (difficulty.toLowerCase() === 'random') {
      botType = 'random';
      break;
    } else {
      console.log('Invalid choice. Please enter "random" or "heuristic".');
    }
  }
  
  // Choose target score
  let targetScore = 2;
  while (true) {
    const scoreInput = await askQuestion(rl, 'Target score (rounds to win) [default: 2]: ');
    if (scoreInput === '') {
      targetScore = 2;
      break;
    }
    const parsed = parseInt(scoreInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      targetScore = parsed;
      break;
    } else {
      console.log('Invalid score. Please enter a number between 1 and 10.');
    }
  }
  
  // Calculate adaptive bot delay based on board size
  // Formula: 200 + boardSize * 50
  // Results: 3×3→350ms, 4×4→400ms, 5×5→450ms, etc.
  const baseBoardSize = 3; // Starting board size
  const adaptiveDelay = 200 + baseBoardSize * 50;
  
  return {
    humanPlayer,
    botType,
    targetScore,
    botThinkingDelay: adaptiveDelay,
  };
}

/**
 * Main entry point for Human vs Bot Mode 2
 */
export async function runHumanVsBotMode2(): Promise<void> {
  const rl = createReadline();
  
  try {
    // Get configuration
    const config = await promptConfiguration(rl);
    
    // Display introduction
    displayIntroduction(config);
    await askQuestion(rl, '');
    
    // Play game loop
    while (true) {
      await playGame(rl, config);
      
      // Ask to play again
      const playAgain = await askQuestion(rl, '\nPlay again? (y/n): ');
      if (playAgain.toLowerCase() !== 'y' && playAgain.toLowerCase() !== 'yes') {
        console.log('\n👋 Thanks for playing!');
        break;
      }
      
      // Ask if they want to change settings
      const changeSettings = await askQuestion(rl, 'Change settings? (y/n) [default: n]: ');
      if (changeSettings.toLowerCase() === 'y' || changeSettings.toLowerCase() === 'yes') {
        const newConfig = await promptConfiguration(rl);
        Object.assign(config, newConfig);
        displayIntroduction(config);
        await askQuestion(rl, '');
      }
    }
  } finally {
    rl.close();
  }
}
