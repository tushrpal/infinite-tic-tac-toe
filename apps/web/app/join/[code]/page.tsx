"use client";

/**
 * Join Private Match Page
 * Allows users to join a private match via code
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPrivateMatchByCode, joinPrivateMatch } from "@/lib/challenges";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { cn } from "@/lib/helpers";
import { getChallengeModeLabel } from "@/lib/gameModes";
import type { PrivateMatch } from "@/types/challenges";

export default function JoinPrivateMatchPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { player, isLoading: isLoadingPlayer } = usePlayer();
  const [match, setMatch] = useState<PrivateMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load match details
  useEffect(() => {
    if (!player || isLoadingPlayer) return;

    const loadMatch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const matchData = await getPrivateMatchByCode(params.code);
        setMatch(matchData);
      } catch (err) {
        console.error("Failed to load private match:", err);
        setError(err instanceof Error ? err.message : "Match not found or expired");
      } finally {
        setIsLoading(false);
      }
    };

    loadMatch();
  }, [params.code, player, isLoadingPlayer]);

  const handleJoinMatch = async () => {
    if (!match) return;

    setIsJoining(true);
    setError(null);

    try {
      const response = await joinPrivateMatch({ code: params.code });

      // Navigate to the match
      router.push(`/match/${response.matchId}`);
    } catch (err) {
      console.error("Failed to join match:", err);
      setError(err instanceof Error ? err.message : "Failed to join match");
    } finally {
      setIsJoining(false);
    }
  };

  const getModeName = (mode: string): string => {
    return getChallengeModeLabel(mode);
  };

  if (isLoadingPlayer || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-critical/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-critical"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Match Not Found
          </h1>
          <p className="text-text-secondary mb-6">
            {error || "This match code is invalid or has expired."}
          </p>
          <button
            onClick={() => router.push('/play')}
            className={cn(
              "px-6 py-3 rounded-lg text-base font-medium",
              "bg-accent-primary text-accent-primary-foreground",
              "hover:bg-accent-primary/90",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary"
            )}
          >
            Go to Play
          </button>
        </div>
      </div>
    );
  }

  // Check if user is trying to join their own match
  const isOwnMatch = player?.playerId === match.creatorId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-surface-elevated rounded-xl border border-board-grid p-6 md:p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">
          Join Private Match
        </h1>

        {/* Match Details */}
        <div className="space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-base border border-board-grid">
            <div className="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-primary font-semibold text-xl">
                {(match.creatorDisplayName || match.creatorUsername).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-text-secondary mb-1">Created by</div>
              <div className="font-semibold text-text-primary text-lg">
                {match.creatorDisplayName || match.creatorUsername}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>@{match.creatorUsername}</span>
                <span>•</span>
                <span>{match.creatorRating} rating</span>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-surface-base border border-board-grid">
              <div className="text-sm text-text-secondary mb-1">Game Mode</div>
              <div className="font-semibold text-text-primary">
                {getModeName(match.mode)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-surface-base border border-board-grid">
              <div className="text-sm text-text-secondary mb-1">Match Code</div>
              <div className="font-mono font-semibold text-text-primary tracking-wider">
                {match.code}
              </div>
            </div>
          </div>

          {/* Warning for own match */}
          {isOwnMatch && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <div className="font-medium text-warning mb-1">
                    This is your own match
                  </div>
                  <div className="text-sm text-text-secondary">
                    You cannot join a match you created. Share this link with others to let them join.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-critical/10 border border-critical/20">
              <p className="text-sm text-critical">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/play')}
              className={cn(
                "flex-1 px-6 py-3 rounded-lg text-base font-medium",
                "bg-surface-base text-text-secondary",
                "hover:bg-board-grid hover:text-text-primary",
                "border border-board-grid",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleJoinMatch}
              disabled={isJoining || isOwnMatch}
              className={cn(
                "flex-1 px-6 py-3 rounded-lg text-base font-medium",
                "bg-accent-primary text-accent-primary-foreground",
                "hover:bg-accent-primary/90",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isJoining ? "Joining..." : "Join Match"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
