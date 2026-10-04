"use client";

import { useState } from "react";

type Cell = "X" | "O" | null;

const LINES: Array<[number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winnerOf(cells: Cell[]): { winner: Cell; line: number[] | null } {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], line };
    }
  }
  return { winner: null, line: null };
}

/**
 * Classic 3×3 tic-tac-toe, playable on the page. Runs entirely in the browser,
 * with no account or connection needed. Draws are possible here, unlike
 * Sliding and Expanding modes.
 */
export function ClassicBoard() {
  const [cells, setCells] = useState<Cell[]>(Array(9).fill(null));

  const { winner, line } = winnerOf(cells);
  const isFull = cells.every(Boolean);
  const turn: "X" | "O" = cells.filter(Boolean).length % 2 === 0 ? "X" : "O";

  const place = (index: number) => {
    if (cells[index] || winner || isFull) return;
    setCells(cells.map((c, i) => (i === index ? turn : c)));
  };

  const status = winner
    ? `Player ${winner} wins!`
    : isFull
      ? "Draw. The board is full."
      : `Player ${turn} to move`;

  return (
    <div className="mx-auto w-full max-w-xs" aria-label="Classic tic-tac-toe board">
      <p aria-live="polite" className="mb-3 text-center font-medium text-text-primary">
        {status}
      </p>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-black/20 p-2">
        {cells.map((cell, i) => {
          const highlighted = line?.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => place(i)}
              disabled={Boolean(cell) || Boolean(winner) || isFull}
              aria-label={cell ? `Cell ${i + 1}: ${cell}` : `Place ${turn} in cell ${i + 1}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-4xl font-bold transition-colors enabled:hover:bg-white/10 disabled:cursor-default ${
                highlighted ? "bg-accent-primary/30 text-white" : "bg-white/[0.04] text-text-primary"
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setCells(Array(9).fill(null))}
        className="mt-3 w-full text-center text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        New game
      </button>
    </div>
  );
}
