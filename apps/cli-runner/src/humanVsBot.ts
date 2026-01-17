/**
 * Interactive Human vs Bot game mode
 * 
 * This module implements the interactive CLI for humans to play against bots.
 * All game logic is delegated to the engine - this is purely an interaction layer.
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Infinite3x3State } from '@infinite-ttt/game-engine';
import { createRandomBot, createHeuristicBot } from '@infinite-ttt/bots';
import type { Bot } from '@infinite-ttt/bots';
import { printBoard } from './printer.js';
import {
  printWelcome,
  promptPlayerSymbol,
  promptBotChoice,
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
} from './input.js';

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
  botType: string
): Promise<void> {
  // Initialize fresh game state
  let state: Infinite3x3State = createInitialState();
  const botSymbol: 'X' | 'O' = humanSymbol === 'X' ? 'O' : 'X';
  const humanGoesFirst = humanSymbol === 'X';
  
  printGameStart(humanSymbol, botType);
  
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
}

/**
 * Game setup - choose symbol and opponent
 */
async function setupGame(): Promise<{
  humanSymbol: 'X' | 'O';
  bot: Bot;
  botType: string;
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
  
  // Choose bot
  promptBotChoice();
  process.stdout.write('> ');
  
  let botChoice: 1 | 2 | null = null;
  while (botChoice === null) {
    botChoice = await readBotChoice();
    if (botChoice === null) {
      process.stdout.write('> ');
    }
  }
  
  const bot = botChoice === 1 ? createRandomBot() : createHeuristicBot();
  const botType = botChoice === 1 ? 'Random Bot' : 'Heuristic Bot';
  
  return { humanSymbol, bot, botType };
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
    
    await runGame(setup.humanSymbol, setup.bot, setup.botType);
    
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
