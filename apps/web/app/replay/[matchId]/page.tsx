"use client";

/**
 * Replay Viewer Page
 * Watch recorded matches with playback controls
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GameBoard } from "@/components/board/GameBoard";
import { ScorePanel } from "@/components/hud/ScorePanel";
import { Button } from "@/components/ui/Button";
import { useReplay } from "@/hooks/useReplay";
import { adaptBoard, adaptScore } from "@/lib/adapters/gameAdapter";
import { ROUTES } from "@/lib/constants";
import { cn, formatDuration } from "@/lib/helpers";
import type { GameMode, Player, Move, MatchState } from "@/ws/types";

// Mock replay data - in real app this comes from API
const mockReplayData = {
  matchId: "mock-replay-123",
  mode: "MODE_1" as GameMode,
  boardSize: 3,
  moveHistory: [
    {
      position: { row: 1, col: 1 },
      player: "X" as Player,
      moveNumber: 1,
      timestamp: 0,
    },
    {
      position: { row: 0, col: 0 },
      player: "O" as Player,
      moveNumber: 2,
      timestamp: 1000,
    },
    {
      position: { row: 0, col: 1 },
      player: "X" as Player,
      moveNumber: 3,
      timestamp: 2000,
    },
    {
      position: { row: 2, col: 1 },
      player: "O" as Player,
      moveNumber: 4,
      timestamp: 3000,
    },
    {
      position: { row: 2, col: 0 },
      player: "X" as Player,
      moveNumber: 5,
      timestamp: 4000,
    },
    {
      position: { row: 0, col: 2 },
      player: "O" as Player,
      moveNumber: 6,
      timestamp: 5000,
    },
    {
      position: { row: 2, col: 2 },
      player: "X" as Player,
      moveNumber: 7,
      timestamp: 6000,
    }, // X wins
  ] as Move[],
  players: {
    X: { username: "Player1", rating: 1250 },
    O: { username: "Player2", rating: 1180 },
  },
  winner: "X" as Player,
  isDraw: false,
  duration: 45000,
  playedAt: Date.now() - 3600000,
};

export default function ReplayPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In real app, fetch replay data from API
  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [matchId]);

  const {
    currentFrame,
    frameIndex,
    totalFrames,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    togglePlayPause,
    goToFrame,
    nextFrame,
    prevFrame,
    goToStart,
    goToEnd,
    setPlaybackSpeed,
    progress,
  } = useReplay({
    replayData: mockReplayData,
    autoPlay: false,
    playbackSpeed: 1,
  });

  // Build board state from frame
  const buildBoardFromFrame = () => {
    const board: (Player | null)[][] = Array(mockReplayData.boardSize)
      .fill(null)
      .map(() => Array(mockReplayData.boardSize).fill(null));

    // Apply moves up to current frame
    const movesToApply = mockReplayData.moveHistory.slice(0, frameIndex);
    movesToApply.forEach((move) => {
      board[move.position.row][move.position.col] = move.player;
    });

    return board;
  };

  const board = buildBoardFromFrame();
  const currentPlayer: Player = frameIndex % 2 === 0 ? "X" : "O";
  const isGameOver = frameIndex >= mockReplayData.moveHistory.length;
  const winner = isGameOver ? mockReplayData.winner : null;

  // Convert to UI state
  const boardUIState = adaptBoard(
    {
      board,
      boardSize: mockReplayData.boardSize,
      currentPlayer,
      moveHistory: mockReplayData.moveHistory.slice(0, frameIndex),
      isGameOver,
      winner,
      winInfo:
        isGameOver && winner
          ? {
              winner,
              winningCells: [
                { row: 2, col: 0 },
                { row: 1, col: 1 },
                { row: 0, col: 2 },
              ], // Diagonal win for mock
              winType: "anti-diagonal",
            }
          : null,
      isDraw: isGameOver && !winner,
      mode: mockReplayData.mode,
      moveCount: frameIndex,
    },
    null,
  );

  // Mock score data
  const scoreUIState = {
    playerX: {
      name: mockReplayData.players.X.username,
      rating: mockReplayData.players.X.rating,
      rank: { name: "Gold", color: "#ffd700" },
      isConnected: true,
    },
    playerO: {
      name: mockReplayData.players.O.username,
      rating: mockReplayData.players.O.rating,
      rank: { name: "Silver", color: "#c0c0c0" },
      isConnected: true,
    },
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading replay...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Replay Not Found</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link href={ROUTES.LEADERBOARD}>
            <Button>View Leaderboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.LEADERBOARD}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back
          </Link>
          <div className="text-sm text-text-muted">
            Replay: {matchId.slice(0, 8)}...
          </div>
        </div>

        {/* Match Info */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-board-grid">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              {mockReplayData.mode === "MODE_1" ? "Classic" : "Sliding"} Mode
            </span>
            <span className="text-text-muted">
              {new Date(mockReplayData.playedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Score Panel */}
        <ScorePanel
          score={scoreUIState}
          currentPlayer={currentPlayer}
          yourPlayer={null}
          isGameOver={isGameOver}
          winner={winner}
        />

        {/* Game Board */}
        <GameBoard
          board={boardUIState}
          currentPlayer={currentPlayer}
          yourPlayer={null}
          winInfo={
            isGameOver && winner
              ? {
                  winner,
                  winningCells: [
                    { row: 2, col: 0 },
                    { row: 1, col: 1 },
                    { row: 0, col: 2 },
                  ],
                  winType: "anti-diagonal",
                }
              : null
          }
          isGameOver={isGameOver}
          disabled={true}
          showMoveNumbers={true}
        />

        {/* Playback Controls */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-board-grid">
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={frameIndex}
              onChange={(e) => goToFrame(Number(e.target.value))}
              className="w-full h-2 bg-board-grid rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>
                Move {frameIndex}/{totalFrames - 1}
              </span>
              <span>
                {isGameOver ? "Game Over" : `${currentPlayer}'s turn`}
              </span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-2">
            <ControlButton onClick={goToStart} title="Start">
              <SkipStartIcon />
            </ControlButton>
            <ControlButton onClick={prevFrame} title="Previous">
              <PrevIcon />
            </ControlButton>
            <ControlButton
              onClick={togglePlayPause}
              title={isPlaying ? "Pause" : "Play"}
              primary
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </ControlButton>
            <ControlButton onClick={nextFrame} title="Next">
              <NextIcon />
            </ControlButton>
            <ControlButton onClick={goToEnd} title="End">
              <SkipEndIcon />
            </ControlButton>
          </div>

          {/* Speed control */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-text-muted">Speed:</span>
            {[0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  playbackSpeed === speed
                    ? "bg-accent-primary text-white"
                    : "bg-board-grid text-text-secondary hover:text-text-primary",
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Result Summary */}
        {isGameOver && (
          <div className="text-center p-4 rounded-xl bg-surface-elevated border border-board-grid">
            <p className="text-lg font-semibold mb-1">
              {mockReplayData.isDraw ? "Draw" : `${winner} Wins!`}
            </p>
            <p className="text-sm text-text-secondary">
              {mockReplayData.moveHistory.length} moves •{" "}
              {formatDuration(mockReplayData.duration)}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// Control Button Component
function ControlButton({
  children,
  onClick,
  title,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-colors",
        primary
          ? "bg-accent-primary text-white hover:bg-accent-primary/90"
          : "bg-board-grid text-text-secondary hover:text-text-primary hover:bg-board-cell-hover",
      )}
    >
      {children}
    </button>
  );
}

// Icons
function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

function SkipStartIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function SkipEndIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}
