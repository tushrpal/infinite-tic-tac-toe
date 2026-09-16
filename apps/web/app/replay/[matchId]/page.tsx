"use client";

/**
 * Replay Viewer Page
 * Watch recorded matches with playback controls
 */

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GameBoard } from "@/components/board/GameBoard";
import { ScorePanel } from "@/components/hud/ScorePanel";
import { Button } from "@/components/ui/Button";
import { useReplay } from "@/hooks/useReplay";
import { adaptBoard } from "@/lib/adapters/gameAdapter";
import { ModeBadge } from "@/components/hud/ModeBadge";
import { fetchMatch, type MatchResultPayload } from "@/lib/matches";
import { fetchPlayerProfile } from "@/lib/player";
import { ROUTES } from "@/lib/constants";
import { cn, formatDuration, getRankFromRating } from "@/lib/helpers";
import type { GameMode, Player, Move } from "@/ws/types";

interface ReplayPlayer {
  username: string;
  rating?: number;
}

interface ReplayData {
  matchId: string;
  mode: GameMode;
  boardSize: number;
  moveHistory: Move[];
  players: { X: ReplayPlayer; O: ReplayPlayer };
  winner: Player | null;
  isDraw: boolean;
  duration: number;
  playedAt: number;
}

async function describePlayer(
  player: MatchResultPayload["players"][number],
): Promise<ReplayPlayer> {
  if (player.type === "bot") {
    return { username: player.username ?? "Bot" };
  }

  if (player.displayName || player.username) {
    return {
      username: player.displayName || player.username || player.id,
      rating: player.rating,
    };
  }

  try {
    const profile = await fetchPlayerProfile(player.id);
    return {
      username: profile.displayName || profile.username || player.id,
      rating: profile.rating,
    };
  } catch {
    return { username: player.id };
  }
}

function toReplayData(match: MatchResultPayload): ReplayData | null {
  const game = match.games[0];
  if (!game) return null;

  const sortedMoves = [...game.moves].sort((a, b) => a.turn - b.turn);
  const moveHistory: Move[] = sortedMoves.map((move, index) => ({
    position: {
      row: Math.floor(move.index / game.boardSize),
      col: move.index % game.boardSize,
    },
    player: move.player,
    moveNumber: index + 1,
    timestamp: move.timestamp ?? 0,
  }));

  const firstTimestamp = sortedMoves[0]?.timestamp;
  const lastTimestamp = sortedMoves[sortedMoves.length - 1]?.timestamp;
  const duration = firstTimestamp != null && lastTimestamp != null
    ? Math.max(0, lastTimestamp - firstTimestamp)
    : 0;

  return {
    matchId: match.matchId,
    mode: match.mode,
    boardSize: game.boardSize,
    moveHistory,
    players: { X: { username: "..." }, O: { username: "..." } },
    winner: game.winner,
    isDraw: game.winner === null,
    duration,
    playedAt: match.createdAt,
  };
}

export default function ReplayPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [extraGamesCount, setExtraGamesCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const match = await fetchMatch(matchId);
        const data = toReplayData(match);
        if (!data) {
          throw new Error("This match has no recorded moves to replay.");
        }

        const [xInfo, yInfo] = await Promise.all([
          match.players[0] ? describePlayer(match.players[0]) : Promise.resolve({ username: "Player 1" }),
          match.players[1] ? describePlayer(match.players[1]) : Promise.resolve({ username: "Player 2" }),
        ]);

        if (!isActive) return;
        setReplayData({ ...data, players: { X: xInfo, O: yInfo } });
        setExtraGamesCount(Math.max(0, match.games.length - 1));
      } catch (err) {
        if (!isActive) return;
        const status = (err as Error & { status?: number }).status;
        setError(
          status === 404
            ? "Replay unavailable. Only your last 3 match replays are stored."
            : "Failed to load this replay. Please try again."
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    load();
    return () => {
      isActive = false;
    };
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
    replayData: replayData ?? {
      matchId,
      mode: "MODE_1",
      boardSize: 3,
      moveHistory: [],
      players: { X: { username: "" }, O: { username: "" } },
      winner: null,
      isDraw: false,
      duration: 0,
      playedAt: Date.now(),
    },
    autoPlay: false,
    playbackSpeed: 1,
  });

  const { currentPlayer, isGameOver, winner, winInfo } = currentFrame.gameState;

  // Convert to UI state
  const boardUIState = useMemo(
    () => adaptBoard(currentFrame.gameState, null),
    [currentFrame],
  );

  const scoreUIState = replayData ? {
    playerX: {
      name: replayData.players.X.username,
      rating: replayData.players.X.rating,
      rank: replayData.players.X.rating ? getRankFromRating(replayData.players.X.rating) : undefined,
      isConnected: true,
    },
    playerO: {
      name: replayData.players.O.username,
      rating: replayData.players.O.rating,
      rank: replayData.players.O.rating ? getRankFromRating(replayData.players.O.rating) : undefined,
      isConnected: true,
    },
  } : null;

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

  if (error || !replayData || !scoreUIState) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Replay Not Found</h2>
          <p className="text-text-secondary mb-6">{error ?? "This replay is unavailable."}</p>
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
              <ModeBadge mode={replayData.mode} />
            </span>
            <span className="text-text-muted">
              {new Date(replayData.playedAt).toLocaleDateString()}
            </span>
          </div>
          {extraGamesCount > 0 && (
            <p className="text-xs text-text-muted mt-2">
              This match had {extraGamesCount + 1} games - showing game 1.
            </p>
          )}
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
          winInfo={winInfo}
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
                    ? "bg-accent-primary text-accent-primary-foreground"
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
              {replayData.isDraw ? "Draw" : `${winner} Wins!`}
            </p>
            <p className="text-sm text-text-secondary">
              {replayData.moveHistory.length} moves
              {replayData.duration > 0 && <> • {formatDuration(replayData.duration)}</>}
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
          ? "bg-accent-primary text-accent-primary-foreground hover:bg-accent-primary/90"
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
