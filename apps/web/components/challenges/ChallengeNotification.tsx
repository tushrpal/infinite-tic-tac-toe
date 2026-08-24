"use client";

/**
 * ChallengeNotification Component
 * Toast notification for incoming challenges with accept/decline actions
 */

import { useState, useEffect } from "react";
import { useChallenges } from "@/components/providers/ChallengesProvider";
import { cn } from "@/lib/helpers";
import type { Challenge } from "@/types/challenges";

interface ChallengeNotificationProps {
  challenge: Challenge;
  onNavigateToMatch?: (matchId: string) => void;
}

export function ChallengeNotification({ challenge, onNavigateToMatch }: ChallengeNotificationProps) {
  const { respondToReceivedChallenge } = useChallenges();
  const [isResponding, setIsResponding] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Calculate time remaining until expiry
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryTime = new Date(challenge.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        return false; // Stop the interval
      }
      return true;
    };

    // Initial calculation
    if (!calculateTimeLeft()) return;

    // Update every second
    const interval = setInterval(() => {
      if (!calculateTimeLeft()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge.expiresAt]);

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      const matchId = await respondToReceivedChallenge({
        challengeId: challenge.challengeId,
        accept: true,
      });

      // Navigate to match if callback provided and matchId returned
      if (matchId && onNavigateToMatch) {
        onNavigateToMatch(matchId);
      }
    } catch (error) {
      console.error("Failed to accept challenge:", error);
      alert("Failed to accept challenge. Please try again.");
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      await respondToReceivedChallenge({
        challengeId: challenge.challengeId,
        accept: false,
      });
    } catch (error) {
      console.error("Failed to decline challenge:", error);
      alert("Failed to decline challenge. Please try again.");
    } finally {
      setIsResponding(false);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const getModeName = (mode: string): string => {
    return mode === 'mode1' ? 'Classic 3x3' : 'Ultimate TTT';
  };

  if (timeLeft === 0) return null;

  return (
    <div
      className={cn(
        "w-full max-w-md p-4 rounded-lg shadow-2xl",
        "bg-surface-elevated border-2 border-accent-primary",
        "animate-slide-in"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent-primary font-semibold">
            {(challenge.challengerDisplayName || challenge.challengerUsername).charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="font-semibold text-text-primary">
                Challenge from {challenge.challengerDisplayName || challenge.challengerUsername}
              </div>
              <div className="text-sm text-text-secondary">
                @{challenge.challengerUsername} • {challenge.challengerRating} rating
              </div>
            </div>
            <div className="text-xs font-medium text-warning flex-shrink-0">
              {formatTimeLeft(timeLeft)}
            </div>
          </div>

          <div className="text-sm text-text-secondary mb-3">
            Mode: <span className="font-medium text-text-primary">{getModeName(challenge.mode)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              disabled={isResponding}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium",
                "bg-success text-white",
                "hover:bg-success/90",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-success",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={isResponding}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium",
                "bg-surface-elevated text-text-secondary",
                "hover:bg-board-grid hover:text-text-primary",
                "border border-board-grid",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ChallengeNotificationContainer
 * Container component that renders all active challenge notifications
 */

export function ChallengeNotificationContainer({
  onNavigateToMatch,
}: {
  onNavigateToMatch?: (matchId: string) => void;
}) {
  const { receivedChallenges } = useChallenges();

  if (receivedChallenges.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[150] space-y-3 max-w-md">
      {receivedChallenges.map((challenge) => (
        <ChallengeNotification
          key={challenge.challengeId}
          challenge={challenge}
          onNavigateToMatch={onNavigateToMatch}
        />
      ))}
    </div>
  );
}
