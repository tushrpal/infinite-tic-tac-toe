/**
 * Match Result Builder
 * 
 * Assembles MatchResult from gameplay data.
 * 
 * RULES:
 * - Pure data transformation
 * - No ranking logic
 * - No ELO calculation
 * - No backend assumptions
 * - Uses frozen types from @infinite-ttt/shared
 */

import type {
  MatchResult,
  GameResult,
  MatchPlayer,
  GameMode,
  Difficulty,
  Player,
  Move,
} from '@infinite-ttt/shared';
import { randomBytes } from 'crypto';

/**
 * Generate a unique match ID
 */
function generateMatchId(): string {
  return `match_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Build a MatchResult for Mode 1 (single game)
 */
export function buildMode1MatchResult(params: {
  winner: Player | null;
  moves: Move[];
  boardSize: number;
  difficulty: Difficulty;
  humanPlayer?: Player; // undefined means bot vs bot
  isRanked: boolean;
}): MatchResult {
  const { winner, moves, boardSize, difficulty, humanPlayer, isRanked } = params;

  // Build players array
  const players: MatchPlayer[] = [];
  
  if (humanPlayer !== undefined) {
    // Human vs Bot
    players.push({
      id: 'human',
      type: 'human',
    });
    players.push({
      id: 'bot',
      type: 'bot',
    });
  } else {
    // Bot vs Bot
    players.push({
      id: 'botX',
      type: 'bot',
    });
    players.push({
      id: 'botO',
      type: 'bot',
    });
  }

  // Build single game result
  const gameResult: GameResult = {
    winner,
    totalMoves: moves.length,
    boardSize,
    moves,
  };

  // Determine match winner
  let matchWinner: string | null = null;
  if (winner !== null) {
    if (humanPlayer !== undefined) {
      matchWinner = winner === humanPlayer ? 'human' : 'bot';
    } else {
      matchWinner = winner === 'X' ? 'botX' : 'botO';
    }
  }

  return {
    matchId: generateMatchId(),
    mode: 'mode1',
    isRanked,
    difficulty,
    players,
    games: [gameResult],
    winner: matchWinner,
    roundsPlayed: 1,
    totalMoves: moves.length,
    drawCount: winner === null ? 1 : 0,
    createdAt: Date.now(),
  };
}

/**
 * Build a MatchResult for Mode 2 (multiple rounds)
 */
export function buildMode2MatchResult(params: {
  games: GameResult[];
  difficulty: Difficulty;
  humanPlayer?: Player; // undefined means bot vs bot
  isRanked: boolean;
  scoreX: number;
  scoreO: number;
  targetScore: number;
}): MatchResult {
  const { games, difficulty, humanPlayer, isRanked, scoreX, scoreO, targetScore } = params;

  // Build players array
  const players: MatchPlayer[] = [];
  
  if (humanPlayer !== undefined) {
    // Human vs Bot
    players.push({
      id: 'human',
      type: 'human',
    });
    players.push({
      id: 'bot',
      type: 'bot',
    });
  } else {
    // Bot vs Bot
    players.push({
      id: 'botX',
      type: 'bot',
    });
    players.push({
      id: 'botO',
      type: 'bot',
    });
  }

  // Determine match winner (who reached target score)
  let matchWinner: string | null = null;
  if (scoreX >= targetScore || scoreO >= targetScore) {
    const winningPlayer: Player = scoreX >= targetScore ? 'X' : 'O';
    if (humanPlayer !== undefined) {
      matchWinner = winningPlayer === humanPlayer ? 'human' : 'bot';
    } else {
      matchWinner = winningPlayer === 'X' ? 'botX' : 'botO';
    }
  }

  // Calculate total moves and draws
  const totalMoves = games.reduce((sum, game) => sum + game.totalMoves, 0);
  const drawCount = games.filter((game) => game.winner === null).length;

  return {
    matchId: generateMatchId(),
    mode: 'mode2',
    isRanked,
    difficulty,
    players,
    games,
    winner: matchWinner,
    roundsPlayed: games.length,
    totalMoves,
    drawCount,
    createdAt: Date.now(),
  };
}

/**
 * Convert engine-specific move format to frozen Move format
 * Handles conversion from position-based to index-based moves
 */
export function convertMoveToFrozenFormat(
  player: Player,
  position: { row: number; col: number },
  turn: number,
  boardSize: number
): Move {
  const index = position.row * boardSize + position.col;
  return {
    index,
    player,
    turn,
    timestamp: Date.now(),
  };
}
