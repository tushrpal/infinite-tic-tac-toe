/**
 * Game Adapter
 * Transforms server data into UI-friendly formats
 * This is the ONLY place where server data transformation happens
 */

import type {
  GameState,
  MatchState,
  MatchResult,
  Player,
  Position,
  Move,
  WinInfo,
  GameMode,
  PlayerInfo,
} from '@/ws/types';
import { positionsEqual, getRankFromRating } from '@/lib/helpers';

// ============================================
// UI State Types
// ============================================

export interface CellUIState {
  value: Player | null;
  isPlayable: boolean;
  isLastMove: boolean;
  isWinningCell: boolean;
  isAboutToBeRemoved: boolean;
  moveNumber: number | null;
}

export interface BoardUIState {
  cells: CellUIState[][];
  size: number;
  mode: GameMode;
}

export interface TurnUIState {
  currentPlayer: Player;
  isYourTurn: boolean;
  turnNumber: number;
}

export interface ScoreUIState {
  playerX: {
    name: string;
    rating?: number;
    rank?: { name: string; color: string };
    isConnected: boolean;
    isBot?: boolean;
    botType?: 'random' | 'heuristic' | 'minimax';
    botDifficulty?: 'easy' | 'medium' | 'hard';
  };
  playerO: {
    name: string;
    rating?: number;
    rank?: { name: string; color: string };
    isConnected: boolean;
    isBot?: boolean;
    botType?: 'random' | 'heuristic' | 'minimax';
    botDifficulty?: 'easy' | 'medium' | 'hard';
  };
}

export interface MatchUIState {
  matchId: string;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  board: BoardUIState;
  turn: TurnUIState;
  score: ScoreUIState;
  isGameOver: boolean;
  winner: Player | null;
  isDraw: boolean;
  winInfo: WinInfo | null;
  spectatorCount: number;
  yourPlayer: Player | null;
  isRanked?: boolean;
  isBotMatch?: boolean;
  botPlayer?: Player | null;
  botMultiplier?: number;
}

export interface MatchResultUIState {
  matchId: string;
  winner: Player | null;
  isDraw: boolean;
  winnerName: string | null;
  loserName: string | null;
  resultText: string;
  ratingChanges: {
    X: { before: number; after: number; change: number } | null;
    O: { before: number; after: number; change: number } | null;
  };
  duration: string;
  moveCount: number;
}

// ============================================
// Adapters
// ============================================

/**
 * Create cell UI state from game state
 */
export function adaptCell(
  gameState: GameState,
  row: number,
  col: number,
  yourPlayer: Player | null
): CellUIState {
  const position: Position = { row, col };
  const value = gameState.board[row][col];
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  
  // Find move number for this cell
  const move = gameState.moveHistory.find(
    (m) => positionsEqual(m.position, position)
  );

  return {
    value,
    isPlayable:
      !gameState.isGameOver &&
      value === null &&
      (yourPlayer === null || gameState.currentPlayer === yourPlayer),
    isLastMove: lastMove ? positionsEqual(lastMove.position, position) : false,
    isWinningCell: gameState.winInfo
      ? gameState.winInfo.winningCells.some((p) => positionsEqual(p, position))
      : false,
    isAboutToBeRemoved: gameState.cellAboutToBeRemoved
      ? positionsEqual(gameState.cellAboutToBeRemoved, position)
      : false,
    moveNumber: move?.moveNumber ?? null,
  };
}

/**
 * Create board UI state from game state
 */
export function adaptBoard(gameState: GameState, yourPlayer: Player | null): BoardUIState {
  const cells: CellUIState[][] = [];

  for (let row = 0; row < gameState.boardSize; row++) {
    cells[row] = [];
    for (let col = 0; col < gameState.boardSize; col++) {
      cells[row][col] = adaptCell(gameState, row, col, yourPlayer);
    }
  }

  return {
    cells,
    size: gameState.boardSize,
    mode: gameState.mode,
  };
}

/**
 * Create turn UI state
 */
export function adaptTurn(gameState: GameState, yourPlayer: Player | null): TurnUIState {
  return {
    currentPlayer: gameState.currentPlayer,
    isYourTurn: yourPlayer !== null && gameState.currentPlayer === yourPlayer,
    turnNumber: Math.floor(gameState.moveCount / 2) + 1,
  };
}

/**
 * Create score UI state
 */
export function adaptScore(matchState: MatchState): ScoreUIState {
  const adaptPlayer = (info: PlayerInfo | null) => {
    if (!info) {
      return {
        name: 'Waiting...',
        rating: undefined,
        rank: undefined,
        isConnected: false,
        isBot: undefined,
        botType: undefined,
        botDifficulty: undefined,
      };
    }

    const rank = info.rating ? getRankFromRating(info.rating) : undefined;
    return {
      name: info.username,
      rating: info.rating,
      rank: rank ? { name: rank.name, color: rank.color } : undefined,
      isConnected: info.isConnected,
      isBot: info.isBot,
      botType: info.botType,
      botDifficulty: info.botDifficulty,
    };
  };

  return {
    playerX: adaptPlayer(matchState.players.X),
    playerO: adaptPlayer(matchState.players.O),
  };
}

/**
 * Create full match UI state
 */
export function adaptMatchState(matchState: MatchState, yourPlayer: Player | null): MatchUIState | null {
  // Guard against missing gameState
  if (!matchState.gameState) {
    return null;
  }

  return {
    matchId: matchState.matchId,
    status: matchState.status,
    board: adaptBoard(matchState.gameState, yourPlayer),
    turn: adaptTurn(matchState.gameState, yourPlayer),
    score: adaptScore(matchState),
    isGameOver: matchState.gameState.isGameOver,
    winner: matchState.gameState.winner,
    isDraw: matchState.gameState.isDraw,
    winInfo: matchState.gameState.winInfo ?? null,
    spectatorCount: matchState.spectatorCount ?? 0,
    yourPlayer,
    isRanked: matchState.isRanked,
    isBotMatch: matchState.isBotMatch ?? false,
    botPlayer: matchState.botPlayer ?? null,
    botMultiplier: matchState.botMultiplier ?? undefined,
  };
}

/**
 * Create match result UI state
 */
export function adaptMatchResult(
  result: MatchResult,
  yourPlayer: Player | null
): MatchResultUIState {
  const winnerInfo = result.winner ? result.players?.[result.winner] : null;
  const loserInfo = result.winner ? result.players?.[result.winner === 'X' ? 'O' : 'X'] : null;

  // Determine result text
  let resultText: string;
  if (result.isDraw) {
    resultText = "It's a Draw!";
  } else if (yourPlayer === null) {
    resultText = `${winnerInfo?.username ?? result.winner} Wins!`;
  } else if (result.winner === yourPlayer) {
    resultText = 'You Win!';
  } else {
    resultText = 'You Lose';
  }

  // Format duration (handle missing or invalid duration)
  const durationMs = result.duration ?? 0;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const duration = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Format rating changes
  const formatRatingChange = (player: Player) => {
    const info = result.players?.[player];
    const change = result.ratingChanges?.[player];
    if (!info?.rating || change === undefined) return null;
    return {
      before: info.rating - change,
      after: info.rating,
      change,
    };
  };

  return {
    matchId: result.matchId ?? '',
    winner: result.winner,
    isDraw: result.isDraw ?? false,
    winnerName: winnerInfo?.username ?? null,
    loserName: loserInfo?.username ?? null,
    resultText,
    ratingChanges: {
      X: formatRatingChange('X'),
      O: formatRatingChange('O'),
    },
    duration,
    moveCount: result.moveCount ?? 0,
  };
}

// ============================================
// Replay Adapters
// ============================================

export interface ReplayFrame {
  frameNumber: number;
  gameState: GameState;
  move: Move | null;
}

/**
 * Find a winning line on a board, if any, for an NxN board where a win is
 * any full row/column/diagonal of the same non-null symbol.
 */
function findWinInfo(board: (Player | null)[][], boardSize: number): WinInfo | null {
  const lineWinner = (cells: (Player | null)[]): Player | null => {
    const first = cells[0];
    if (first && cells.every((cell) => cell === first)) {
      return first;
    }
    return null;
  };

  for (let row = 0; row < boardSize; row++) {
    const cells = board[row];
    const winner = lineWinner(cells);
    if (winner) {
      return {
        winner,
        winningCells: cells.map((_, col) => ({ row, col })),
        winType: 'row',
      };
    }
  }

  for (let col = 0; col < boardSize; col++) {
    const cells = board.map((r) => r[col]);
    const winner = lineWinner(cells);
    if (winner) {
      return {
        winner,
        winningCells: cells.map((_, row) => ({ row, col })),
        winType: 'column',
      };
    }
  }

  const diagonal = board.map((r, i) => r[i]);
  const diagonalWinner = lineWinner(diagonal);
  if (diagonalWinner) {
    return {
      winner: diagonalWinner,
      winningCells: diagonal.map((_, i) => ({ row: i, col: i })),
      winType: 'diagonal',
    };
  }

  const antiDiagonal = board.map((r, i) => r[boardSize - 1 - i]);
  const antiDiagonalWinner = lineWinner(antiDiagonal);
  if (antiDiagonalWinner) {
    return {
      winner: antiDiagonalWinner,
      winningCells: antiDiagonal.map((_, i) => ({ row: i, col: boardSize - 1 - i })),
      winType: 'anti-diagonal',
    };
  }

  return null;
}

/** Mode 1 (Sliding) allows at most this many marks on the board per player. */
const SLIDING_MAX_MARKS_PER_PLAYER = 3;

/**
 * Generate replay frames from move history by actually reconstructing the
 * board move by move (including Mode 1's sliding-removal rule), rather than
 * just echoing the move list. Used to play back a stored match.
 */
export function generateReplayFrames(
  initialBoardSize: number,
  mode: GameMode,
  moveHistory: Move[]
): ReplayFrame[] {
  const frames: ReplayFrame[] = [];

  const board: (Player | null)[][] = Array(initialBoardSize)
    .fill(null)
    .map(() => Array(initialBoardSize).fill(null));

  // Tracks each player's marks in placement order, needed for the sliding
  // rule (Mode 1: oldest mark is removed once a player has 3 on the board).
  const marksByPlayer: Record<Player, Position[]> = { X: [], O: [] };

  frames.push({
    frameNumber: 0,
    gameState: {
      board: board.map((row) => [...row]),
      boardSize: initialBoardSize,
      currentPlayer: 'X',
      moveHistory: [],
      isGameOver: false,
      winner: null,
      winInfo: null,
      isDraw: false,
      mode,
      moveCount: 0,
    },
    move: null,
  });

  // Once the game ends (win or draw), later frames - which shouldn't exist
  // for well-formed match data, but are handled defensively - just repeat
  // this outcome rather than recomputing it from a board that's no longer
  // being updated.
  let isGameOver = false;
  let finalWinInfo: WinInfo | null = null;
  let finalIsDraw = false;

  moveHistory.forEach((move, index) => {
    let frameMove = move;

    if (!isGameOver) {
      if (mode === 'MODE_1' && marksByPlayer[move.player].length >= SLIDING_MAX_MARKS_PER_PLAYER) {
        const oldest = marksByPlayer[move.player].shift()!;
        board[oldest.row][oldest.col] = null;
        frameMove = { ...move, removedPosition: oldest };
      }

      board[move.position.row][move.position.col] = move.player;
      marksByPlayer[move.player].push(move.position);

      const winInfo = findWinInfo(board, initialBoardSize);
      const isBoardFull = board.every((row) => row.every((cell) => cell !== null));

      if (winInfo || isBoardFull) {
        isGameOver = true;
        finalWinInfo = winInfo;
        finalIsDraw = !winInfo && isBoardFull;
      }
    }

    frames.push({
      frameNumber: index + 1,
      gameState: {
        board: board.map((row) => [...row]),
        boardSize: initialBoardSize,
        currentPlayer: move.player === 'X' ? 'O' : 'X',
        moveHistory: moveHistory.slice(0, index + 1),
        isGameOver,
        winner: finalWinInfo?.winner ?? null,
        winInfo: finalWinInfo,
        isDraw: finalIsDraw,
        mode,
        moveCount: index + 1,
      },
      move: frameMove,
    });
  });

  return frames;
}
