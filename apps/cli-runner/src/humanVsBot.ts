/**
 * Interactive Human vs Bot game mode
 * 
 * This module implements the interactive CLI for humans to play against bots.
 * All game logic is delegated to the engine - this is purely an interaction layer.
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Infinite3x3State } from '@infinite-ttt/game-engine';
import { createRandomBot, createHeuristicBot, Difficulty, getConfig } from '@infinite-ttt/bots';
import type { Bot } from '@infinite-ttt/bots';
import type { Player, Move } from '@infinite-ttt/shared';
import { printBoard } from './printer.js';
import {
  printWelcome,
  promptPlayerSymbol,
  promptBotChoice,
  promptDifficulty,
  printGameStart,
  printTurnHeader,
  promptMove,
  printBotThinking,
  printBotMove,
  printPredictiveSlideWarning,
  printReactiveSlideRemoval,
  printInvalidMove,
  printWin,
  printHelp,
  promptPlayAgain,
  printGoodbye,
} from './prompts.js';
import {
  getMoveInput,
  readYesNo,
  readPlayerSymbol,
  readBotChoice,
  readDifficulty,
} from './input.js';
import { buildMode1MatchResult } from './match/matchResultBuilder.js';
import { emitMatchResult } from './match/emitMatchResult.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current player from state
 */
function getCurrentPlayer(state: Infinite3x3State): 'X' | 'O' {
  return state.currentTurn % 2 === 0 ? 'X' : 'O';
}

/**
 * Predictive: Check if next move will trigger sliding
 * Returns the position that will be removed, or null
 */
function predictSliding(state: Infinite3x3State, player: 'X' | 'O'): { row: number; col: number } | null {
  const playerMoves = state.playerMarks[player];
  
  // If player already has 3 moves, the oldest (first in array) will be removed
  if (playerMoves.length >= 3) {
    const oldestMove = playerMoves[0];
    return {
      row: oldestMove.position.row,
      col: oldestMove.position.col
    };
  }
  
  return null;
}

/**
 * Reactive: Detect if sliding occurred by diffing state.playerMarks
 * Returns the position that was removed, or null
 */
function detectSlidingOccurred(
  oldState: Infinite3x3State,
  newState: Infinite3x3State,
  player: 'X' | 'O'
): { row: number; col: number } | null {
  const oldMoves = oldState.playerMarks[player];
  const newMoves = newState.playerMarks[player];
  
  // Sliding occurred if a move disappeared
  if (oldMoves.length > newMoves.length) {
    // Find the move that exists in old but not in new
    const removedMove = oldMoves.find(
      oldMove => !newMoves.some(newMove => 
        newMove.position.row === oldMove.position.row &&
        newMove.position.col === oldMove.position.col
      )
    );
    
    if (removedMove) {
      return {
        row: removedMove.position.row,
        col: removedMove.position.col
      };
    }
  }
  
  return null;
}

/**
 * Run a single game session
 */
async function runGame(
  humanSymbol: 'X' | 'O',
  bot: Bot,
  botType: string,
  difficulty: string
): Promise<void> {
  // Initialize fresh game state
  let state: Infinite3x3State = createInitialState();
  const botSymbol: 'X' | 'O' = humanSymbol === 'X' ? 'O' : 'X';
  const humanGoesFirst = humanSymbol === 'X';
  
  printGameStart(humanSymbol, botType, difficulty);
  
  // Track moves in frozen format for MatchResult
  const frozenMoves: Move[] = [];
  
  // Main game loop
  while (state.winner === null) {
    const currentPlayer = getCurrentPlayer(state);
    const isHumanTurn = currentPlayer === humanSymbol;
    
    // Display current state
    printTurnHeader(state.currentTurn, currentPlayer);
    printBoard(state.board);
    
    // Predictive warning: show what will be removed if sliding applies
    const predictedRemoval = predictSliding(state, currentPlayer);
    if (predictedRemoval) {
      printPredictiveSlideWarning(currentPlayer, predictedRemoval.row, predictedRemoval.col);
    }
    
    if (isHumanTurn) {
      // Human turn
      let validMove = false;
      
      while (!validMove) {
        promptMove();
        const input = await getMoveInput();
        
        if (input.type === 'quit') {
          console.log('\n👋 Quitting game...\n');
          return;
        }
        
        if (input.type === 'help') {
          printHelp();
          printBoard(state.board);
          continue;
        }
        
        if (input.type === 'invalid') {
          printInvalidMove(input.error || 'Unknown error');
          continue;
        }
        
        // Try to apply move
        const moveIndex = input.index!;
        const position = {
          row: Math.floor(moveIndex / 3),
          col: moveIndex % 3,
        };
        
        const oldState = state;
        const newState = applyMove(state, currentPlayer, position);
        
        // Check if engine accepted the move
        if (newState === state) {
          // Move was rejected by engine
          const board = state.board;
          const cell = board[position.row][position.col];
          
          if (cell !== null) {
            printInvalidMove(`Position ${moveIndex} is already occupied by ${cell}.`);
          } else {
            printInvalidMove(`Position ${moveIndex} is not valid.`);
          }
          continue;
        }
        
        // Move was accepted
        state = newState;
        validMove = true;
        
        // Track move in frozen format
        frozenMoves.push({
          index: moveIndex,
          player: currentPlayer,
          turn: oldState.currentTurn,
          timestamp: Date.now(),
        });
        
        // Reactive detection: check if sliding occurred
        const removedPosition = detectSlidingOccurred(oldState, newState, currentPlayer);
        if (removedPosition) {
          await sleep(300); // Brief pause before showing slide notification
          printReactiveSlideRemoval(currentPlayer, removedPosition.row, removedPosition.col);
        }
      }
    } else {
      // Bot turn
      printBotThinking();
      await sleep(500); // Pause for better pacing
      
      const moveIndex = bot.getMove(state);
      const position = {
        row: Math.floor(moveIndex / 3),
        col: moveIndex % 3,
      };
      
      const oldState = state;
      state = applyMove(state, currentPlayer, position);
      
      printBotMove(moveIndex, botSymbol);
      
      // Track move in frozen format
      frozenMoves.push({
        index: moveIndex,
        player: currentPlayer,
        turn: oldState.currentTurn,
        timestamp: Date.now(),
      });
      
      // Reactive detection: check if sliding occurred
      const removedPosition = detectSlidingOccurred(oldState, state, currentPlayer);
      if (removedPosition) {
        await sleep(300); // Brief pause before showing slide notification
        printReactiveSlideRemoval(currentPlayer, removedPosition.row, removedPosition.col);
      }
      
      await sleep(300); // Brief pause before showing next state
    }
  }
  
  // Game ended - show final state and result
  console.log('\n--- FINAL BOARD ---');
  printBoard(state.board);
  
  const isHumanWinner = state.winner === humanSymbol;
  printWin(state.winner!, isHumanWinner, state.currentTurn);
  
  // Emit MatchResult
  const difficultyEnum = difficulty === 'Easy' ? 'easy' : difficulty === 'Medium' ? 'medium' : 'hard';
  const matchResult = buildMode1MatchResult({
    winner: state.winner,
    moves: frozenMoves,
    boardSize: 3,
    difficulty: difficultyEnum as 'easy' | 'medium' | 'hard',
    humanPlayer: humanSymbol,
    isRanked: false, // CLI matches are not ranked
  });
  
  await emitMatchResult(matchResult);
}

/**
 * Game setup - choose symbol and difficulty
 */
async function setupGame(): Promise<{
  humanSymbol: 'X' | 'O';
  bot: Bot;
  botType: string;
  difficulty: string;
} | null> {
  // Choose symbol
  promptPlayerSymbol();
  process.stdout.write('> ');
  
  let humanSymbol: 'X' | 'O' | null = null;
  while (humanSymbol === null) {
    humanSymbol = await readPlayerSymbol();
    if (humanSymbol === null) {
      process.stdout.write('> ');
    }
  }
  
  // Choose difficulty
  promptDifficulty();
  process.stdout.write('> ');
  
  let difficultyChoice: 1 | 2 | 3 | null = null;
  while (difficultyChoice === null) {
    difficultyChoice = await readDifficulty();
    if (difficultyChoice === null) {
      process.stdout.write('> ');
    }
  }
  
  // Map difficulty choice to Difficulty enum and create appropriate bot
  let difficulty: Difficulty;
  let bot: Bot;
  let botType: string;
  let difficultyLabel: string;
  
  if (difficultyChoice === 1) {
    // Easy - Random Bot
    difficulty = Difficulty.Easy;
    bot = createRandomBot();
    botType = 'Random Bot';
    difficultyLabel = 'Easy';
  } else if (difficultyChoice === 2) {
    // Medium - Heuristic Bot with default config
    difficulty = Difficulty.Medium;
    const config = getConfig(difficulty);
    bot = createHeuristicBot(config!);
    botType = 'Heuristic Bot';
    difficultyLabel = 'Medium';
  } else {
    // Hard - Heuristic Bot with hard config
    difficulty = Difficulty.Hard;
    const config = getConfig(difficulty);
    bot = createHeuristicBot(config!);
    botType = 'Heuristic Bot';
    difficultyLabel = 'Hard';
  }
  
  return { humanSymbol, bot, botType, difficulty: difficultyLabel };
}

/**
 * Main entry point for human vs bot mode
 */
export async function runHumanVsBot(): Promise<void> {
  printWelcome();
  
  let playing = true;
  
  while (playing) {
    const setup = await setupGame();
    
    if (!setup) {
      break;
    }
    
    await runGame(setup.humanSymbol, setup.bot, setup.botType, setup.difficulty);
    
    // Ask to play again
    promptPlayAgain();
    const again = await readYesNo();
    
    if (!again) {
      playing = false;
    } else {
      console.log('\n');
    }
  }
  
  printGoodbye();
}
