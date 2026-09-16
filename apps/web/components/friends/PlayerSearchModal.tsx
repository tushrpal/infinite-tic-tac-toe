"use client";

/**
 * PlayerSearchModal Component
 * Search for players and send friend requests
 */

import { useState, useCallback, useEffect } from "react";
import { useFriends } from "@/components/providers/FriendsProvider";
import { searchPlayers } from "@/lib/friends";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/helpers";
import type { PlayerSearchResult } from "@/types/friends";

interface PlayerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerSearchModal({ isOpen, onClose }: PlayerSearchModalProps) {
  const { sendRequest, friends, sentRequests, receivedRequests } = useFriends();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchPlayers(query);
        setResults(searchResults);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSendRequest = async (playerId: string) => {
    setSendingTo(playerId);
    setError(null);

    try {
      await sendRequest({ addresseeId: playerId });

      // Update the result to show pending status
      setResults(prev =>
        prev.map(result =>
          result.playerId === playerId
            ? { ...result, relationshipStatus: 'pending_sent' as const }
            : result
        )
      );
    } catch (err) {
      console.error("Failed to send friend request:", err);
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSendingTo(null);
    }
  };

  const getRelationshipStatus = (result: PlayerSearchResult): PlayerSearchResult['relationshipStatus'] => {
    if (result.relationshipStatus) return result.relationshipStatus;

    // Check if already friends
    if (friends.some(f => f.playerId === result.playerId)) {
      return 'friend';
    }

    // Check if request already sent
    if (sentRequests.some(r => r.addresseeId === result.playerId)) {
      return 'pending_sent';
    }

    // Check if request received
    if (receivedRequests.some(r => r.requesterId === result.playerId)) {
      return 'pending_received';
    }

    return 'none';
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Find Friends"
      size="md"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-surface-elevated border border-board-grid",
              "text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent",
              "transition-colors duration-150"
            )}
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

        {/* Search Instructions */}
        {!query && (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              Enter a username to search for players
            </p>
            <p className="text-text-tertiary text-sm mt-1">
              Minimum 2 characters required
            </p>
          </div>
        )}

        {/* Search Results */}
        {query && !isSearching && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">No players found</p>
                <p className="text-text-tertiary text-sm mt-1">
                  Try a different username
                </p>
              </div>
            ) : (
              results.map((result) => {
                const status = getRelationshipStatus(result);
                const isSending = sendingTo === result.playerId;

                return (
                  <div
                    key={result.playerId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      "bg-surface-elevated hover:bg-board-grid",
                      "border border-board-grid",
                      "transition-colors duration-150"
                    )}
                  >
                    {/* Player Avatar */}
                    <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-primary font-semibold">
                        {(result.displayName || result.username).charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {result.displayName || result.username}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        {result.displayName && result.username && (
                          <>
                            <span>@{result.username}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{result.rating} rating</span>
                      </div>
                      {result.mutualFriendsCount !== undefined && result.mutualFriendsCount > 0 && (
                        <div className="text-xs text-text-tertiary mt-1">
                          {result.mutualFriendsCount} mutual friend{result.mutualFriendsCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {status === 'friend' && (
                        <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-success/10 text-success">
                          Friends
                        </span>
                      )}
                      {status === 'pending_sent' && (
                        <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-board-grid text-text-tertiary">
                          Pending
                        </span>
                      )}
                      {status === 'pending_received' && (
                        <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-primary/10 text-accent-primary">
                          Sent you request
                        </span>
                      )}
                      {status === 'none' && (
                        <button
                          onClick={() => handleSendRequest(result.playerId)}
                          disabled={isSending}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium",
                            "bg-accent-primary text-accent-primary-foreground",
                            "hover:bg-accent-primary/90",
                            "transition-colors duration-150",
                            "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {isSending ? "Sending..." : "Add Friend"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
