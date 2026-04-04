/**
 * CLI Bot-vs-Bot Runner
 * 
 * This is a developer tool for stress-testing the game engine and bots.
 * It simulates full games between two bots using the shared game engine.
 * 
 * STRICT RULES:
 * - No game logic in this file
 * - All rules come from the game engine
 * - No direct state mutation
 * - All moves applied through engine reducer
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Infinite3x3State } from '@infinite-ttt/game-engine';
import { createRandomBot, createHeuristicBot } from '@infinite-ttt/bots';
import type { Bot } from '@infinite-ttt/bots';
import type { Move } from '@infinite-ttt/shared';
import { printBoard, printHeader, printResult, printMove } from './printer.js';
import { StatsTracker } from './stats.js';
import { runHumanVsBot } from './humanVsBot.js';
import { runMode2Game } from './mode2Runner.js';
import { runHumanVsBotMode2 } from './humanVsBotMode2.js';
import { runOnlinePvP } from './onlinePvP.js';
import { buildMode1MatchResult } from './match/matchResultBuilder.js';
import { emitMatchResult } from './match/emitMatchResult.js';
import { showLeaderboard } from './leaderboard/index.js';
import { createLocalMatchStore } from './storage/index.js';
import type { GameMode, Difficulty } from '@infinite-ttt/shared';
import { loadMatch, loadLastMatch, runReplay } from './replay/index.js';
import { buildRankedHistory, buildRankTimeline, printRankedHistory, printRankTimeline } from './ranked-history/index.js';
import { LocalIdentityStore, IdentityManager } from '@infinite-ttt/identity';
import { promptDisplayName } from './input.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

// Create match store instance
const matchStore = createLocalMatchStore();

// Create identity manager instance
// Support custom identity path via PLAYER_ID env var for multi-player testing
const identityPath = process.env.PLAYER_ID ? `${process.env.PLAYER_ID}.json` : undefined;
const identityStore = new LocalIdentityStore(identityPath);
const identityManager = new IdentityManager(identityStore);

/**
 * Configuration for the CLI runner
 */
interface RunnerConfig {
  /** Bot type for player 1 */
  bot1Type: 'random' | 'heuristic';
  /** Bot type for player 2 */
  bot2Type: 'random' | 'heuristic';
  /** Delay between moves in milliseconds (for readability) */
  delayMs?: number;
  /** Number of games to run */
  numGames?: number;
  /** Whether to print each move (verbose mode) */
  verbose?: boolean;
  /** Whether to alternate starting player (match-level fairness) */
  swapStart?: boolean;
  /** Game mode: 1 (Infinite 3x3) or 2 (Expanding Board) */
  mode?: 1 | 2;
  /** Target score for Mode 2 */
  targetScore?: number;
  /** Optional backend URL for remote storage */
  backendUrl?: string;
}

/**
 * Create a bot instance based on type
 */
function createBot(type: 'random' | 'heuristic'): Bot {
  switch (type) {
    case 'random':
      return createRandomBot();
    case 'heuristic':
      return createHeuristicBot();
    default:
      throw new Error(`Unknown bot type: ${type}`);
  }
}

/**
 * Get bot type name for display
 */
function getBotTypeName(type: 'random' | 'heuristic'): string {
  switch (type) {
    case 'random':
      return 'Random Bot';
    case 'heuristic':
      return 'Heuristic Bot';
    default:
      return 'Unknown Bot';
  }
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
function getCurrentPlayer(state: Infinite3x3State): 'X' | 'O' {
  return state.currentTurn % 2 === 0 ? 'X' : 'O';
}

/**
 * Run a single game between two bots
 * 
 * @returns Winner ('X' or 'O') and total turns
 */
async function runSingleGame(
  botX: Bot,
  botO: Bot,
  config: RunnerConfig
): Promise<{ winner: 'X' | 'O' | null; turns: number }> {
  // Initialize game state using engine
  let state: Infinite3x3State = createInitialState();
  
  // Track moves in frozen format for MatchResult
  const frozenMoves: Move[] = [];
  
  if (config.verbose) {
    console.log('\nInitial board:');
    printBoard(state.board);
  }
  
  // Main game loop - continues until winner is detected
  while (state.winner === null) {
    // Identify current player from state
    const currentPlayer = getCurrentPlayer(state);
    
    // Select corresponding bot
    const currentBot = currentPlayer === 'X' ? botX : botO;
    
    // Get move from bot
    let moveIndex: number;
    try {
      moveIndex = currentBot.getMove(state);
    } catch (error) {
      console.error(`Bot error for player ${currentPlayer}:`, error);
      // If bot fails, abort this game
      return { winner: null, turns: state.currentTurn };
    }
    
    // Validate move index range
    if (moveIndex < 0 || moveIndex > 8) {
      console.warn(`Invalid move index ${moveIndex} from ${currentPlayer} bot - out of range`);
    }
    
    // Convert index to position
    const position = {
      row: Math.floor(moveIndex / 3),
      col: moveIndex % 3,
    };
    
    // Apply move using engine reducer (this handles all validation and sliding rule)
    const previousTurn = state.currentTurn;
    state = applyMove(state, currentPlayer, position);
    
    // Check if move was actually applied (engine returns unchanged state for invalid moves)
    if (state.currentTurn === previousTurn) {
      console.warn(`Invalid move from ${currentPlayer} bot at (${position.row},${position.col}) - move rejected by engine`);
      // Engine handled it gracefully by returning unchanged state
      // This shouldn't happen with our bots, but we handle it safely
      // In a real scenario, we might want to let the other player win
      // For now, just abort
      return { winner: null, turns: state.currentTurn };
    }
    
    // Track move in frozen format
    frozenMoves.push({
      index: moveIndex,
      player: currentPlayer,
      turn: previousTurn,
      timestamp: Date.now(),
    });
    
    // Print move and board
    if (config.verbose) {
      printMove(currentPlayer, moveIndex, previousTurn);
      printBoard(state.board);
    }
    
    // Optional delay for readability
    if (config.delayMs && config.delayMs > 0) {
      await sleep(config.delayMs);
    }
    
    // Loop continues - engine will set state.winner when game ends
  }
  
  // Game ended - emit MatchResult
  const matchResult = buildMode1MatchResult({
    winner: state.winner,
    moves: frozenMoves,
    boardSize: 3,
    difficulty: 'medium', // Default for bot vs bot
    humanPlayer: undefined, // Bot vs bot
    isRanked: false,
  });
  
  if (config.verbose) {
    await emitMatchResult(matchResult, config.backendUrl);
  }
  
  // Game ended - return result
  return {
    winner: state.winner,
    turns: state.currentTurn,
  };
}

/**
 * Run Mode 2 match
 */
async function runMode2Match(config: RunnerConfig): Promise<void> {
  const numGames = config.numGames ?? 1;
  const targetScore = config.targetScore ?? 3;
  
  console.log('\n' + '='.repeat(60));
  console.log('  MODE 2: EXPANDING BOARD - BOT VS BOT');
  console.log('='.repeat(60));
  console.log(`  Player 1: ${getBotTypeName(config.bot1Type)}`);
  console.log(`  Player 2: ${getBotTypeName(config.bot2Type)}`);
  console.log(`  Target Score: ${targetScore} rounds per game`);
  console.log(`  Games: ${numGames}`);
  console.log('='.repeat(60));
  
  const player1Bot = createBot(config.bot1Type);
  const player2Bot = createBot(config.bot2Type);
  
  let player1Wins = 0;
  let player2Wins = 0;
  let totalRounds = 0;
  let totalMoves = 0;
  
  for (let i = 0; i < numGames; i++) {
    if (numGames > 1 && !config.verbose) {
      console.log(`\nGame ${i + 1}/${numGames}...`);
    }
    
    const result = await runMode2Game({
      bot1: player1Bot,
      bot2: player2Bot,
      delayMs: config.delayMs ?? 0,
      targetScore,
      verbose: config.verbose ?? (numGames === 1),
      firstPlayer: 'X',
    });
    
    if (result.winner === 1) {
      player1Wins++;
    } else {
      player2Wins++;
    }
    
    totalRounds += result.rounds;
    totalMoves += result.totalMoves;
    
    if (numGames > 1 && !config.verbose) {
      console.log(`  Winner: Player ${result.winner}, Rounds: ${result.rounds}, Total Moves: ${result.totalMoves}`);
    }
  }
  
  if (numGames > 1) {
    console.log('\n' + '='.repeat(60));
    console.log('  MATCH SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Player 1 (${getBotTypeName(config.bot1Type)}): ${player1Wins} wins`);
    console.log(`  Player 2 (${getBotTypeName(config.bot2Type)}): ${player2Wins} wins`);
    console.log(`  Average Rounds: ${(totalRounds / numGames).toFixed(1)}`);
    console.log(`  Average Moves: ${(totalMoves / numGames).toFixed(1)}`);
    console.log('='.repeat(60));
  }
}

/**
 * Run multiple games and collect statistics
 */
async function runMatch(config: RunnerConfig): Promise<void> {
  const numGames = config.numGames ?? 1;
  const tracker = new StatsTracker();
  const swapStart = config.swapStart ?? false;
  
  // Print match header
  if (swapStart) {
    console.log('\n' + '='.repeat(50));
    console.log('  INFINITE TIC-TAC-TOE - MATCH MODE');
    console.log('='.repeat(50));
    console.log(`  Player 1: ${getBotTypeName(config.bot1Type)}`);
    console.log(`  Player 2: ${getBotTypeName(config.bot2Type)}`);
    console.log(`  Fairness: Alternating starting player`);
    console.log('='.repeat(50));
  } else {
    printHeader(
      getBotTypeName(config.bot1Type),
      getBotTypeName(config.bot2Type)
    );
  }
  
  // Create bot instances for player 1 and player 2
  const player1Bot = createBot(config.bot1Type);
  const player2Bot = createBot(config.bot2Type);
  
  // Run games
  for (let i = 0; i < numGames; i++) {
    if (numGames > 1) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`  GAME ${i + 1} of ${numGames}`);
      console.log('='.repeat(50));
    }
    
    // Determine who plays X and O for this game
    let botX: Bot;
    let botO: Bot;
    let player1IsX: boolean;
    
    if (swapStart) {
      // Alternate starting player each game
      // Even games (0, 2, 4...): Player 1 is X
      // Odd games (1, 3, 5...): Player 2 is X
      player1IsX = i % 2 === 0;
      botX = player1IsX ? player1Bot : player2Bot;
      botO = player1IsX ? player2Bot : player1Bot;
      
      if (config.verbose || numGames > 1) {
        console.log(`  ${player1IsX ? 'Player 1 (X)' : 'Player 2 (X)'} vs ${player1IsX ? 'Player 2 (O)' : 'Player 1 (O)'}`);
      }
    } else {
      // Traditional mode: Player 1 always X, Player 2 always O
      botX = player1Bot;
      botO = player2Bot;
      player1IsX = true;
    }
    
    const result = await runSingleGame(botX, botO, config);
    
    // Determine which player won (for match-level tracking)
    let playerWinner: 1 | 2 | null = null;
    if (result.winner !== null) {
      if (swapStart) {
        // Map game winner (X or O) to player identity (1 or 2)
        if (result.winner === 'X') {
          playerWinner = player1IsX ? 1 : 2;
        } else {
          playerWinner = player1IsX ? 2 : 1;
        }
      } else {
        // Traditional mode: X = Player 1, O = Player 2
        playerWinner = result.winner === 'X' ? 1 : 2;
      }
    }
    
    tracker.recordGame(result.winner, result.turns, playerWinner, player1IsX);
    
    if (config.verbose || numGames === 1) {
      printResult(result.winner, result.turns);
    } else {
      // Print summary line for non-verbose multi-game runs
      if (swapStart && playerWinner !== null) {
        console.log(`Game ${i + 1}: Player ${playerWinner} wins (as ${result.winner}), Turns = ${result.turns}`);
      } else {
        console.log(`Game ${i + 1}: Winner = ${result.winner ?? 'None'}, Turns = ${result.turns}`);
      }
    }
  }
  
  // Print statistics if multiple games
  if (numGames > 1) {
    tracker.printSummary(swapStart);
  }
}

/**
 * Main entry point
 */
async function main() {
  // Initialize player identity (load existing or prompt for new)
  const playerIdentity = await identityManager.initialize(promptDisplayName);
  
  // Display player info (short form of UUID)
  const shortId = playerIdentity.playerId.substring(0, 8);
  console.log(`👤 Player: ${playerIdentity.displayName} (id: ${shortId}...)\n`);
  
  // Parse command-line arguments first
  let args = process.argv.slice(2);
  
  // Preprocess args to handle --key=value format
  // Split any --key=value into [--key, value]
  const processedArgs: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('--') && arg.includes('=')) {
      const [key, ...valueParts] = arg.split('=');
      processedArgs.push(key);
      processedArgs.push(valueParts.join('=')); // Rejoin in case URL had = in it
    } else {
      processedArgs.push(arg);
    }
  }
  args = processedArgs;
  
  // Check for help first
  if (args.includes('--help')) {
    printHelp();
    return;
  }
  
  // Check for leaderboard command
  if (args.includes('--leaderboard')) {
    const modeIndex = args.indexOf('--mode');
    const difficultyIndex = args.indexOf('--difficulty');
    const summaryOnly = args.includes('--summary');
    
    const mode = modeIndex !== -1 ? args[modeIndex + 1] as GameMode : undefined;
    const difficulty = difficultyIndex !== -1 ? args[difficultyIndex + 1] as Difficulty : undefined;
    
    await showLeaderboard(matchStore, { mode, difficulty }, summaryOnly);
    return;
  }

  // Check for ranked history command
  if (args.includes('ranked')) {
    const subcommandIndex = args.indexOf('ranked') + 1;
    const subcommand = args[subcommandIndex];
    
    if (!subcommand || (subcommand !== 'history' && subcommand !== 'timeline')) {
      console.error('Error: "ranked" requires a subcommand: "history" or "timeline"');
      console.log('Usage: pnpm dev ranked history [--player <playerId>]');
      console.log('       pnpm dev ranked timeline [--player <playerId>]');
      process.exit(1);
    }
    
    // Get player ID from args or use default
    const playerIndex = args.indexOf('--player');
    const playerId = playerIndex !== -1 ? args[playerIndex + 1] : 'Player1';
    
    // Load all matches
    const allMatches = await matchStore.getAll();
    
    if (subcommand === 'history') {
      // Build and display ranked match history
      const history = buildRankedHistory(allMatches, playerId);
      printRankedHistory(history, playerId);
    } else if (subcommand === 'timeline') {
      // Build and display rank timeline
      const history = buildRankedHistory(allMatches, playerId);
      const timeline = buildRankTimeline(history);
      printRankTimeline(timeline, playerId);
    }
    
    return;
  }
  
  // Check for replay command
  if (args.includes('--replay')) {
    const replayIndex = args.indexOf('--replay');
    const replayArg = args[replayIndex + 1];
    
    let matchResult;
    
    if (!replayArg || replayArg.startsWith('--')) {
      // No argument, show error
      console.error('Error: --replay requires an argument (matchId or "last")');
      console.log('Usage: pnpm dev --replay <matchId>');
      console.log('       pnpm dev --replay last');
      process.exit(1);
    } else if (replayArg === 'last') {
      // Load last match
      matchResult = await loadLastMatch(matchStore);
      
      if (!matchResult) {
        console.error('No matches found. Play some games first!');
        process.exit(1);
      }
    } else {
      // Load specific match by ID
      matchResult = await loadMatch(matchStore, replayArg);
      
      if (!matchResult) {
        console.error(`Match not found: ${replayArg}`);
        process.exit(1);
      }
    }
    
    // Run the replay viewer
    await runReplay(matchResult);
    return;
  }
  
  // Check for interactive mode with mode selection
  const hasInteractive = args.includes('--interactive') || args.includes('-i') || args.includes('--human');
  const hasPvP = args.includes('--pvp') || args.includes('--online');
  const modeIndex = args.indexOf('--mode');
  const mode = modeIndex !== -1 ? parseInt(args[modeIndex + 1], 10) : 1;
  
  // Handle online PvP mode
  if (hasPvP) {
    await runOnlinePvP(identityManager);
    return;
  }
  
  if (hasInteractive) {
    if (mode === 2) {
      // Mode 2: Human vs Bot (Expanding Board)
      await runHumanVsBotMode2(identityManager);
    } else {
      // Mode 1: Human vs Bot (Infinite 3x3)
      await runHumanVsBot(identityManager);
    }
    return;
  }
  
  // Default configuration for bot-vs-bot mode
  const config: RunnerConfig = {
    bot1Type: 'heuristic',
    bot2Type: 'random',
    delayMs: 0, // No delay by default
    numGames: 1,
    verbose: true,
    swapStart: false,
    mode: 1, // Default to Mode 1
    targetScore: 3, // Default for Mode 2
    backendUrl: undefined,
  };
  
  // Continue parsing remaining arguments for bot-vs-bot config
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--interactive':
      case '-i':
        // Already handled above
        break;
      case '--player1':
      case '--p1':
        config.bot1Type = args[++i] as 'random' | 'heuristic';
        break;
      case '--player2':
      case '--p2':
        config.bot2Type = args[++i] as 'random' | 'heuristic';
        break;
      // Legacy support for --x-bot and --o-bot
      case '--x-bot':
        config.bot1Type = args[++i] as 'random' | 'heuristic';
        break;
      case '--o-bot':
        config.bot2Type = args[++i] as 'random' | 'heuristic';
        break;
      case '--delay':
        config.delayMs = parseInt(args[++i], 10);
        break;
      case '--games':
        config.numGames = parseInt(args[++i], 10);
        break;
      case '--swap-start':
        config.swapStart = true;
        break;
      case '--quiet':
        config.verbose = false;
        break;
      case '--mode':
        const modeArg = args[++i];
        config.mode = parseInt(modeArg, 10) as 1 | 2;
        if (config.mode !== 1 && config.mode !== 2) {
          console.error('Mode must be 1 or 2');
          process.exit(1);
        }
        break;
      case '--target-score':
        config.targetScore = parseInt(args[++i], 10);
        break;
      case '--backend-url':
        config.backendUrl = args[++i];
        break;
      case '--help':
        printHelp();
        return;
      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }
  
  // Run the appropriate mode
  if (config.mode === 2) {
    await runMode2Match(config);
  } else {
    await runMatch(config);
  }
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Infinite Tic-Tac-Toe CLI Runner

Usage: pnpm dev [options]

Modes:
  --interactive, -i, --human  Play interactively against a bot (Human vs Bot)
                              Use with --mode to select game mode
  --pvp, --online             Play online against another human (PvP)
  --leaderboard               Show local leaderboard (derived from stored matches)
  --replay <matchId|last>     Replay a completed match
                              Use "last" to replay the most recent match
  ranked history              Show ranked match history with rank changes
  ranked timeline             Show rank progression timeline
  (no flags)                  Run bot-vs-bot simulation (default)

Leaderboard Options:
  --leaderboard              Show the full leaderboard table
  --mode <mode1|mode2>       Filter by game mode [optional]
  --difficulty <easy|medium|hard>  Filter by difficulty level [optional]
  --summary                  Show summary instead of full table [optional]

Bot-vs-Bot Options:
  --mode <1|2>       Game mode: 1 (Infinite 3x3) or 2 (Expanding Board) [default: 1]
  --player1 <type>   Bot type for player 1 (random | heuristic) [default: heuristic]
  --p1 <type>        Alias for --player1
  --player2 <type>   Bot type for player 2 (random | heuristic) [default: random]
  --p2 <type>        Alias for --player2
  --x-bot <type>     Legacy: Bot type for player X (maps to player1)
  --o-bot <type>     Legacy: Bot type for player O (maps to player2)
  --delay <ms>       Delay between moves in milliseconds [default: 0]
  --games <n>        Number of games to run [default: 1]
  --target-score <n> Target score for Mode 2 (rounds to win) [default: 3]
  --swap-start       Enable alternating starting player (Mode 1 match fairness)
  --backend-url <url> Backend URL for remote match storage [optional]
  --quiet            Disable verbose output (summary only)
  --help             Show this help message

Match Fairness:
  Use --swap-start to enable match-level fairness. Players alternate who goes first
  each game, eliminating first-player advantage across the match.

Examples:
  # View leaderboards
  pnpm dev --leaderboard
  pnpm dev --leaderboard --mode mode1
  pnpm dev --leaderboard --mode mode2 --difficulty hard
  pnpm dev --leaderboard --summary

  # View ranked history and timeline
  pnpm dev ranked history
  pnpm dev ranked timeline
  pnpm dev ranked history --player Alice
  pnpm dev ranked timeline --player Bob

  # Replay matches
  pnpm dev --replay last
  pnpm dev --replay match_1768...

  # Interactive Mode 1 - Play against a bot (Infinite 3x3)
  pnpm dev --interactive
  pnpm dev -i
  pnpm dev --human

  # Online PvP - Play against another human
  pnpm dev --pvp
  pnpm dev --online

  # Interactive Mode 2 - Play Expanding Board against a bot
  pnpm dev --mode 2 --human
  pnpm dev --mode 2 -i

  # Mode 1: Single game (traditional mode)
  pnpm dev

  # Mode 2: Single game with expanding board
  pnpm dev --mode 2

  # Mode 2: Multiple games
  pnpm dev --mode 2 --games 5 --quiet

  # Mode 2: Heuristic vs Heuristic
  pnpm dev --mode 2 --p1 heuristic --p2 heuristic

  # Mode 2: Longer match (5 rounds to win)
  pnpm dev --mode 2 --target-score 5

  # Mode 1: Match mode with alternating starts
  pnpm dev --games 10 --swap-start --quiet

  # Mode 1: Watch a game with delay
  pnpm dev --delay 500

  # Mode 1: Large-scale simulation
  pnpm dev --games 100 --swap-start --quiet

  # With backend storage
  pnpm dev --backend-url=http://localhost:3000
  pnpm dev --mode 2 --backend-url=http://localhost:3000
`);
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
