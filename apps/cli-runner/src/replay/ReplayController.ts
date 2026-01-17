/**
 * ReplayController - Orchestrates the replay flow
 * 
 * RULES:
 * - Stateful navigation (current position)
 * - No data mutation (read-only)
 * - Deterministic replay
 */

import type { MatchResult, GameState } from '@infinite-ttt/shared';
import { replayGame } from './ReplayStepper.js';
import {
  printReplayHeader,
  printBoardState,
  printGameResult,
  printReplayControls,
  printMatchSummary,
} from './ReplayPrinter.js';
import { waitForCommand, sleep } from './ReplayCLI.js';
import type { ReplayCommand } from './ReplayCLI.js';

/**
 * Replay controller state
 */
interface ReplayState {
  /** Current game index (for mode2 multi-round) */
  gameIndex: number;
  
  /** Current move index within the game */
  moveIndex: number;
  
  /** All reconstructed states for current game */
  states: GameState[];
  
  /** Total moves in current game */
  totalMoves: number;
}

/**
 * Run the replay viewer for a match
 * 
 * @param match - The match to replay
 */
export async function runReplay(match: MatchResult): Promise<void> {
  // Print match summary
  printMatchSummary(match);
  
  console.log('Press Enter to start replay...');
  await waitForCommand();
  
  // Start with first game
  let gameIndex = 0;
  
  while (gameIndex < match.games.length) {
    const game = match.games[gameIndex];
    
    // Reconstruct all states for this game
    const states = replayGame(game, match.mode);
    
    // Create replay state
    const replayState: ReplayState = {
      gameIndex,
      moveIndex: 0,
      states,
      totalMoves: game.totalMoves,
    };
    
    // Replay this game
    const result = await replayGameLoop(match, replayState);
    
    if (result === 'quit') {
      return; // Exit replay
    }
    
    if (result === 'next-game') {
      gameIndex++; // Move to next game
    }
    
    if (result === 'restart-match') {
      gameIndex = 0; // Restart from first game
    }
  }
  
  // All games completed
  console.log('═'.repeat(60));
  console.log('🎬 REPLAY COMPLETE');
  console.log('═'.repeat(60));
  console.log();
}

/**
 * Main replay loop for a single game
 */
async function replayGameLoop(
  match: MatchResult,
  state: ReplayState
): Promise<'quit' | 'next-game' | 'restart-match'> {
  let running = true;
  let autoplay = false;
  
  while (running) {
    const game = match.games[state.gameIndex];
    
    // Display current state
    printReplayHeader(match, state.gameIndex, state.moveIndex, state.totalMoves);
    printBoardState(state.states[state.moveIndex]);
    
    // Show result if at end
    if (state.moveIndex === state.totalMoves) {
      printGameResult(game);
      
      // If this is the last game, offer to quit or restart
      if (state.gameIndex === match.games.length - 1) {
        console.log('End of match. Press r to restart, q to quit.');
        printReplayControls();
        
        const cmd = await waitForCommand();
        
        if (cmd === 'quit') {
          return 'quit';
        }
        if (cmd === 'restart') {
          return 'restart-match';
        }
        
        return 'quit'; // Default to quit at end
      } else {
        console.log('End of round. Press Enter to continue to next round, r to restart match, q to quit.');
        printReplayControls();
        
        const cmd = await waitForCommand();
        
        if (cmd === 'quit') {
          return 'quit';
        }
        if (cmd === 'restart') {
          return 'restart-match';
        }
        
        return 'next-game'; // Move to next game
      }
    }
    
    // Show controls
    printReplayControls();
    
    // Handle autoplay
    if (autoplay) {
      await sleep(500);
      state.moveIndex++;
      
      if (state.moveIndex > state.totalMoves) {
        state.moveIndex = state.totalMoves;
        autoplay = false;
      }
      
      continue;
    }
    
    // Wait for command
    const cmd = await waitForCommand();
    
    // Handle command
    switch (cmd) {
      case 'next':
        if (state.moveIndex < state.totalMoves) {
          state.moveIndex++;
        }
        break;
        
      case 'previous':
        if (state.moveIndex > 0) {
          state.moveIndex--;
        }
        break;
        
      case 'autoplay':
        autoplay = true;
        break;
        
      case 'fastforward':
        state.moveIndex = state.totalMoves;
        break;
        
      case 'restart':
        state.moveIndex = 0;
        break;
        
      case 'quit':
        return 'quit';
    }
  }
  
  return 'quit';
}
