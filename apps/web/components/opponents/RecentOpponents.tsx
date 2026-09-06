"use client";

/**
 * RecentOpponents Component
 * Container for displaying recent opponents list
 */

import { useState, useEffect } from "react";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { getRecentOpponents } from "@/lib/opponents";
import { OpponentCard } from "./OpponentCard";
import { ChallengeModal } from "@/components/challenges/ChallengeModal";
import { cn } from "@/lib/helpers";
import type { RecentOpponent } from "@/types/opponents";
import type { Friend } from "@/types/friends";

interface RecentOpponentsProps {
  maxDisplay?: number;
  showHeader?: boolean;
}

export function RecentOpponents({ maxDisplay = 20, showHeader = true }: RecentOpponentsProps) {
  const { player } = usePlayer();
  const [opponents, setOpponents] = useState<RecentOpponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  useEffect(() => {
    if (!player) {
      setIsLoading(false);
      return;
    }

    const loadOpponents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getRecentOpponents();
        setOpponents(response.opponents.slice(0, maxDisplay));
      } catch (err) {
        console.error("Failed to load recent opponents:", err);
        setError(err instanceof Error ? err.message : "Failed to load recent opponents");
      } finally {
        setIsLoading(false);
      }
    };

    loadOpponents();
  }, [player, maxDisplay]);

  const handleChallengeClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsChallengeModalOpen(true);
  };

  if (!player) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading recent opponents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-critical/10 border border-critical/20">
        <p className="text-sm text-critical">{error}</p>
      </div>
    );
  }

  if (opponents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-text-secondary text-center mb-2">No recent opponents</div>
        <div className="text-text-tertiary text-sm text-center">
          Play some matches to see your recent opponents here
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Recent Opponents
            </h3>
            <span className="text-sm text-text-secondary">
              {opponents.length} opponent{opponents.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="space-y-2">
          {opponents.map((opponent) => (
            <OpponentCard
              key={opponent.opponentId}
              opponent={opponent}
              onChallengeClick={handleChallengeClick}
            />
          ))}
        </div>
      </div>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => {
          setIsChallengeModalOpen(false);
          setSelectedFriend(null);
        }}
        friend={selectedFriend}
      />
    </>
  );
}
