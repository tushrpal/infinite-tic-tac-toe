/**
 * Small illustrative boards and marks used by the How to Play guide.
 * Colours come from the player tokens, so they follow the `space-scope` look
 * (X glows magenta, O glows cyan).
 */

import { cn } from "@/lib/helpers";

/**
 * A cell in an illustration:
 * "X" / "O"   – a placed mark
 * "X~" / "O~" – a mark about to disappear (sliding mode)
 * "*"         – an empty cell worth pointing out
 */
export type MiniCell = "X" | "O" | "X~" | "O~" | "*" | null;

export function Mark({
  player,
  faded = false,
  className,
}: {
  player: "X" | "O";
  faded?: boolean;
  className?: string;
}) {
  const isX = player === "X";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(isX ? "text-playerX-primary" : "text-playerO-primary", className)}
      style={{
        filter: faded
          ? undefined
          : `drop-shadow(0 0 4px ${isX ? "var(--player-x-glow)" : "var(--player-o-glow)"})`,
        opacity: faded ? 0.4 : 1,
      }}
    >
      {isX ? (
        <path
          d="M5.5 5.5l13 13M18.5 5.5l-13 13"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={faded ? "2 3.2" : undefined}
        />
      ) : (
        <circle
          cx={12}
          cy={12}
          r={6.75}
          stroke="currentColor"
          strokeWidth={3}
          strokeDasharray={faded ? "3 3.4" : undefined}
        />
      )}
    </svg>
  );
}

function CellContent({ cell }: { cell: MiniCell }) {
  if (cell === null) return null;
  if (cell === "*") {
    return <span className="h-1/2 w-1/2 rounded-[3px] bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]" />;
  }
  const player = cell[0] as "X" | "O";
  return <Mark player={player} faded={cell.endsWith("~")} className="h-[68%] w-[68%]" />;
}

export function MiniBoard({
  cells,
  highlight = [],
  className,
  cellClassName,
}: {
  /** Row-major, length 9. */
  cells: readonly MiniCell[];
  /** Indices to outline, e.g. a winning line. */
  highlight?: readonly number[];
  className?: string;
  cellClassName?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Example board"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-lg border border-accent-primary/25 bg-black/30 p-1",
        className
      )}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className={cn(
            "flex aspect-square items-center justify-center rounded-[5px] border bg-board-cell",
            highlight.includes(i)
              ? "border-accent-primary/80 bg-accent-primary/15 shadow-[0_0_10px_rgba(168,85,247,0.35)]"
              : "border-white/[0.06]",
            cellClassName
          )}
        >
          <CellContent cell={cell} />
        </div>
      ))}
    </div>
  );
}

/** Empty N×N grid, used to show the expanding board growing round by round. */
export function MiniGrid({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid gap-[3px] rounded-md border border-accent-primary/30 bg-black/30 p-[3px]",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: size * size }, (_, i) => (
        <div key={i} className="aspect-square rounded-[3px] border border-white/[0.06] bg-board-cell" />
      ))}
    </div>
  );
}

/** Builds a 9-cell board with `player` marks on the given [row, col] coordinates. */
export function cellsFromPattern(
  pattern: ReadonlyArray<readonly [number, number]>,
  player: "X" | "O"
): MiniCell[] {
  const cells: MiniCell[] = Array(9).fill(null);
  pattern.forEach(([row, col]) => {
    cells[row * 3 + col] = player;
  });
  return cells;
}
