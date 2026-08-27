"use client";

/**
 * FriendsList Component
 * Displays list of accepted friends with online status indicators
 */

import { useState } from "react";
import { useFriends } from "@/components/providers/FriendsProvider";
import { cn } from "@/lib/helpers";

interface FriendsListProps {
  onChallenge?: (playerId: string) => void;
}

export function FriendsList({ onChallenge }: FriendsListProps) {
  const { friends, removeFriendById, isLoading } = useFriends();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    if (!confirm(`Remove ${username} from your friends?`)) {
      return;
    }

    setRemovingId(friendshipId);
    try {
      await removeFriendById(friendshipId);
    } catch (error) {
      console.error("Failed to remove friend:", error);
      alert("Failed to remove friend. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading friends...</div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-text-secondary text-center mb-2">No friends yet</div>
        <div className="text-text-tertiary text-sm text-center">
          Use the search button to find players and send friend requests
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div
          key={friend.friendshipId}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            "bg-surface-elevated hover:bg-board-grid",
            "border border-transparent hover:border-board-grid",
            "transition-colors duration-150"
          )}
        >
          {/* Online Status Indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <span className="text-accent-primary font-semibold">
                {(friend.displayName || friend.username).charAt(0).toUpperCase()}
              </span>
            </div>
            {friend.isOnline && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface-elevated"
                title="Online"
              />
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary truncate">
                {friend.displayName || friend.username}
              </span>
              {friend.isOnline && (
                <span className="text-xs text-success font-medium">Online</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {friend.displayName && friend.username && (
                <>
                  <span>@{friend.username}</span>
                  <span>•</span>
                </>
              )}
              <span>{friend.rating} rating</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {friend.isOnline && onChallenge && (
              <button
                onClick={() => onChallenge(friend.playerId)}
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
            <button
              onClick={() => handleRemoveFriend(friend.friendshipId, friend.displayName || friend.username)}
              disabled={removingId === friend.friendshipId}
              className={cn(
                "p-2 rounded-lg",
                "text-text-tertiary hover:text-critical hover:bg-critical/10",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-critical",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Remove friend"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
