"use client";

/**
 * PrivateMatchModal Component
 * Create private matches with shareable codes
 */

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useChallenges } from "@/components/providers/ChallengesProvider";
import { cn } from "@/lib/helpers";
import type { GameMode, PrivateMatch } from "@/types/challenges";

interface PrivateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivateMatchModal({ isOpen, onClose }: PrivateMatchModalProps) {
  const { createNewPrivateMatch, activePrivateMatch, cancelActivePrivateMatch } = useChallenges();
  const [selectedMode, setSelectedMode] = useState<GameMode>('mode1');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateMatch = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await createNewPrivateMatch({ mode: selectedMode });
    } catch (err) {
      console.error("Failed to create private match:", err);
      setError(err instanceof Error ? err.message : "Failed to create private match");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!activePrivateMatch) return;

    try {
      await navigator.clipboard.writeText(activePrivateMatch.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
      alert("Failed to copy code to clipboard");
    }
  };

  const handleCopyLink = async () => {
    if (!activePrivateMatch) return;

    try {
      await navigator.clipboard.writeText(activePrivateMatch.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link to clipboard");
    }
  };

  const handleShareLink = async () => {
    if (!activePrivateMatch) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tic-Tac-Toe match!',
          text: `Join my private match with code: ${activePrivateMatch.code}`,
          url: activePrivateMatch.joinUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleCancel = async () => {
    if (!activePrivateMatch) return;

    if (confirm("Cancel this private match?")) {
      try {
        await cancelActivePrivateMatch(activePrivateMatch.matchId);
      } catch (err) {
        console.error("Failed to cancel match:", err);
        alert("Failed to cancel match. Please try again.");
      }
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setSelectedMode('mode1');
      setError(null);
      setCopied(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Private Match"
      size="md"
    >
      <div className="space-y-6">
        {!activePrivateMatch ? (
          <>
            {/* Game Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                Select Game Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedMode('mode1')}
                  disabled={isCreating}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedMode === 'mode1'
                      ? "border-accent-primary bg-accent-primary/10"
                      : "border-board-grid bg-surface-elevated hover:bg-board-grid"
                  )}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold text-text-primary mb-1">
                      Mode 1
                    </div>
                    <div className="text-xs text-text-secondary">
                      Classic 3x3
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedMode('mode2')}
                  disabled={isCreating}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedMode === 'mode2'
                      ? "border-accent-primary bg-accent-primary/10"
                      : "border-board-grid bg-surface-elevated hover:bg-board-grid"
                  )}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold text-text-primary mb-1">
                      Mode 2
                    </div>
                    <div className="text-xs text-text-secondary">
                      Ultimate TTT
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
              <p className="text-sm text-text-secondary">
                Generate a shareable code that anyone can use to join your match. The link expires in 15 minutes.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
                <p className="text-sm text-critical">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateMatch}
              disabled={isCreating}
              className={cn(
                "w-full px-4 py-3 rounded-lg text-base font-medium",
                "bg-accent-primary text-white",
                "hover:bg-accent-primary/90",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isCreating ? "Creating..." : "Create Private Match"}
            </button>
          </>
        ) : (
          <>
            {/* Active Match Display */}
            <div className="space-y-4">
              {/* Match Code */}
              <div className="text-center p-6 rounded-lg bg-surface-elevated border border-board-grid">
                <div className="text-sm text-text-secondary mb-2">Match Code</div>
                <div className="text-3xl font-bold text-accent-primary tracking-wider mb-4 font-mono">
                  {activePrivateMatch.code}
                </div>
                <button
                  onClick={handleCopyCode}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-accent-primary text-white",
                    "hover:bg-accent-primary/90",
                    "transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  )}
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>

              {/* Share Options */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-text-primary text-center mb-3">
                  Or share via link
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                      "bg-surface-elevated text-text-primary",
                      "hover:bg-board-grid",
                      "border border-board-grid",
                      "transition-colors duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LinkIcon />
                      Copy Link
                    </div>
                  </button>
                  <button
                    onClick={handleShareLink}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                      "bg-surface-elevated text-text-primary",
                      "hover:bg-board-grid",
                      "border border-board-grid",
                      "transition-colors duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ShareIcon />
                      Share
                    </div>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  <p className="text-sm text-text-secondary">
                    Waiting for opponent to join...
                  </p>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className={cn(
                  "w-full px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-surface-elevated text-text-secondary",
                  "hover:bg-critical/10 hover:text-critical",
                  "border border-board-grid",
                  "transition-colors duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-critical"
                )}
              >
                Cancel Match
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function LinkIcon() {
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
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ShareIcon() {
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
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
