"use client";

/**
 * ScorePanel Component
 * Shows both players' info and connection status
 */

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { PlayerMark } from "@/components/board/Cell";
import { RankBadge } from "./RankBadge";
import type { ScoreUIState } from "@/lib/adapters/gameAdapter";
import type { Player } from "@/ws/types";

export interface ScorePanelProps {
  score: ScoreUIState;
  currentPlayer: Player;
  yourPlayer: Player | null;
  isGameOver: boolean;
  winner: Player | null;
  className?: string;
}

export const ScorePanel = memo(function ScorePanel({
  score,
  currentPlayer,
  yourPlayer,
  isGameOver,
  winner,
  className,
}: ScorePanelProps) {
  return (
    <div className={cn("flex items-stretch gap-4", "w-full", className)}>
      <PlayerCard
        player="X"
        info={score.playerX}
        isCurrentTurn={!isGameOver && currentPlayer === "X"}
        isYou={yourPlayer === "X"}
        isWinner={winner === "X"}
      />

      <div className="flex items-center">
        <span className="text-2xl font-bold text-text-muted">VS</span>
      </div>

      <PlayerCard
        player="O"
        info={score.playerO}
        isCurrentTurn={!isGameOver && currentPlayer === "O"}
        isYou={yourPlayer === "O"}
        isWinner={winner === "O"}
      />
    </div>
  );
});

// ============================================
// Player Card
// ============================================

interface PlayerCardProps {
  player: Player;
  info: ScoreUIState["playerX"];
  isCurrentTurn: boolean;
  isYou: boolean;
  isWinner: boolean;
}

function PlayerCard({
  player,
  info,
  isCurrentTurn,
  isYou,
  isWinner,
}: PlayerCardProps) {
  const borderColor = isWinner
    ? "border-accent-success"
    : isCurrentTurn
      ? player === "X"
        ? "border-playerX-primary"
        : "border-playerO-primary"
      : "border-board-grid";

  return (
    <div
      className={cn(
        "flex-1",
        "flex flex-col items-center gap-2",
        "p-4 rounded-xl",
        "bg-surface-elevated",
        "border-2 transition-colors duration-200",
        borderColor,
        isCurrentTurn && "shadow-lg",
        isWinner && "ring-2 ring-accent-success",
      )}
    >
      {/* Player mark */}
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="w-8 h-8">
          <PlayerMark player={player} />
        </div>
      </div>

      {/* Player name */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary truncate max-w-[120px]">
          {info.name}
        </span>
        {isYou && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
            You
          </span>
        )}
        {info.isBot && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
            🤖 Bot
          </span>
        )}
      </div>

      {/* Bot difficulty badge (replaces rank for bots) */}
      {info.isBot && info.botDifficulty ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-base">
          <span className="text-xs font-medium text-text-secondary capitalize">
            {info.botDifficulty}
          </span>
        </div>
      ) : info.rank && info.rating ? (
        <RankBadge
          rank={info.rank.name}
          color={info.rank.color}
          rating={info.rating}
          size="sm"
        />
      ) : null}

      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            info.isConnected ? "bg-accent-success" : "bg-accent-error",
          )}
        />
        <span className="text-xs text-text-muted">
          {info.isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
}

export default ScorePanel;
