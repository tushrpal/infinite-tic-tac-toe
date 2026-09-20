"use client";

/**
 * MarkCountPanel — shows mark count per player in sliding mode (max 3)
 */

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { PlayerMark } from "@/components/board/Cell";
import type { Player } from "@/ws/types";
import { GAME } from "@/lib/constants";

const MAX_MARKS = GAME.SLIDING_RULE.MAX_MARKS_PER_PLAYER;

export interface MarkCountPanelProps {
  markCounts: { X: number; O: number };
  currentPlayer: Player;
  /**
   * "inline" (default): one wide row — X count, label, O count.
   * "tile": stacked label + counts, sized to sit next to other small info tiles.
   */
  variant?: "inline" | "tile";
  className?: string;
}

export const MarkCountPanel = memo(function MarkCountPanel({
  markCounts,
  currentPlayer,
  variant = "inline",
  className,
}: MarkCountPanelProps) {
  if (variant === "tile") {
    return (
      <div
        className={cn("glass-panel min-w-0 px-4 py-3", className)}
        aria-label="Mark counts for sliding mode"
      >
        <div className="mb-1.5 text-xs text-text-muted">Marks on board</div>
        <div className="flex items-center justify-between gap-2">
          <MarkCount player="X" count={markCounts.X} isActive={currentPlayer === "X"} />
          <MarkCount player="O" count={markCounts.O} isActive={currentPlayer === "O"} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-6 px-4 py-2",
        "rounded-lg bg-surface-elevated border border-board-grid",
        className,
      )}
      aria-label="Mark counts for sliding mode"
    >
      <MarkCount player="X" count={markCounts.X} isActive={currentPlayer === "X"} />
      <span className="text-xs text-text-muted whitespace-nowrap">marks on board</span>
      <MarkCount player="O" count={markCounts.O} isActive={currentPlayer === "O"} />
    </div>
  );
});

function MarkCount({
  player,
  count,
  isActive,
}: {
  player: Player;
  count: number;
  isActive: boolean;
}) {
  const atMax = count >= MAX_MARKS;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap",
        isActive && "opacity-100",
        !isActive && "opacity-70",
      )}
    >
      <div className="w-5 h-5">
        <PlayerMark player={player} />
      </div>
      <span
        className={cn(
          "text-sm font-mono font-semibold tabular-nums",
          player === "X" ? "text-playerX-primary" : "text-playerO-primary",
          atMax && "text-accent-warning",
        )}
      >
        {count}/{MAX_MARKS}
      </span>
      {atMax && (
        <span className="text-[10px] text-accent-warning font-medium">full</span>
      )}
    </div>
  );
}

export default MarkCountPanel;
