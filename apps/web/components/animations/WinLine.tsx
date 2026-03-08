"use client";

/**
 * WinLine Component
 * Animated line drawn across winning cells
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/helpers";
import type { WinInfo, Position, Player } from "@/ws/types";

export interface WinLineProps {
  winInfo: WinInfo;
  boardSize: number;
  containerSize?: number;
  className?: string;
}

export const WinLine = memo(function WinLine({
  winInfo,
  boardSize,
  containerSize = 100,
  className,
}: WinLineProps) {
  const lineData = useMemo(() => {
    const { winningCells, winner, winType } = winInfo;

    if (winningCells.length < 2) return null;

    // Sort cells to get proper start/end
    const sortedCells = [...winningCells].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    const first = sortedCells[0];
    const last = sortedCells[sortedCells.length - 1];

    // Calculate cell size and center positions
    const cellSize = containerSize / boardSize;
    const padding = cellSize * 0.2; // Small padding from edges

    const getCenter = (pos: Position) => ({
      x: pos.col * cellSize + cellSize / 2,
      y: pos.row * cellSize + cellSize / 2,
    });

    let start = getCenter(first);
    let end = getCenter(last);

    // Extend line slightly beyond cell centers for visual effect
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const extensionRatio = 0.3; // Extend by 30% of cell size
      const extension = (cellSize * extensionRatio) / length;

      start = {
        x: start.x - dx * extension,
        y: start.y - dy * extension,
      };
      end = {
        x: end.x + dx * extension,
        y: end.y + dy * extension,
      };
    }

    return {
      start,
      end,
      winner,
      length: Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
      ),
    };
  }, [winInfo, boardSize, containerSize]);

  if (!lineData) return null;

  const strokeColor =
    lineData.winner === "X"
      ? "var(--player-x-primary)"
      : "var(--player-o-primary)";

  const glowColor =
    lineData.winner === "X" ? "var(--player-x-glow)" : "var(--player-o-glow)";

  return (
    <svg
      className={cn("absolute inset-0 pointer-events-none", className)}
      viewBox={`0 0 ${containerSize} ${containerSize}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Glow filter */}
        <filter id="win-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={glowColor} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for line */}
        <linearGradient
          id="win-gradient"
          x1={lineData.start.x}
          y1={lineData.start.y}
          x2={lineData.end.x}
          y2={lineData.end.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Main line with animation */}
      <line
        x1={lineData.start.x}
        y1={lineData.start.y}
        x2={lineData.end.x}
        y2={lineData.end.y}
        stroke="url(#win-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#win-glow)"
        style={{
          strokeDasharray: lineData.length,
          strokeDashoffset: lineData.length,
          animation: "win-line-draw 0.6s ease-out forwards",
        }}
      />

      {/* End caps with pulse animation */}
      <circle
        cx={lineData.start.x}
        cy={lineData.start.y}
        r="4"
        fill={strokeColor}
        style={{
          opacity: 0,
          animation: "win-dot-appear 0.3s ease-out 0.5s forwards",
        }}
      />
      <circle
        cx={lineData.end.x}
        cy={lineData.end.y}
        r="4"
        fill={strokeColor}
        style={{
          opacity: 0,
          animation: "win-dot-appear 0.3s ease-out 0.6s forwards",
        }}
      />

      <style>{`
        @keyframes win-line-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes win-dot-appear {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </svg>
  );
});

export default WinLine;
