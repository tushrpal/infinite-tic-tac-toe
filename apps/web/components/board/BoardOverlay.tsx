"use client";

/**
 * BoardOverlay Component
 * Renders win line and other board overlays
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/helpers";
import type { WinInfo, Position } from "@/ws/types";

export interface BoardOverlayProps {
  boardSize: number;
  winInfo: WinInfo;
  className?: string;
}

export const BoardOverlay = memo(function BoardOverlay({
  boardSize,
  winInfo,
  className,
}: BoardOverlayProps) {
  // Calculate line coordinates
  const lineCoords = useMemo(() => {
    if (!winInfo || winInfo.winningCells.length === 0) return null;

    const cells = winInfo.winningCells;
    const first = cells[0];
    const last = cells[cells.length - 1];

    // Cell center calculation (0-100 percentage based)
    const getCellCenter = (pos: Position) => ({
      x: ((pos.col + 0.5) / boardSize) * 100,
      y: ((pos.row + 0.5) / boardSize) * 100,
    });

    const start = getCellCenter(first);
    const end = getCellCenter(last);

    return { start, end };
  }, [winInfo, boardSize]);

  if (!lineCoords) return null;

  const strokeColor =
    winInfo.winner === "X"
      ? "var(--player-x-primary)"
      : "var(--player-o-primary)";

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", "z-10", className)}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Glow effect filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Win line with glow */}
        <line
          x1={lineCoords.start.x}
          y1={lineCoords.start.y}
          x2={lineCoords.end.x}
          y2={lineCoords.end.y}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#glow)"
          className="win-line"
        />
      </svg>

      {/* Winning cells highlight */}
      {winInfo.winningCells.map((cell, index) => (
        <WinningCellHighlight
          key={`${cell.row}-${cell.col}`}
          position={cell}
          boardSize={boardSize}
          player={winInfo.winner}
          delay={index * 100}
        />
      ))}
    </div>
  );
});

// ============================================
// Winning Cell Highlight
// ============================================

interface WinningCellHighlightProps {
  position: Position;
  boardSize: number;
  player: "X" | "O";
  delay: number;
}

function WinningCellHighlight({
  position,
  boardSize,
  player,
  delay,
}: WinningCellHighlightProps) {
  const cellSize = 100 / boardSize;
  const style = {
    left: `${position.col * cellSize}%`,
    top: `${position.row * cellSize}%`,
    width: `${cellSize}%`,
    height: `${cellSize}%`,
    animationDelay: `${delay}ms`,
  };

  const glowColor = player === "X" ? "shadow-glow-x" : "shadow-glow-o";

  return (
    <div
      className={cn("absolute", "rounded-lg", glowColor, "animate-pulse-soft")}
      style={style}
    />
  );
}

export default BoardOverlay;
