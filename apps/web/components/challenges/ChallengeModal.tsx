"use client";

/**
 * ChallengeModal Component
 * Modal for sending a challenge to a friend
 */

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useChallenges } from "@/components/providers/ChallengesProvider";
import { cn } from "@/lib/helpers";
import { getChallengeModeInfo } from "@/lib/gameModes";
import type { GameMode } from "@/types/challenges";
import type { Friend } from "@/types/friends";

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend | null;
}

export function ChallengeModal({ isOpen, onClose, friend }: ChallengeModalProps) {
  const { sendNewChallenge } = useChallenges();
  const [selectedMode, setSelectedMode] = useState<GameMode>('mode1');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendChallenge = async () => {
    if (!friend) return;

    setIsSending(true);
    setError(null);

    try {
      await sendNewChallenge({
        challengedId: friend.playerId,
        mode: selectedMode,
      });

      // Close modal on success
      onClose();

      // Reset state
      setSelectedMode('mode1');
    } catch (err) {
      console.error("Failed to send challenge:", err);
      setError(err instanceof Error ? err.message : "Failed to send challenge");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setSelectedMode('mode1');
      setError(null);
      onClose();
    }
  };

  if (!friend) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Challenge Friend"
      size="md"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={isSending}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-surface-elevated text-text-secondary",
              "hover:bg-board-grid hover:text-text-primary",
              "border border-board-grid",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSendChallenge}
            disabled={isSending}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-accent-primary text-accent-primary-foreground",
              "hover:bg-accent-primary/90",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSending ? "Sending..." : "Send Challenge"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Friend Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-board-grid">
          <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-primary font-semibold text-lg">
              {(friend.displayName || friend.username).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-text-primary">
              {friend.displayName || friend.username}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>@{friend.username}</span>
              <span>•</span>
              <span>{friend.rating} rating</span>
            </div>
          </div>
          {friend.isOnline && (
            <div className="flex items-center gap-1.5 text-xs text-success font-medium">
              <div className="w-2 h-2 rounded-full bg-success" />
              Online
            </div>
          )}
        </div>

        {/* Game Mode Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-text-primary">
            Select Game Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMode('mode1')}
              className={cn(
                "p-4 rounded-lg border-2 transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                selectedMode === 'mode1'
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-board-grid bg-surface-elevated hover:bg-board-grid"
              )}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-text-primary mb-1">
                  {getChallengeModeInfo('mode1').icon} {getChallengeModeInfo('mode1').label}
                </div>
                <div className="text-xs text-text-secondary">
                  {getChallengeModeInfo('mode1').shortDescription}
                </div>
              </div>
            </button>
            <button
              onClick={() => setSelectedMode('mode2')}
              className={cn(
                "p-4 rounded-lg border-2 transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                selectedMode === 'mode2'
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-board-grid bg-surface-elevated hover:bg-board-grid"
              )}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-text-primary mb-1">
                  {getChallengeModeInfo('mode2').icon} {getChallengeModeInfo('mode2').label}
                </div>
                <div className="text-xs text-text-secondary">
                  {getChallengeModeInfo('mode2').shortDescription}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
          <p className="text-sm text-text-secondary">
            Your challenge will expire in 5 minutes if not accepted.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
