/**
 * Input parsing and validation utilities
 * 
 * Handles all user input formats without enforcing game rules.
 * Rule validation is always delegated to the engine.
 */

import * as readline from 'readline';

/**
 * Parse result for move input
 */
export interface ParsedMove {
  type: 'move' | 'quit' | 'help' | 'invalid';
  index?: number;
  error?: string;
}

/**
 * Parse user input into a move or command
 * 
 * Accepts:
 * - Single digit 0-8 (board index)
 * - Two digits "row col" (e.g., "1 2" = index 5)
 * - "h" or "help"
 * - "q" or "quit"
 */
export function parseInput(input: string): ParsedMove {
  const trimmed = input.trim().toLowerCase();
  
  // Check for quit
  if (trimmed === 'q' || trimmed === 'quit') {
    return { type: 'quit' };
  }
  
  // Check for help
  if (trimmed === 'h' || trimmed === 'help') {
    return { type: 'help' };
  }
  
  // Try to parse as single number (0-8)
  if (/^\d$/.test(trimmed)) {
    const index = parseInt(trimmed, 10);
    if (index >= 0 && index <= 8) {
      return { type: 'move', index };
    }
    return {
      type: 'invalid',
      error: `Position ${index} is out of range. Use 0-8.`,
    };
  }
  
  // Try to parse as "row col"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    const row = parseInt(parts[0], 10);
    const col = parseInt(parts[1], 10);
    
    if (isNaN(row) || isNaN(col)) {
      return {
        type: 'invalid',
        error: 'Invalid format. Use "row col" with numbers (e.g., "1 2").',
      };
    }
    
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return {
        type: 'invalid',
        error: `Position (${row}, ${col}) is out of bounds. Use 0-2 for row and col.`,
      };
    }
    
    const index = row * 3 + col;
    return { type: 'move', index };
  }
  
  // Unknown input
  return {
    type: 'invalid',
    error: 'Invalid input. Type "h" for help.',
  };
}

/**
 * Read a line of input from stdin
 */
export function readLine(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.once('line', (line) => {
      rl.close();
      resolve(line);
    });
  });
}

/**
 * Prompt user for input with a custom message
 */
export async function prompt(message: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt user for their display name (for first-time setup)
 */
export async function promptDisplayName(): Promise<string> {
  console.log('\n' + '='.repeat(60));
  console.log('  👋 WELCOME TO INFINITE TIC-TAC-TOE');
  console.log('='.repeat(60));
  console.log('\nFirst, let\'s set up your player identity.\n');
  
  let displayName = '';
  while (!displayName || displayName.length === 0) {
    displayName = await prompt('Enter your display name: ');
    if (!displayName || displayName.length === 0) {
      console.log('❌ Display name cannot be empty. Please try again.\n');
    } else if (displayName.length > 30) {
      console.log('❌ Display name too long (max 30 characters). Please try again.\n');
      displayName = '';
    }
  }
  
  console.log(`\n✅ Welcome, ${displayName}!\n`);
  return displayName;
}

/**
 * Read and parse move input from user
 * Returns null if user wants to quit
 */
export async function getMoveInput(): Promise<ParsedMove> {
  const input = await readLine();
  return parseInput(input);
}

/**
 * Read yes/no input
 */
export async function readYesNo(): Promise<boolean> {
  const input = await readLine();
  const trimmed = input.trim().toLowerCase();
  return trimmed === 'y' || trimmed === 'yes';
}

/**
 * Read player symbol choice (X or O)
 */
export async function readPlayerSymbol(): Promise<'X' | 'O' | null> {
  const input = await readLine();
  const trimmed = input.trim().toUpperCase();
  
  if (trimmed === 'X') return 'X';
  if (trimmed === 'O') return 'O';
  
  console.log('❌ Invalid choice. Please enter X or O.\n');
  return null;
}

/**
 * Read bot choice (1, 2, or 3)
 */
export async function readBotChoice(): Promise<1 | 2 | 3 | null> {
  const input = await readLine();
  const trimmed = input.trim();

  if (trimmed === '1') return 1;
  if (trimmed === '2') return 2;
  if (trimmed === '3') return 3;

  console.log('❌ Invalid choice. Please enter 1, 2, or 3.\n');
  return null;
}

/**
 * Read difficulty choice (1, 2, or 3)
 */
export async function readDifficulty(): Promise<1 | 2 | 3 | null> {
  const input = await readLine();
  const trimmed = input.trim();
  
  if (trimmed === '1') return 1;
  if (trimmed === '2' || trimmed === '') return 2; // Default to Medium
  if (trimmed === '3') return 3;
  
  console.log('❌ Invalid choice. Please enter 1, 2, or 3.\n');
  return null;
}

