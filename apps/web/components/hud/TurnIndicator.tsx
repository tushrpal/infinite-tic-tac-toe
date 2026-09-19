"use client";

/**
 * TurnIndicator Component
 * Shows whose turn it is and player status
 */

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { PlayerMark } from "@/components/board/Cell";
import type { Player } from "@/ws/types";

export interface TurnIndicatorProps {
  currentPlayer: Player;
  yourPlayer: Player | null;
  isYourTurn: boolean;
  isGameOver: boolean;
  winner: Player | null;
  isDraw: boolean;
  /** When false, draw state is hidden (e.g. sliding mode cannot draw) */
  showDraw?: boolean;
  className?: string;
}

export const TurnIndicator = memo(function TurnIndicator({
  currentPlayer,
  yourPlayer,
  isYourTurn,
  isGameOver,
  winner,
  isDraw,
  showDraw = true,
  className,
}: TurnIndicatorProps) {
  const effectiveDraw = isDraw && showDraw;

  // Determine display text
  let statusText: string;
  let statusColor: string;

  if (isGameOver) {
    if (effectiveDraw) {
      statusText = "It's a Draw!";
      statusColor = "text-text-secondary";
    } else if (winner) {
      if (yourPlayer === null) {
        statusText = `${winner} Wins!`;
      } else if (winner === yourPlayer) {
        statusText = "You Win!";
      } else {
        statusText = "You Lose";
      }
      statusColor =
        winner === "X" ? "text-playerX-primary" : "text-playerO-primary";
    } else {
      statusText = "Game Over";
      statusColor = "text-text-secondary";
    }
  } else {
    if (yourPlayer === null) {
      // Spectator view
      statusText = `${currentPlayer}'s Turn`;
    } else if (isYourTurn) {
      statusText = "Your Turn";
    } else {
      statusText = "Opponent's Turn";
    }
    statusColor =
      currentPlayer === "X" ? "text-playerX-primary" : "text-playerO-primary";
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3",
        "px-4 py-3",
        "bg-surface-elevated/85",
        "rounded-xl",
        "border border-board-grid",
        className,
      )}
    >
      {/* Current player mark */}
      {!isGameOver && (
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="w-6 h-6">
            <PlayerMark player={currentPlayer} />
          </div>
        </div>
      )}

      {/* Status text */}
      <span
        className={cn(
          "text-lg font-semibold",
          statusColor,
          isYourTurn && !isGameOver && "animate-pulse-soft",
        )}
      >
        {statusText}
      </span>

      {/* Turn indicator dot */}
      {!isGameOver && isYourTurn && (
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            currentPlayer === "X" ? "bg-playerX-primary" : "bg-playerO-primary",
            "animate-pulse",
          )}
        />
      )}
    </div>
  );
});

export default TurnIndicator;
