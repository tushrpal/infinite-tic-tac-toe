"use client";

/**
 * BoardOverlay Component
 * Renders win line and other board overlays
 */

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { WinLine } from "@/components/animations/WinLine";
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
  if (!winInfo || winInfo.winningCells.length === 0) return null;

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", "z-10", className)}
    >
      <WinLine winInfo={winInfo} boardSize={boardSize} containerSize={100} />

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
