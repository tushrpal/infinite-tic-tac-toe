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

// Dynamic win detection for N×N board (need N-in-a-row)
function checkWinnerDynamic(
  board: (Player | null)[][],
  winLength: number,
): WinInfo | null {
  const size = board.length;

  // Check all rows
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const cells: Position[] = [];
      const firstVal = board[row][col];
      if (!firstVal) continue;

      let match = true;
      for (let i = 0; i < winLength; i++) {
        cells.push({ row, col: col + i });
        if (board[row][col + i] !== firstVal) {
          match = false;
          break;
        }
      }
      if (match) {
        return { winner: firstVal, winningCells: cells, winType: "row" };
      }
    }
  }

  // Check all columns
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLength; row++) {
      const cells: Position[] = [];
      const firstVal = board[row][col];
      if (!firstVal) continue;

      let match = true;
      for (let i = 0; i < winLength; i++) {
        cells.push({ row: row + i, col });
        if (board[row + i][col] !== firstVal) {
          match = false;
          break;
        }
      }
      if (match) {
        return { winner: firstVal, winningCells: cells, winType: "column" };
      }
    }
  }

  // Check diagonals (top-left to bottom-right)
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const cells: Position[] = [];
      const firstVal = board[row][col];
      if (!firstVal) continue;

      let match = true;
      for (let i = 0; i < winLength; i++) {
        cells.push({ row: row + i, col: col + i });
        if (board[row + i][col + i] !== firstVal) {
          match = false;
          break;
        }
      }
      if (match) {
        return { winner: firstVal, winningCells: cells, winType: "diagonal" };
      }
    }
  }

  // Check anti-diagonals (top-right to bottom-left)
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = winLength - 1; col < size; col++) {
      const cells: Position[] = [];
      const firstVal = board[row][col];
      if (!firstVal) continue;

      let match = true;
      for (let i = 0; i < winLength; i++) {
        cells.push({ row: row + i, col: col - i });
        if (board[row + i][col - i] !== firstVal) {
          match = false;
          break;
        }
      }
      if (match) {
        return {
          winner: firstVal,
          winningCells: cells,
          winType: "anti-diagonal",
        };
      }
    }
  }

  return null;
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
    // Loser starts next round, or X starts if it was a draw
    const nextStarter: Player = gameState.isDraw
      ? "X"
      : gameState.winner === "X"
        ? "O"
        : "X";

    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        board: createEmptyBoard(newBoardSize),
        boardSize: newBoardSize,
        currentPlayer: nextStarter,
        moveHistory: [],
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

        const newBoard = prev.board.map((r) => [...r]);
        let removedPosition: Position | undefined;

        // Mode 1 (Infinite 3x3): Sliding rule - remove oldest mark if player has 3
        if (prev.mode === "MODE_1") {
          const playerMoves = prev.moveHistory.filter(
            (m) => m.player === prev.currentPlayer,
          );
          if (playerMoves.length >= 3) {
            const oldestMove = playerMoves[0];
            newBoard[oldestMove.position.row][oldestMove.position.col] = null;
            removedPosition = oldestMove.position;
          }
        }

        // Place new mark
        newBoard[row][col] = prev.currentPlayer;

        const newMoveHistory = [
          ...prev.moveHistory.filter(
            (m) =>
              !(
                removedPosition &&
                m.position.row === removedPosition.row &&
                m.position.col === removedPosition.col
              ),
          ),
          {
            position: { row, col },
            player: prev.currentPlayer,
            moveNumber: prev.moveCount + 1,
          },
        ];

        // Check for winner - use board size as win length for Mode 3
        const winLength = prev.mode === "MODE_3" ? prev.boardSize : 3;
        const winInfo = checkWinnerDynamic(newBoard, winLength);
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
        return "Sliding Mode (Infinite)";
      case "MODE_2":
        return "Classic Mode";
      case "MODE_3":
        return `Expanding Board (Round ${gameState?.roundNumber || 1})`;
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
            <h1 className="text-3xl font-display font-bold mb-6">Local Play</h1>
            <p className="text-text-secondary mb-8">
              Select a game mode to start
            </p>

            <div className="grid gap-4">
              <Button
                size="lg"
                onClick={() => startGame("MODE_1")}
                className="w-full"
              >
                Mode 1 - Sliding (Infinite)
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => startGame("MODE_2")}
                className="w-full"
              >
                Mode 2 - Classic
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => startGame("MODE_3")}
                className="w-full border-accent-warning text-accent-warning hover:bg-accent-warning/10"
              >
                Mode 3 - Expanding Board
              </Button>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-surface-elevated border border-board-grid text-left">
              <h3 className="font-semibold mb-2">Mode Descriptions</h3>
              <p className="text-sm text-text-secondary mb-2">
                <strong className="text-playerX-primary">
                  Mode 1 (Sliding):
                </strong>{" "}
                After placing 3 marks, your oldest disappears. Never draws!
              </p>
              <p className="text-sm text-text-secondary mb-2">
                <strong className="text-playerO-primary">
                  Mode 2 (Classic):
                </strong>{" "}
                Standard Tic-Tac-Toe. First to 3 in a row wins.
              </p>
              <p className="text-sm text-text-secondary">
                <strong className="text-accent-warning">
                  Mode 3 (Expanding):
                </strong>{" "}
                Round-based! Board grows each round (3×3 → 4×4 → 5×5...). Need
                N-in-a-row on N×N board. Best of 5!
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
                <div className="mt-2 flex justify-center gap-4 text-sm">
                  <span className="text-playerX-primary">
                    X: {gameState.roundWins.X}
                  </span>
                  <span className="text-text-muted">
                    Round {gameState.roundNumber} • {gameState.boardSize}×
                    {gameState.boardSize} board • {gameState.boardSize}-in-a-row
                    to win
                  </span>
                  <span className="text-playerO-primary">
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
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" onClick={resetGame}>
                New Game
              </Button>
              <Button variant="ghost" onClick={() => setGameStarted(false)}>
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
