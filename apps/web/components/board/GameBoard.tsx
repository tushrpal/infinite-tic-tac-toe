"use client";

/**
 * GameBoard Component
 * Renders the game board from BoardUIState
 * Pure renderer - no game logic
 */

import { memo, useState, useCallback, type MouseEvent } from "react";
import { cn, getNextRemovalPosition } from "@/lib/helpers";
import { Cell } from "./Cell";
import { BoardOverlay } from "./BoardOverlay";
import type { BoardUIState } from "@/lib/adapters/gameAdapter";
import type { Player, WinInfo, GameMode } from "@/ws/types";

export interface GameBoardProps {
  board: BoardUIState;
  currentPlayer: Player;
  yourPlayer: Player | null;
  winInfo: WinInfo | null;
  isGameOver: boolean;
  onCellClick?: (row: number, col: number) => void;
  showMoveNumbers?: boolean;
  disabled?: boolean;
  className?: string;
  /**
   * Move history used to compute the next-removal highlight in infinite (MODE_1) mode.
   * If omitted, the highlight is not shown.
   */
  moveHistory?: { player: Player; position: { row: number; col: number }; turn?: number }[];
  /**
   * Game mode. Only MODE_1 (sliding) supports the next-removal highlight.
   * Default: 'MODE_1'
   */
  mode?: GameMode;
}

export const GameBoard = memo(function GameBoard({
  board,
  currentPlayer,
  yourPlayer,
  winInfo,
  isGameOver,
  onCellClick,
  showMoveNumbers = false,
  disabled = false,
  className,
  moveHistory,
  mode = 'MODE_1',
}: GameBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!disabled && onCellClick) {
        onCellClick(row, col);
      }
    },
    [disabled, onCellClick],
  );

  const handleMouseEnter = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Determine if we should show hover preview
  const canShowHoverPreview =
    !disabled &&
    !isGameOver &&
    (yourPlayer === null || currentPlayer === yourPlayer);

  // Compute the next-removal position for infinite (sliding) mode
  // This highlights the mark that will disappear when the 4th mark is placed
  const nextRemovalPosition =
    mode === 'MODE_1' && moveHistory && moveHistory.length > 0 && !isGameOver
      ? getNextRemovalPosition(moveHistory, currentPlayer)
      : null;

  // Generate grid template based on board size
  const gridStyle = {
    gridTemplateColumns: `repeat(${board.size}, 1fr)`,
    gridTemplateRows: `repeat(${board.size}, 1fr)`,
  };

  return (
    <div className={cn("board-container", className)}>
      <div
        className={cn(
          "board-grid",
          disabled && "opacity-60 cursor-not-allowed",
        )}
        style={gridStyle}
        role="grid"
        aria-label={`${board.size}x${board.size} Tic-Tac-Toe board`}
      >
        {board.cells.map((row, rowIndex) => (
          <div key={rowIndex} className="contents" role="row">
            {row.map((cell, colIndex) => {
              const isHovered =
                hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  role="gridcell"
                  className="aspect-square"
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Cell
                    cell={cell}
                    row={rowIndex}
                    col={colIndex}
                    onClick={handleCellClick}
                    showMoveNumbers={showMoveNumbers}
                    isHovered={isHovered}
                    hoverPreview={
                      canShowHoverPreview && isHovered && cell.isPlayable
                        ? currentPlayer
                        : null
                    }
                    nextRemovalPosition={
                      nextRemovalPosition &&
                      cell.value === currentPlayer &&
                      rowIndex === nextRemovalPosition.row &&
                      colIndex === nextRemovalPosition.col
                        ? nextRemovalPosition
                        : null
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Win line overlay */}
      {winInfo && <BoardOverlay boardSize={board.size} winInfo={winInfo} />}
    </div>
  );
});

export default GameBoard;
