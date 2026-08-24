"use client";

/**
 * BotMatchOfferModal Component
 * Shown when no human opponent found after 30s
 * Player can accept bot match or continue waiting
 */

import { memo, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/helpers";

export interface BotMatchOfferModalProps {
  isOpen: boolean;
  botDifficulty: 'easy' | 'medium' | 'hard';
  botType: 'random' | 'heuristic' | 'minimax';
  waitedSeconds: number;
  offerCount: number;
  onAccept: () => void;
  onDecline: () => void;
}

const DIFFICULTY_COLORS = {
  easy: 'text-green-400 border-green-500/30 bg-green-500/10',
  medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  hard: 'text-red-400 border-red-500/30 bg-red-500/10',
} as const;

const DIFFICULTY_DESCRIPTIONS = {
  easy: 'Beginner-friendly, makes random moves',
  medium: 'Plays strategically with some mistakes',
  hard: 'Advanced AI, very challenging',
} as const;

export const BotMatchOfferModal = memo(function BotMatchOfferModal({
  isOpen,
  botDifficulty,
  botType,
  waitedSeconds,
  offerCount,
  onAccept,
  onDecline,
}: BotMatchOfferModalProps) {
  const [countdown, setCountdown] = useState(30);

  // Auto-dismiss countdown (resets on re-open)
  useEffect(() => {
    if (!isOpen) {
      setCountdown(30);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-decline when countdown reaches 0
          onDecline();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onDecline]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDecline}
      title="No Opponents Found Yet"
      size="md"
    >
      <div className="space-y-6">
        {/* Wait Time Info */}
        <div className="text-center space-y-2">
          <p className="text-text-secondary">
            You've been waiting for <span className="font-semibold text-text-primary">{waitedSeconds}s</span>
          </p>
          <p className="text-sm text-text-muted">
            {offerCount === 1 ? 'No human opponents available right now' : 'Still searching for human opponents...'}
          </p>
        </div>

        {/* Bot Offer Card */}
        <div className="p-6 rounded-xl border-2 border-accent-primary/30 bg-surface-elevated space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">🤖</span>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Play vs Bot</h3>
              <p className="text-sm text-text-secondary">Get a match instantly</p>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-lg border",
            DIFFICULTY_COLORS[botDifficulty]
          )}>
            <span className="text-2xl">
              {botDifficulty === 'easy' && '🟢'}
              {botDifficulty === 'medium' && '🟡'}
              {botDifficulty === 'hard' && '🔴'}
            </span>
            <div className="text-left">
              <div className="font-semibold capitalize">{botDifficulty} Difficulty</div>
              <div className="text-xs opacity-80">{DIFFICULTY_DESCRIPTIONS[botDifficulty]}</div>
            </div>
          </div>

          {/* Rating Info */}
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
            <p className="text-xs text-purple-400">
              ⚡ Bot matches count for rating (0.6x multiplier)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={onDecline}
            className="relative"
          >
            <span>Keep Waiting</span>
            <span className="absolute top-1 right-1 text-xs opacity-60">
              {countdown}s
            </span>
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onAccept}
            className="bg-accent-primary hover:bg-accent-primary/90"
          >
            Play vs Bot
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-text-muted">
          {offerCount === 1
            ? "This offer will appear again in 30 seconds if you keep waiting"
            : `Offer #${offerCount} • Will appear again in 30s`
          }
        </p>
      </div>
    </Modal>
  );
});

export default BotMatchOfferModal;
