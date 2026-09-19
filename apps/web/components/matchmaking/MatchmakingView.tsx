"use client";

/**
 * MatchmakingView
 * "Finding your opponent" screen shared by the ranked and quick-play queues.
 */

import { RankEmblem } from "@/components/ui/RankEmblem";
import { Button } from "@/components/ui/Button";

export interface MatchmakingViewProps {
  playerName: string;
  rankName: string;
  rankColor: string;
  rating: number;
  elapsedSeconds: number;
  onCancel: () => void;
  /** Current ± rating window, when the queue exposes one. */
  searchRange?: number;
  /** Extra queue detail, e.g. position in line. */
  detail?: string;
  subtitle?: string;
}

export function MatchmakingView({
  playerName,
  rankName,
  rankColor,
  rating,
  elapsedSeconds,
  onCancel,
  searchRange,
  detail,
  subtitle = "Searching for a player with a similar skill level…",
}: MatchmakingViewProps) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      {/* Only the heading is announced; the ticking timer must not be. */}
      <div role="status" aria-live="polite">
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
          Finding Your Opponent
        </h1>
        <p className="text-text-secondary mb-8">{subtitle}</p>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-8">
        {/* You */}
        <div className="flex flex-col items-center gap-2 w-24 sm:w-32">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-2 border-accent-primary bg-gradient-to-br from-accent-primary/40 to-playerO-primary/30 text-3xl font-bold shadow-[0_0_24px_rgba(168,85,247,0.55)]">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="font-semibold truncate max-w-full">{playerName}</div>
          <div className="flex items-center gap-1 text-xs" style={{ color: rankColor }}>
            <RankEmblem rank={rankName} size={16} />
            {rankName}
          </div>
          <div className="text-xs text-text-muted">Rating: {rating}</div>
        </div>

        {/* Orbit */}
        <div className="relative flex h-24 w-32 sm:h-28 sm:w-56 items-center justify-center" aria-hidden="true">
          <div className="absolute inset-0 rounded-[50%] border border-playerO-primary/50 animate-pulse" />
          <div className="absolute inset-3 rounded-[50%] border border-accent-primary/50 animate-pulse [animation-delay:300ms]" />
          <div className="absolute inset-6 rounded-[50%] border border-playerO-primary/30 animate-pulse [animation-delay:600ms]" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-accent-primary animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Opponent placeholder */}
        <div className="flex flex-col items-center gap-2 w-24 sm:w-32">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-2 border-dashed border-white/25 bg-white/5 text-3xl text-text-muted">
            ?
          </div>
          <div className="font-semibold text-text-secondary">Searching…</div>
        </div>
      </div>

      <div className="mt-8 text-sm text-text-secondary">
        {searchRange !== undefined && (
          <p className="mb-1">
            Search range <span className="text-text-primary font-medium">±{searchRange}</span> rating
          </p>
        )}
        {detail && <p className="mb-1">{detail}</p>}
      </div>

      <div role="timer" className="mt-2 font-mono text-3xl font-semibold tabular-nums">
        {String(minutes).padStart(2, "0")}:{seconds}
      </div>

      <div className="mt-6 flex flex-col-reverse items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="min-w-[200px] border-white/15 bg-white/5"
        >
          Cancel Matchmaking
        </Button>
        <ul className="glass-panel px-4 py-3 text-left text-xs text-text-secondary space-y-1.5">
          <li className="font-semibold text-text-primary">Matchmaking tips</li>
          <li>✓ We match players with similar ratings</li>
          <li>✓ The search range expands over time</li>
          <li>✓ You&apos;ll be notified instantly</li>
        </ul>
      </div>
    </div>
  );
}
