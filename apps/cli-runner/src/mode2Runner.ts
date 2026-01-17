/**
 * CLI Bot-vs-Bot Runner for Mode 2: Expanding Board
 * 
 * Simulates full multi-round games between two bots.
 * 
 * NOTE: Current bots are designed for 3×3 boards only.
 * For rounds with boards > 3×3, random moves are used.
 * Future: Extend bots to handle dynamic board sizes.
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { ExpandingBoardState } from '@infinite-ttt/game-engine';
import type { Bot } from '@infinite-ttt/bots';

const {
  createInitialState,
  createNextRoundState,
  applyMove,
  isRoundComplete,
  getRoundStartingPlayer,
} = Modes.ExpandingBoard;

/**
 * Configuration for Mode 2 runner
 */
export interface Mode2Config {
  /** Bot instance for player 1 */
  bot1: Bot;
  /** Bot instance for player 2 */
  bot2: Bot;
  /** Delay between moves in milliseconds */
  delayMs?: number;
  /** Target score to win the game */
  targetScore?: number;
  /** Whether to print each move */
  verbose?: boolean;
  /** First player ('X' or 'O') */
  firstPlayer?: 'X' | 'O';
}

/**
 * Result of a Mode 2 game
 */
export interface Mode2GameResult {
  /** Player who won the game (1 or 2) */
  winner: 1 | 2;
  /** Number of rounds played */
  rounds: number;
  /** Total moves across all rounds */
  totalMoves: number;
  /** Final scores */
  scores: { player1: number; player2: number };
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current player from state
 */
function getCurrentPlayer(state: ExpandingBoardState): 'X' | 'O' {
  return state.currentTurn % 2 === 0 ? 'X' : 'O';
}

/**
 * Print board state for Mode 2 (dynamic size)
 */
function printBoard(state: ExpandingBoardState, verbose: boolean): void {
  if (!verbose) return;
  
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
 * Convert 2D position to linear index for bot interface
 */
function positionToIndex(row: number, col: number, boardSize: number): number {
  return row * boardSize + col;
}

/**
 * Convert linear index to 2D position
 */
function indexToPosition(index: number, boardSize: number): { row: number; col: number } {
  return {
    row: Math.floor(index / boardSize),
    col: index % boardSize,
  };
}

/**
 * Adapt ExpandingBoardState to look like Infinite3x3State for bot compatibility
 */
function adaptStateForBot(state: ExpandingBoardState): any {
  const playerMarks = {
    X: state.moveHistory.filter(m => m.player === 'X'),
    O: state.moveHistory.filter(m => m.player === 'O'),
  };
  
  return {
    board: state.board,
    currentTurn: state.currentTurn,
    winner: state.roundWinner,
    moveHistory: state.moveHistory,
    playerMarks,
  };
}

/**
 * Get valid moves as indices for the current board
 */
function getValidMovesForBoard(state: ExpandingBoardState): number[] {
  const validMoves: number[] = [];
  const board = state.board;
  const size = state.boardSize;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === null) {
        validMoves.push(positionToIndex(row, col, size));
      }
    }
  }
  
  return validMoves;
}

/**
 * Get a random valid move
 */
function getRandomValidMove(state: ExpandingBoardState): number {
  const validMoves = getValidMovesForBoard(state);
  if (validMoves.length === 0) {
    throw new Error('No valid moves available (board is full)');
  }
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

/**
 * Run a single round
 */
async function runRound(
  state: ExpandingBoardState,
  botX: Bot,
  botO: Bot,
  config: Mode2Config
): Promise<ExpandingBoardState> {
  if (config.verbose) {
    console.log(`\n━━━ Round ${state.roundNumber} (${state.boardSize}×${state.boardSize} board) ━━━`);
    printBoard(state, config.verbose || false);
  }
  
  let roundState = state;
  let replayCount = 0;
  const MAX_REPLAYS = 3; // Limit replays to avoid infinite loops
  
  // Play until round is complete
  while (!isRoundComplete(roundState)) {
    const currentPlayer = getCurrentPlayer(roundState);
    const currentBot = currentPlayer === 'X' ? botX : botO;
    
    let moveIndex: number;
    
    // For boards larger than 3×3, use random moves (bots don't support dynamic sizes yet)
    if (roundState.boardSize > 3) {
      moveIndex = getRandomValidMove(roundState);
    } else {
      // For 3×3, use bot intelligence
      const adaptedState = adaptStateForBot(roundState);
      
      try {
        moveIndex = currentBot.getMove(adaptedState);
      } catch (error) {
        if (config.verbose) {
          console.error(`Bot error for player ${currentPlayer}, using random move:`, error);
        }
        moveIndex = getRandomValidMove(roundState);
      }
    }
    
    // Convert index to position
    const position = indexToPosition(moveIndex, roundState.boardSize);
    
    // Validate the position is actually empty (safety check)
    if (roundState.board[position.row]?.[position.col] !== null) {
      if (config.verbose) {
        console.log(`  Bot chose occupied position (${position.row},${position.col}), choosing random valid move`);
      }
      moveIndex = getRandomValidMove(roundState);
      const newPosition = indexToPosition(moveIndex, roundState.boardSize);
      position.row = newPosition.row;
      position.col = newPosition.col;
    }
    
    // Apply move
    const previousTurn = roundState.currentTurn;
    roundState = applyMove(roundState, currentPlayer, position);
    
    // Check if move was applied
    if (roundState.currentTurn === previousTurn) {
      console.warn(`Invalid move from ${currentPlayer} bot at (${position.row},${position.col})`);
      throw new Error(`Invalid move by ${currentPlayer}`);
    }
    
    // Safety check: if board is full but no winner, it's a draw
    const validMovesLeft = getValidMovesForBoard(roundState);
    if (validMovesLeft.length === 0 && !isRoundComplete(roundState)) {
      replayCount++;
      
      if (replayCount > MAX_REPLAYS) {
        // Too many replays, just move to next round without awarding points
        if (config.verbose) {
          console.log('\n🤝 Round ended in a draw after multiple replays');
          console.log('Moving to next round without awarding points.');
        }
        
        // Don't add to round history since there's no winner
        // Just return the current state to trigger round advancement
        return roundState;
      }
      
      if (config.verbose) {
        console.log('\n🤝 Round ended in a draw (board full, no winner)');
        console.log(`This round will be replayed (attempt ${replayCount}/${MAX_REPLAYS}).`);
      }
      // For v1, replay the round (alternative: award 0.5 points each)
      // Reset to start of this round
      const roundStartPlayer = getRoundStartingPlayer(state.roundNumber, config.firstPlayer ?? 'X');
      roundState = createInitialState({ initialBoardSize: state.boardSize, firstPlayer: roundStartPlayer });
      roundState.roundNumber = state.roundNumber;
      roundState.roundHistory = state.roundHistory;
      
      if (config.verbose) {
        console.log(`\n━━━ Replaying Round ${state.roundNumber} (${state.boardSize}×${state.boardSize} board) ━━━`);
        printBoard(roundState, config.verbose || false);
      }
      
      continue; // Restart the while loop
    }
    
    // Print move
    if (config.verbose) {
      console.log(`Turn ${previousTurn}: ${currentPlayer} plays (${position.row},${position.col})`);
      printBoard(roundState, config.verbose || false);
    }
    
    // Optional delay
    if (config.delayMs && config.delayMs > 0) {
      await sleep(config.delayMs);
    }
  }
  
  if (config.verbose) {
    console.log(`🏆 Round ${roundState.roundNumber} winner: ${roundState.roundWinner}`);
  }
  
  return roundState;
}

/**
 * Run a full Mode 2 game (multiple rounds to target score)
 */
export async function runMode2Game(config: Mode2Config): Promise<Mode2GameResult> {
  const targetScore = config.targetScore ?? 3;
  const firstPlayer = config.firstPlayer ?? 'X';
  
  // Initialize game state
  let state = createInitialState({ firstPlayer });
  
  // Track scores for each player identity (1 or 2)
  let player1Score = 0;
  let player2Score = 0;
  let totalMoves = 0;
  
  if (config.verbose) {
    console.log('\n' + '═'.repeat(60));
    console.log('  MODE 2: EXPANDING BOARD');
    console.log('═'.repeat(60));
    console.log(`  Target Score: ${targetScore} rounds`);
    console.log(`  Starting Player: ${firstPlayer}`);
    console.log('═'.repeat(60));
  }
  
  // Play rounds until someone reaches target score
  while (player1Score < targetScore && player2Score < targetScore) {
    // Determine who plays X and O for this round
    const roundStartPlayer = getRoundStartingPlayer(state.roundNumber, firstPlayer);
    const player1IsX = roundStartPlayer === firstPlayer;
    
    const botX = player1IsX ? config.bot1 : config.bot2;
    const botO = player1IsX ? config.bot2 : config.bot1;
    
    if (config.verbose) {
      console.log(`\n${player1IsX ? 'Player 1 (X)' : 'Player 2 (X)'} vs ${player1IsX ? 'Player 2 (O)' : 'Player 1 (O)'}`);
    }
    
    // Run the round
    state = await runRound(state, botX, botO, config);
    totalMoves += state.moveHistory.length;
    
    // Update scores based on round winner
    const roundWinner = state.roundWinner!;
    if (roundWinner === 'X') {
      if (player1IsX) {
        player1Score++;
      } else {
        player2Score++;
      }
    } else {
      if (player1IsX) {
        player2Score++;
      } else {
        player1Score++;
      }
    }
    
    if (config.verbose) {
      console.log(`\n📊 Score: Player 1: ${player1Score}, Player 2: ${player2Score}`);
    }
    
    // Check if game is over
    if (player1Score >= targetScore || player2Score >= targetScore) {
      break;
    }
    
    // Create next round state (board expands)
    const nextStartPlayer = getRoundStartingPlayer(state.roundNumber + 1, firstPlayer);
    state = createNextRoundState(state, nextStartPlayer);
  }
  
  const gameWinner = player1Score >= targetScore ? 1 : 2;
  
  if (config.verbose) {
    console.log('\n' + '═'.repeat(60));
    console.log(`  🎉 GAME WINNER: Player ${gameWinner}`);
    console.log(`  Final Score: ${player1Score}-${player2Score}`);
    console.log(`  Rounds Played: ${state.roundNumber}`);
    console.log(`  Total Moves: ${totalMoves}`);
    console.log('═'.repeat(60));
  }
  
  return {
    winner: gameWinner,
    rounds: state.roundNumber,
    totalMoves,
    scores: { player1: player1Score, player2: player2Score },
  };
}
