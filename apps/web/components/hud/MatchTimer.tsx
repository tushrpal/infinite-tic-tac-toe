"use client";

/**
 * MatchTimer Component
 * Shows turn timer and match duration
 */

import { memo, useState, useEffect, useRef } from "react";
import { cn, formatDuration } from "@/lib/helpers";

export interface MatchTimerProps {
  /** Match start timestamp */
  matchStartedAt: number | null;
  /** Turn start timestamp */
  turnStartedAt?: number;
  /** Turn time limit in ms */
  turnTimeLimit?: number;
  /** Is the game over */
  isGameOver?: boolean;
  /** Show turn timer */
  showTurnTimer?: boolean;
  className?: string;
}

export const MatchTimer = memo(function MatchTimer({
  matchStartedAt,
  turnStartedAt,
  turnTimeLimit,
  isGameOver = false,
  showTurnTimer = true,
  className,
}: MatchTimerProps) {
  const [matchDuration, setMatchDuration] = useState(0);
  const [turnRemaining, setTurnRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update match duration
  useEffect(() => {
    if (!matchStartedAt || isGameOver) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const updateTimer = () => {
      setMatchDuration(Date.now() - matchStartedAt);

      if (showTurnTimer && turnStartedAt && turnTimeLimit) {
        const elapsed = Date.now() - turnStartedAt;
        const remaining = Math.max(0, turnTimeLimit - elapsed);
        setTurnRemaining(remaining);
      }
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchStartedAt, turnStartedAt, turnTimeLimit, isGameOver, showTurnTimer]);

  // Turn timer warning threshold (20% remaining)
  const isLowTime =
    turnRemaining !== null &&
    turnTimeLimit &&
    turnRemaining < turnTimeLimit * 0.2;

  return (
    <div
      className={cn(
        "flex items-center gap-4",
        "px-4 py-2",
        "bg-surface-elevated",
        "rounded-lg",
        "border border-board-grid",
        className,
      )}
    >
      {/* Match duration */}
      <div className="flex items-center gap-2">
        <ClockIcon className="w-4 h-4 text-text-muted" />
        <span className="text-sm font-mono text-text-secondary">
          {formatDuration(matchDuration)}
        </span>
      </div>

      {/* Turn timer */}
      {showTurnTimer && turnRemaining !== null && (
        <>
          <div className="w-px h-4 bg-board-grid" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Turn:</span>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                isLowTime
                  ? "text-accent-error animate-pulse"
                  : "text-text-primary",
              )}
            >
              {formatTurnTime(turnRemaining)}
            </span>
            {isLowTime && <WarningIcon className="w-4 h-4 text-accent-error" />}
          </div>
        </>
      )}
    </div>
  );
});

// ============================================
// Helpers
// ============================================

function formatTurnTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}s`;
}

// ============================================
// Icons
// ============================================

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <polyline
        points="12,6 12,12 16,14"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default MatchTimer;
