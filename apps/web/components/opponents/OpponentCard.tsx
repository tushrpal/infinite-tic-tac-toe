"use client";

/**
 * OpponentCard Component
 * Displays a recent opponent with match history and quick actions
 */

import { useState } from "react";
import { useFriends } from "@/components/providers/FriendsProvider";
import { useChallenges } from "@/components/providers/ChallengesProvider";
import { cn } from "@/lib/helpers";
import { getChallengeModeLabel } from "@/lib/gameModes";
import type { RecentOpponent, MatchOutcome } from "@/types/opponents";
import type { Friend } from "@/types/friends";

interface OpponentCardProps {
  opponent: RecentOpponent;
  onChallengeClick?: (friend: Friend) => void;
}

export function OpponentCard({ opponent, onChallengeClick }: OpponentCardProps) {
  const { friends, sendRequest } = useFriends();
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const friend = friends.find(f => f.playerId === opponent.opponentId);
  const isFriend = !!friend;
  const canChallenge = isFriend && friend.isOnline;

  const handleAddFriend = async () => {
    if (opponent.hasPendingRequest || isFriend) return;

    setIsSendingRequest(true);
    try {
      await sendRequest({ addresseeId: opponent.opponentId });
    } catch (error) {
      console.error("Failed to send friend request:", error);
      alert("Failed to send friend request. Please try again.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleChallenge = () => {
    if (friend && onChallengeClick) {
      onChallengeClick(friend);
    }
  };

  const getOutcomeBadge = (outcome: MatchOutcome) => {
    const badges = {
      WIN: {
        label: 'Won',
        className: 'bg-success/10 text-success border-success/20',
      },
      LOSS: {
        label: 'Lost',
        className: 'bg-critical/10 text-critical border-critical/20',
      },
      DRAW: {
        label: 'Draw',
        className: 'bg-board-grid text-text-secondary border-board-grid',
      },
    };

    const badge = badges[outcome];
    return (
      <span
        className={cn(
          "px-2 py-1 rounded text-xs font-semibold border",
          badge.className
        )}
      >
        {badge.label}
      </span>
    );
  };

  const getModeName = (mode: string): string => {
    return getChallengeModeLabel(mode);
  };

  const formatLastPlayed = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg",
        "bg-surface-elevated hover:bg-board-grid",
        "border border-transparent hover:border-board-grid",
        "transition-colors duration-150"
      )}
    >
      {/* Opponent Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
          <span className="text-accent-primary font-semibold text-lg">
            {(opponent.opponentDisplayName || opponent.opponentUsername).charAt(0).toUpperCase()}
          </span>
        </div>
        {opponent.isOnline && (
          <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface-elevated"
            title="Online"
          />
        )}
      </div>

      {/* Opponent Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-text-primary truncate">
            {opponent.opponentDisplayName || opponent.opponentUsername}
          </span>
          {opponent.isOnline && (
            <span className="text-xs text-success font-medium">Online</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary flex-wrap">
          <span>@{opponent.opponentUsername}</span>
          <span>•</span>
          <span>{opponent.opponentRating} rating</span>
          <span>•</span>
          <span>{getModeName(opponent.matchMode)}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {getOutcomeBadge(opponent.matchOutcome)}
          <span className="text-xs text-text-tertiary">
            {formatLastPlayed(opponent.lastPlayedAt)}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isFriend && !opponent.hasPendingRequest && (
          <button
            onClick={handleAddFriend}
            disabled={isSendingRequest}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              "bg-surface-elevated text-text-secondary",
              "hover:bg-accent-primary/10 hover:text-accent-primary",
              "border border-board-grid",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Add Friend"
          >
            <div className="flex items-center gap-1.5">
              <UserPlusIcon />
              <span className="hidden sm:inline">Add</span>
            </div>
          </button>
        )}
        {opponent.hasPendingRequest && (
          <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-board-grid text-text-tertiary">
            Pending
          </span>
        )}
        {canChallenge && (
          <button
            onClick={handleChallenge}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              "bg-accent-primary text-white",
              "hover:bg-accent-primary/90",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary"
            )}
          >
            Challenge
          </button>
        )}
      </div>
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}
