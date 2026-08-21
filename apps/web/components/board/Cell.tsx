"use client";

/**
 * Cell Component
 * Individual cell on the game board
 * Pure renderer - no game logic
 * Enhanced for mobile touch interactions
 */

import { memo, useState, useCallback, type MouseEvent, type KeyboardEvent, type TouchEvent } from "react";
import { cn } from "@/lib/helpers";
import type { Player } from "@/ws/types";
import type { CellUIState } from "@/lib/adapters/gameAdapter";
import { useTouchDevice } from "@/hooks/useResponsive";

export interface CellProps {
  cell: CellUIState;
  row: number;
  col: number;
  onClick?: (row: number, col: number) => void;
  showMoveNumbers?: boolean;
  isHovered?: boolean;
  hoverPreview?: Player | null;
}

export const Cell = memo(function Cell({
  cell,
  row,
  col,
  onClick,
  showMoveNumbers = false,
  isHovered = false,
  hoverPreview = null,
}: CellProps) {
  const isTouch = useTouchDevice();
  const [isTouchActive, setIsTouchActive] = useState(false);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    console.log("[Cell] clicked", {
      row,
      col,
      isPlayable: cell.isPlayable,
      value: cell.value,
    });
    if (cell.isPlayable && onClick) {
      onClick(row, col);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && cell.isPlayable && onClick) {
      e.preventDefault();
      onClick(row, col);
    }
  };

  // Enhanced touch handling for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (cell.isPlayable) {
      setIsTouchActive(true);
      // Prevent default to avoid double-tap zoom on mobile
      e.preventDefault();
    }
  }, [cell.isPlayable]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    setIsTouchActive(false);
    // Handle the actual click on touch end
    if (cell.isPlayable && onClick) {
      e.preventDefault();
      onClick(row, col);
    }
  }, [cell.isPlayable, onClick, row, col]);

  const handleTouchCancel = useCallback(() => {
    setIsTouchActive(false);
  }, []);

  const showPreview = (isHovered || (isTouch && isTouchActive)) && hoverPreview;

  return (
    <div
      className={cn(
        "cell",
        "relative aspect-square",
        "flex items-center justify-center",
        "transition-all duration-200",
        // State-based styles
        !cell.isPlayable && !cell.value && "cell--disabled",
        cell.isLastMove && "cell--last-move",
        cell.isWinningCell && "ring-2 ring-accent-success",
        cell.isAboutToBeRemoved && "cell--will-remove",
        cell.value === "X" && "cell--x",
        cell.value === "O" && "cell--o",
        // Hover and touch states
        isHovered && cell.isPlayable && "bg-board-cellHover",
        isTouch && isTouchActive && cell.isPlayable && "bg-board-cellHover scale-105",
        // Touch optimization
        isTouch && "touch-manipulation",
        cell.isPlayable && "active:scale-95",
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      role="button"
      tabIndex={cell.isPlayable ? 0 : -1}
      aria-label={getCellAriaLabel(cell, row, col)}
      aria-disabled={!cell.isPlayable}
      data-row={row}
      data-col={col}
      style={{
        // Ensure minimum touch target size (48x48px recommended)
        minWidth: isTouch ? "48px" : undefined,
        minHeight: isTouch ? "48px" : undefined,
      }}
    >
      {/* Actual mark */}
      {cell.value && <PlayerMark player={cell.value} isNew={cell.isLastMove} />}

      {/* Hover/Touch preview */}
      {!cell.value && showPreview && (
        <PlayerMark player={hoverPreview} isPreview />
      )}

      {/* Move number overlay */}
      {showMoveNumbers && cell.moveNumber !== null && (
        <div className="absolute bottom-0.5 right-1 text-[10px] text-text-muted font-mono">
          {cell.moveNumber}
        </div>
      )}

      {/* About to be removed warning indicator */}
      {cell.isAboutToBeRemoved && (
        <div className="absolute inset-0 bg-accent-warning/20 rounded-[inherit] animate-pulse-soft" />
      )}

      {/* Touch feedback ripple */}
      {isTouch && isTouchActive && cell.isPlayable && (
        <div className="absolute inset-0 bg-accent-primary/10 rounded-[inherit] animate-pulse" />
      )}
    </div>
  );
});

// ============================================
// Player Mark Component
// ============================================

interface PlayerMarkProps {
  player: Player;
  isNew?: boolean;
  isPreview?: boolean;
}

export const PlayerMark = memo(function PlayerMark({
  player,
  isNew = false,
  isPreview = false,
}: PlayerMarkProps) {
  if (player === "X") {
    return (
      <div
        className={cn(
          "mark mark-x",
          isNew && "mark-enter",
          isPreview && "opacity-30",
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "mark mark-o",
        isNew && "mark-enter",
        isPreview && "opacity-30",
      )}
      aria-hidden="true"
    />
  );
});

// ============================================
// Helpers
// ============================================

function getCellAriaLabel(cell: CellUIState, row: number, col: number): string {
  const position = `Row ${row + 1}, Column ${col + 1}`;

  if (cell.value) {
    return `${position}: ${cell.value}${cell.isWinningCell ? " (winning cell)" : ""}`;
  }

  if (cell.isPlayable) {
    return `${position}: Empty, click to place your mark`;
  }

  return `${position}: Empty, not playable`;
}

export default Cell;
