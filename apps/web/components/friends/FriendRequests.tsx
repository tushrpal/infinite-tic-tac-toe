"use client";

/**
 * FriendRequests Component
 * Displays incoming and outgoing friend requests
 */

import { useState } from "react";
import { useFriends } from "@/components/providers/FriendsProvider";
import { cn } from "@/lib/helpers";

interface FriendRequestsProps {
  tab: 'received' | 'sent';
}

export function FriendRequests({ tab }: FriendRequestsProps) {
  const { sentRequests, receivedRequests, respondToRequest, cancelRequest, isLoading } = useFriends();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const requests = tab === 'received' ? receivedRequests : sentRequests;

  const handleAcceptRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await respondToRequest({ friendshipId, accept: true });
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      alert("Failed to accept request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await respondToRequest({ friendshipId, accept: false });
    } catch (error) {
      console.error("Failed to decline friend request:", error);
      alert("Failed to decline request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await cancelRequest(friendshipId);
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
      alert("Failed to cancel request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-text-secondary text-center">
          {tab === 'received' ? 'No pending requests' : 'No sent requests'}
        </div>
        <div className="text-text-tertiary text-sm text-center mt-1">
          {tab === 'received'
            ? 'Friend requests you receive will appear here'
            : 'Friend requests you send will appear here'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => {
        const isProcessing = processingId === request.friendshipId;
        const displayUser = tab === 'received'
          ? {
              username: request.requesterUsername,
              displayName: request.requesterDisplayName,
              rating: request.requesterRating,
            }
          : {
              username: request.addresseeUsername,
              displayName: request.addresseeDisplayName,
              rating: request.addresseeRating,
            };

        return (
          <div
            key={request.friendshipId}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              "bg-surface-elevated hover:bg-board-grid",
              "border border-transparent hover:border-board-grid",
              "transition-colors duration-150"
            )}
          >
            {/* Player Avatar */}
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-primary font-semibold">
                {(displayUser.displayName || displayUser.username).charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text-primary truncate">
                {displayUser.displayName || displayUser.username}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>@{displayUser.username}</span>
                <span>•</span>
                <span>{displayUser.rating} rating</span>
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                {new Date(request.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {tab === 'received' ? (
                <>
                  <button
                    onClick={() => handleAcceptRequest(request.friendshipId)}
                    disabled={isProcessing}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium",
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
                    onClick={() => handleDeclineRequest(request.friendshipId)}
                    disabled={isProcessing}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium",
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
                </>
              ) : (
                <button
                  onClick={() => handleCancelRequest(request.friendshipId)}
                  disabled={isProcessing}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium",
                    "bg-surface-elevated text-text-secondary",
                    "hover:bg-critical/10 hover:text-critical",
                    "border border-board-grid",
                    "transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-critical",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
