/**
 * ReplayCLI - User input handling for replay viewer
 * 
 * RULES:
 * - Non-blocking input (where possible)
 * - Clear command feedback
 * - Simple interface
 */

import * as readline from 'node:readline';

/**
 * Replay command types
 */
export type ReplayCommand =
  | 'next'       // Move to next state
  | 'previous'   // Move to previous state
  | 'autoplay'   // Start autoplay
  | 'fastforward' // Jump to end
  | 'restart'    // Jump to start
  | 'quit';      // Exit replay

/**
 * Wait for user input and return the command
 * 
 * @returns Promise that resolves to the command
 */
export async function waitForCommand(): Promise<ReplayCommand> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question('> ', (answer) => {
      rl.close();
      
      const cmd = answer.trim().toLowerCase();
      
      switch (cmd) {
        case 'n':
        case 'next':
          resolve('next');
          break;
        case 'p':
        case 'prev':
        case 'previous':
          resolve('previous');
          break;
        case 'a':
        case 'auto':
        case 'autoplay':
          resolve('autoplay');
          break;
        case 'f':
        case 'ff':
        case 'fastforward':
          resolve('fastforward');
          break;
        case 'r':
        case 'restart':
          resolve('restart');
          break;
        case 'q':
        case 'quit':
        case 'exit':
          resolve('quit');
          break;
        default:
          // Unknown command, show help and wait again
          console.log(`Unknown command: "${cmd}". Use n/p/a/f/r/q`);
          resolve('next'); // Default to next
      }
    });
  });
}

/**
 * Sleep utility for autoplay
 * 
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
