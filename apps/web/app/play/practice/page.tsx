"use client";

/**
 * Practice Mode Page
 * Unranked bot matches with difficulty selection
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWebSocket, useSocketEvent } from "@/hooks/useWebSocket";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";
import { getOnlineModeInfo } from "@/lib/gameModes";
import type { GameMode } from "@/ws/types";

type BotDifficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_INFO: Record<BotDifficulty, { name: string; description: string; color: string }> = {
  easy: {
    name: 'Easy',
    description: 'Random moves - perfect for learning',
    color: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
  },
  medium: {
    name: 'Medium',
    description: 'Tactical play - good challenge',
    color: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50',
  },
  hard: {
    name: 'Hard',
    description: 'Strategic thinking - expert level',
    color: 'bg-red-500/10 border-red-500/30 hover:border-red-500/50',
  },
};

const MODE_INFO: Record<GameMode, { name: string; description: string }> = {
  MODE_1: {
    name: getOnlineModeInfo("MODE_1").label,
    description: getOnlineModeInfo("MODE_1").shortDescription,
  },
  MODE_2: {
    name: getOnlineModeInfo("MODE_2").label,
    description: getOnlineModeInfo("MODE_2").shortDescription,
  },
};

export default function PracticePage() {
  const router = useRouter();
  const { socket, isConnected } = useWebSocket();
  const { player, isLoading: isPlayerLoading } = usePlayer();

  const [selectedMode, setSelectedMode] = useState<GameMode>("MODE_1");
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>("medium");
  const [isCreating, setIsCreating] = useState(false);

  // Handle match found event
  useSocketEvent(
    "MATCH_FOUND",
    (payload) => {
      setIsCreating(false);
      // Store match data for the match page
      socket.setPendingMatch({
        matchId: payload.matchId,
        yourPlayer: payload.yourPlayer,
        matchState: payload.matchState,
      });
      // Navigate to match
      router.push(ROUTES.MATCH(payload.matchId));
    },
    [router, socket],
  );

  // Handle errors
  useSocketEvent(
    "ERROR",
    (payload) => {
      console.error("Practice match error:", payload);
      setIsCreating(false);
      alert(payload.message || "Failed to create practice match");
    },
    [],
  );

  const handleStartPractice = useCallback(() => {
    if (!player?.playerId || !isConnected || isCreating) {
      return;
    }

    setIsCreating(true);

    socket.send({
      type: "CREATE_PRACTICE_MATCH",
      payload: {
        playerId: player.playerId,
        username: player.displayName || player.username || "Player",
        mode: selectedMode,
        botDifficulty: selectedDifficulty,
      },
    });
  }, [player, isConnected, selectedMode, selectedDifficulty, isCreating, socket]);

  const canStart = !isPlayerLoading && isConnected && !isCreating && player;

  return (
    <main className="flex-1 flex flex-col px-4 py-6 sm:py-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={ROUTES.PLAY}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Play Menu
          </Link>
          <h1 className="text-2xl sm:text-4xl font-display font-bold mb-2">Practice Mode</h1>
          <p className="text-text-secondary">
            Unranked matches against bots — perfect for learning and experimentation
          </p>
        </div>

        <div>
          {/* Game Mode Selection */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Game Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(MODE_INFO) as GameMode[]).map((mode) => {
                const info = MODE_INFO[mode];
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={cn(
                      "p-4 sm:p-6 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-accent-primary bg-accent-primary/10"
                        : "border-board-grid bg-surface-elevated hover:border-text-muted",
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base sm:text-lg font-semibold">{info.name}</h3>
                      {isSelected && (
                        <svg className="w-6 h-6 text-accent-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Difficulty</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(DIFFICULTY_INFO) as BotDifficulty[]).map((difficulty) => {
                const info = DIFFICULTY_INFO[difficulty];
                const isSelected = selectedDifficulty === difficulty;
                return (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={cn(
                      "p-4 sm:p-6 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-accent-primary bg-accent-primary/10"
                        : cn("border-board-grid hover:bg-surface-elevated", info.color),
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base sm:text-lg font-semibold">{info.name}</h3>
                      {isSelected && (
                        <svg className="w-6 h-6 text-accent-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-accent-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Practice Mode Features</h3>
                <ul className="text-text-secondary text-sm space-y-1">
                  <li>• Unranked — your rating won&apos;t change</li>
                  <li>• Instant matches — no waiting for opponents</li>
                  <li>• Choose your difficulty level</li>
                  <li>• Perfect for learning strategies and game mechanics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleStartPractice}
              disabled={!canStart}
              size="lg"
              className={cn(
                "w-full sm:w-auto px-8 py-4 text-lg font-semibold",
                !canStart && "opacity-50 cursor-not-allowed",
              )}
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Match...
                </>
              ) : (
                "Start Practice Match"
              )}
            </Button>
          </div>

          {!isConnected && (
            <p className="text-center text-accent-error mt-4">
              Connecting to server...
            </p>
          )}
          {!player && !isPlayerLoading && (
            <p className="text-center text-accent-warning mt-4">
              Please create a player profile first
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
