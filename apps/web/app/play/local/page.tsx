    "use client";

/**
 * Local Play Page
 * Play against friend locally or against AI
 * Supports all three game modes:
 * - Mode 1: Infinite 3×3 (Sliding Moves)
 * - Mode 2: Classic Tic-Tac-Toe
 * - Mode 3: Expanding Board (Round-Based)
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { GameBoard } from "@/components/board/GameBoard";
import { TurnIndicator } from "@/components/hud/TurnIndicator";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/lib/constants";
import type { Player, WinInfo, Position } from "@/ws/types";
import { adaptBoard } from "@/lib/adapters/gameAdapter";
import { Modes } from "@infinite-ttt/game-engine";

/**
 * Rules for Mode 1 (Sliding) and Mode 2 (Classic) are delegated to the shared
 * game engine instead of being reimplemented locally.
 *
 * The engine's win detectors return a boolean/winner but not the winning
 * cells, so inferWinType + the Expanding Board win-line finder (reused below
 * since "N-in-a-row on an NxN board" is the same rule as classic tic-tac-toe
 * at N=3) fill in the winning line for the board highlight.
 */
function inferWinType(cells: Position[]): WinInfo["winType"] {
  if (cells.every((c) => c.row === cells[0].row)) return "row";
  if (cells.every((c) => c.col === cells[0].col)) return "column";
  if (cells.every((c) => c.row === c.col)) return "diagonal";
  return "anti-diagonal";
}

function findWinInfo(board: (Player | null)[][], boardSize: number, winner: Player): WinInfo | null {
  const line = Modes.ExpandingBoard.checkWin(board, boardSize, winner);
  return line ? { winner, winningCells: line, winType: inferWinType(line) } : null;
}

/**
 * Replay Mode 1's full move history through the engine's reducer so its
 * sliding-removal rule (oldest mark removed once a player has 3 on the
 * board) is applied exactly as it is server-side.
 */
function replaySlidingMode(fullMoveHistory: Array<{ position: Position; player: Player }>) {
  let state = Modes.Infinite3x3.createInitialState();
  for (const move of fullMoveHistory) {
    state = Modes.Infinite3x3.applyMove(state, move.player, move.position);
  }

  return {
    board: state.board.map((row) => [...row]) as (Player | null)[][],
    moveHistory: state.moveHistory.map((move) => ({
      position: move.position,
      player: move.player,
      moveNumber: move.turn + 1,
    })),
    winInfo: state.winner ? findWinInfo(state.board, 3, state.winner) : null,
  };
}

/**
 * Win check for Mode 2 (fixed 3x3) and Mode 3 (N-in-a-row on an N x N board,
 * boardSize grows each round) - both are the engine's Expanding Board win
 * rule, just called with a different, fixed-per-call boardSize.
 */
function checkExpandingWinner(board: (Player | null)[][], boardSize: number): WinInfo | null {
  const winner = Modes.ExpandingBoard.detectWinner(board, boardSize)?.winner ?? null;
  return winner ? findWinInfo(board, boardSize, winner) : null;
}

// Extended game mode type for local play
type LocalGameMode = "MODE_1" | "MODE_2" | "MODE_3";

type LocalGameState = {
  board: (Player | null)[][];
  boardSize: number;
  currentPlayer: Player;
  moveHistory: Array<{
    position: Position;
    player: Player;
    moveNumber: number;
  }>;
  // Mode 1 only: full, unfiltered move log used to replay the engine's
  // sliding-removal rule from scratch on every move (moveHistory above is
  // the already-filtered "currently on the board" view used for display).
  fullMoveHistory: Array<{ position: Position; player: Player }>;
  isGameOver: boolean;
  winner: Player | null;
  isDraw: boolean;
  winInfo: WinInfo | null;
  mode: LocalGameMode;
  moveCount: number;
  // Mode 3 specific
  roundNumber: number;
  roundWins: { X: number; O: number };
  matchWinner: Player | null;
  roundsToWin: number;
};

// Helper to create empty board of any size
function createEmptyBoard(size: number): (Player | null)[][] {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

export default function LocalPlayPage() {
  const [selectedMode, setSelectedMode] = useState<LocalGameMode>("MODE_1");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<LocalGameState | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showRoundModal, setShowRoundModal] = useState(false);

  // Initialize new game
  const startGame = useCallback(
    (mode: LocalGameMode, boardSize: number = 3) => {
      setGameState({
        board: createEmptyBoard(boardSize),
        boardSize,
        currentPlayer: "X",
        moveHistory: [],
        fullMoveHistory: [],
        isGameOver: false,
        winner: null,
        isDraw: false,
        winInfo: null,
        mode,
        moveCount: 0,
        roundNumber: 1,
        roundWins: { X: 0, O: 0 },
        matchWinner: null,
        roundsToWin: 3, // Best of 5 for Mode 3
      });
      setSelectedMode(mode);
      setGameStarted(true);
      setShowResultModal(false);
      setShowRoundModal(false);
    },
    [],
  );

  // Start next round (Mode 3)
  const startNextRound = useCallback(() => {
    if (!gameState) return;

    const newBoardSize = gameState.boardSize + 1;
    // Starting player strictly alternates each round (round 1 always starts
    // with X here) - this is the engine's documented fairness rule: it
    // prevents a first-move advantage from compounding across the match,
    // regardless of who won the previous round.
    const nextStarter = Modes.ExpandingBoard.getRoundStartingPlayer(
      gameState.roundNumber + 1,
      "X",
    );

    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        board: createEmptyBoard(newBoardSize),
        boardSize: newBoardSize,
        currentPlayer: nextStarter,
        moveHistory: [],
        fullMoveHistory: [],
        isGameOver: false,
        winner: null,
        isDraw: false,
        winInfo: null,
        moveCount: 0,
        roundNumber: prev.roundNumber + 1,
      };
    });
    setShowRoundModal(false);
  }, [gameState]);

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!gameState || gameState.isGameOver || gameState.board[row][col])
        return;

      setGameState((prev) => {
        if (!prev) return prev;

        const newMove = { position: { row, col }, player: prev.currentPlayer };

        let newBoard: (Player | null)[][];
        let newMoveHistory: LocalGameState["moveHistory"];
        let newFullMoveHistory = prev.fullMoveHistory;
        let winInfo: WinInfo | null;

        if (prev.mode === "MODE_1") {
          // Sliding rule (oldest mark removed once a player has 3 on the
          // board) is applied by replaying the whole game through the engine.
          newFullMoveHistory = [...prev.fullMoveHistory, newMove];
          const replayed = replaySlidingMode(newFullMoveHistory);
          newBoard = replayed.board;
          newMoveHistory = replayed.moveHistory;
          winInfo = replayed.winInfo;
        } else if (prev.mode === "MODE_2") {
          newBoard = prev.board.map((r) => [...r]);
          newBoard[row][col] = prev.currentPlayer;
          newMoveHistory = [
            ...prev.moveHistory,
            { ...newMove, moveNumber: prev.moveCount + 1 },
          ];
          winInfo = checkExpandingWinner(newBoard, 3);
        } else {
          // Mode 3 (Expanding Board): win length scales with board size -
          // this is the same "N-in-a-row on an NxN board" rule the engine
          // implements, just called with the current round's board size.
          newBoard = prev.board.map((r) => [...r]);
          newBoard[row][col] = prev.currentPlayer;
          newMoveHistory = [
            ...prev.moveHistory,
            { ...newMove, moveNumber: prev.moveCount + 1 },
          ];
          winInfo = checkExpandingWinner(newBoard, prev.boardSize);
        }

        const isGameOver = !!winInfo;

        // Check for draw (Mode 2 and Mode 3 can draw, Mode 1 cannot)
        const isDraw =
          !winInfo &&
          prev.mode !== "MODE_1" &&
          newBoard.every((row) => row.every((cell) => cell !== null));

        // Update round wins for Mode 3
        let newRoundWins = prev.roundWins;
        let matchWinner: Player | null = null;

        if (prev.mode === "MODE_3" && winInfo) {
          newRoundWins = {
            ...prev.roundWins,
            [winInfo.winner]: prev.roundWins[winInfo.winner] + 1,
          };
          // Check if someone won the match
          if (newRoundWins[winInfo.winner] >= prev.roundsToWin) {
            matchWinner = winInfo.winner;
          }
        }

        if (isGameOver || isDraw) {
          setTimeout(() => {
            // Mode 3: Show round modal unless someone won the match
            if (prev.mode === "MODE_3" && !matchWinner) {
              setShowRoundModal(true);
            } else {
              setShowResultModal(true);
            }
          }, 500);
        }

        return {
          ...prev,
          board: newBoard,
          currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
          moveHistory: newMoveHistory,
          fullMoveHistory: newFullMoveHistory,
          isGameOver: isGameOver || isDraw,
          winner: winInfo?.winner ?? null,
          isDraw,
          winInfo,
          moveCount: prev.moveCount + 1,
          roundWins: newRoundWins,
          matchWinner,
        };
      });
    },
    [gameState],
  );

  // Reset game
  const resetGame = useCallback(() => {
    startGame(selectedMode, selectedMode === "MODE_3" ? 3 : 3);
  }, [selectedMode, startGame]);

  // Convert to UI state
  const boardUIState = gameState
    ? adaptBoard(
        {
          board: gameState.board,
          boardSize: gameState.boardSize,
          currentPlayer: gameState.currentPlayer,
          moveHistory: gameState.moveHistory.map((m) => ({
            ...m,
            timestamp: Date.now(),
            moveNumber: m.moveNumber,
          })),
          isGameOver: gameState.isGameOver,
          winner: gameState.winner,
          winInfo: gameState.winInfo,
          isDraw: gameState.isDraw,
          mode: gameState.mode === "MODE_3" ? "MODE_2" : gameState.mode, // Treat Mode 3 as MODE_2 for adapter
          moveCount: gameState.moveCount,
        },
        null,
      )
    : null;

  // Get mode display name
  const getModeDisplayName = (mode: LocalGameMode) => {
    switch (mode) {
      case "MODE_1":
        return "Sliding";
      case "MODE_2":
        return "Classic";
      case "MODE_3":
        return `Expanding Rounds (Round ${gameState?.roundNumber || 1})`;
    }
  };

  return (
    <main className="flex-1 flex flex-col px-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.PLAY}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to Mode Selection
          </Link>
        </div>

        {!gameStarted ? (
          /* Mode Selection */
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold mb-6">2 Players, One Device</h1>
            <p className="text-text-secondary mb-8">
              Select a game mode to start
            </p>

            <div className="grid gap-4">
              <Button
                size="lg"
                onClick={() => startGame("MODE_2")}
                className="w-full"
              >
                Classic
                <span className="block text-xs font-normal opacity-80">
                  Standard 3-in-a-row
                </span>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => startGame("MODE_1")}
                className="w-full"
              >
                Sliding
                <span className="block text-xs font-normal opacity-80">
                  Your oldest mark disappears after 3
                </span>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => startGame("MODE_3")}
                className="w-full border-accent-warning text-accent-warning hover:bg-accent-warning/10"
              >
                Expanding Rounds
                <span className="block text-xs font-normal opacity-80">
                  Best of 5, the board grows each round
                </span>
              </Button>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-surface-elevated border border-board-grid text-left">
              <h3 className="font-semibold mb-2">How each game works</h3>
              <p className="text-sm text-text-secondary mb-2">
                <strong className="text-playerO-primary">Classic:</strong>{" "}
                Standard Tic-Tac-Toe on a 3×3 board. First to 3 in a row wins.
                Draws are possible.
              </p>
              <p className="text-sm text-text-secondary mb-2">
                <strong className="text-playerX-primary">Sliding:</strong>{" "}
                After placing 3 marks, your oldest mark disappears on your next
                move. Draws are not possible.
              </p>
              <p className="text-sm text-text-secondary">
                <strong className="text-accent-warning">Expanding Rounds:</strong>{" "}
                Best of 5. The board grows each round (3×3 → 4×4 → 5×5...). Win
                by getting N in a row on an N×N board.
              </p>
            </div>
          </div>
        ) : gameState && boardUIState ? (
          /* Game View */
          <div className="flex flex-col gap-6">
            {/* Mode indicator */}
            <div className="text-center">
              <span className="text-sm text-text-muted">
                {getModeDisplayName(selectedMode)}
              </span>

              {/* Mode 3: Show round score */}
              {selectedMode === "MODE_3" && (
                <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-sm">
                  <span className="text-playerX-primary font-semibold">
                    X: {gameState.roundWins.X}
                  </span>
                  <span className="text-text-muted text-xs sm:text-sm text-center px-2">
                    Round {gameState.roundNumber} · {gameState.boardSize}×
                    {gameState.boardSize} · {gameState.boardSize}-in-a-row
                  </span>
                  <span className="text-playerO-primary font-semibold">
                    O: {gameState.roundWins.O}
                  </span>
                </div>
              )}

              {/* Mode 1 sliding info */}
              {selectedMode === "MODE_1" && !gameState.isGameOver && (
                <div className="mt-2 text-xs text-text-secondary">
                  {(() => {
                    const xMoves = gameState.moveHistory.filter(
                      (m) => m.player === "X",
                    ).length;
                    const oMoves = gameState.moveHistory.filter(
                      (m) => m.player === "O",
                    ).length;
                    const currentMoves =
                      gameState.currentPlayer === "X" ? xMoves : oMoves;
                    if (currentMoves < 3) {
                      return `${gameState.currentPlayer} has ${currentMoves}/3 marks. ${3 - currentMoves} more before sliding starts.`;
                    }
                    return `⚠️ ${gameState.currentPlayer}'s oldest mark will slide off!`;
                  })()}
                </div>
              )}
            </div>

            {/* Turn Indicator */}
            <TurnIndicator
              currentPlayer={gameState.currentPlayer}
              yourPlayer={null}
              isYourTurn={true}
              isGameOver={gameState.isGameOver}
              winner={gameState.winner}
              isDraw={gameState.isDraw}
            />

            {/* Game Board */}
            <GameBoard
              board={boardUIState}
              currentPlayer={gameState.currentPlayer}
              yourPlayer={null}
              winInfo={gameState.winInfo}
              isGameOver={gameState.isGameOver}
              onCellClick={handleCellClick}
            />

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="secondary" onClick={resetGame} className="w-full sm:w-auto">
                New Game
              </Button>
              <Button variant="ghost" onClick={() => setGameStarted(false)} className="w-full sm:w-auto">
                Change Mode
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Round Complete Modal (Mode 3) */}
      {gameState && selectedMode === "MODE_3" && (
        <Modal
          isOpen={showRoundModal}
          onClose={() => setShowRoundModal(false)}
          title={`Round ${gameState.roundNumber} Complete!`}
        >
          <div className="text-center py-4">
            <p className="text-2xl font-bold mb-4">
              {gameState.isDraw
                ? `Round ${gameState.roundNumber} is a Draw!`
                : `${gameState.winner} Wins Round ${gameState.roundNumber}!`}
            </p>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-playerX-primary">
                  {gameState.roundWins.X}
                </p>
                <p className="text-sm text-text-muted">Player X</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-playerO-primary">
                  {gameState.roundWins.O}
                </p>
                <p className="text-sm text-text-muted">Player O</p>
              </div>
            </div>
            <p className="text-text-secondary mb-6">
              Next round: {gameState.boardSize + 1}×{gameState.boardSize + 1}{" "}
              board ({gameState.boardSize + 1}-in-a-row to win)
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={startNextRound}>Next Round</Button>
              <Button variant="secondary" onClick={() => {
                setShowRoundModal(false);
                setGameStarted(false);
              }}>
                End Match
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Game Over Modal */}
      {gameState && (
        <Modal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          title={selectedMode === "MODE_3" ? "Match Complete!" : "Game Over"}
        >
          <div className="text-center py-4">
            {selectedMode === "MODE_3" ? (
              <>
                <p className="text-2xl font-bold mb-4">
                  {gameState.matchWinner
                    ? `${gameState.matchWinner} Wins the Match!`
                    : gameState.isDraw
                      ? "Round Draw!"
                      : `${gameState.winner} Wins!`}
                </p>
                <div className="flex justify-center gap-8 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-playerX-primary">
                      {gameState.roundWins.X}
                    </p>
                    <p className="text-sm text-text-muted">Player X</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-playerO-primary">
                      {gameState.roundWins.O}
                    </p>
                    <p className="text-sm text-text-muted">Player O</p>
                  </div>
                </div>
                <p className="text-text-secondary mb-6">
                  Total rounds played: {gameState.roundNumber}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mb-4">
                  {gameState.isDraw
                    ? "It's a Draw!"
                    : `${gameState.winner} Wins!`}
                </p>
                <p className="text-text-secondary mb-6">
                  Game completed in {gameState.moveCount} moves
                </p>
              </>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={resetGame}>Play Again</Button>
              <Button variant="secondary" onClick={() => {
                setShowResultModal(false);
                setGameStarted(false);
              }}>
                Change Mode
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
