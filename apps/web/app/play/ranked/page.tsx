"use client";

/**
 * Ranked Play Page
 * Competitive matchmaking with rankings
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RankBadge } from "@/components/hud/RankBadge";
import { BotMatchOfferModal } from "@/components/modals/BotMatchOfferModal";
import { useWebSocket, useSocketEvent } from "@/hooks/useWebSocket";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { ROUTES, RANKS } from "@/lib/constants";
import { cn, getRankFromRating, getRankProgress } from "@/lib/helpers";
import { getOnlineModeInfo } from "@/lib/gameModes";
import type { GameMode } from "@/ws/types";

type QueueState = "idle" | "queuing" | "match-found";

export default function RankedPlayPage() {
  const router = useRouter();
  const { socket, isConnected } = useWebSocket();
  const { player, isLoading: isPlayerLoading } = usePlayer();

  const [selectedMode, setSelectedMode] = useState<GameMode>("MODE_1");
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [queueTime, setQueueTime] = useState(0);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Bot offer modal state
  const [showBotOffer, setShowBotOffer] = useState(false);
  const [botOfferData, setBotOfferData] = useState<{
    botDifficulty: 'easy' | 'medium' | 'hard';
    botType: 'random' | 'heuristic' | 'minimax';
    waitedSeconds: number;
    offerCount: number;
  } | null>(null);

  // Queue timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (queueState === "queuing") {
      interval = setInterval(() => {
        setQueueTime((t) => t + 1);
      }, 1000);
    } else {
      setQueueTime(0);
    }
    return () => clearInterval(interval);
  }, [queueState]);

  // Handle queue events
  useSocketEvent(
    "QUEUE_JOINED",
    () => {
      setQueueState("queuing");
    },
    [],
  );

  useSocketEvent(
    "QUEUE_LEFT",
    () => {
      setQueueState("idle");
    },
    [],
  );

  useSocketEvent(
    "MATCH_FOUND",
    (payload) => {
      setQueueState("match-found");
      setMatchId(payload.matchId);
      // Close bot offer modal if open
      setShowBotOffer(false);
      // Store match data for the match page to retrieve
      socket.setPendingMatch({
        matchId: payload.matchId,
        yourPlayer: payload.yourPlayer,
        matchState: payload.matchState,
      });
      setTimeout(() => {
        router.push(ROUTES.MATCH(payload.matchId));
      }, 1500);
    },
    [router, socket],
  );

  // Handle bot match offer
  useSocketEvent(
    "BOT_MATCH_OFFER",
    (payload) => {
      console.log("🤖 Bot offer received:", payload);
      setBotOfferData(payload);
      setShowBotOffer(true);
    },
    [],
  );

  // Handle errors (e.g. queue join failures) so they don't fail silently
  useSocketEvent(
    "ERROR",
    (payload) => {
      console.error("Ranked queue error:", payload);
      setQueueState("idle");
      setShowBotOffer(false);
      alert(payload.message || "Failed to join ranked queue. Please try again.");
    },
    [],
  );

  const joinQueue = useCallback(() => {
    if (isConnected && player?.playerId) {
      socket.joinQueue(
        player.playerId,
        selectedMode,
        true,
        player.displayName || "Player",
      ); // ranked = true
    }
  }, [socket, isConnected, selectedMode, player]);

  const leaveQueue = useCallback(() => {
    socket.leaveQueue();
    setQueueState("idle");
    setShowBotOffer(false);
  }, [socket]);

  const acceptBotMatch = useCallback(() => {
    console.log("✅ Player accepted bot match");
    socket.send({ type: "ACCEPT_BOT_MATCH" });
    setShowBotOffer(false);
    // Match will be created, then MATCH_FOUND event fires
  }, [socket]);

  const declineBotMatch = useCallback(() => {
    console.log("⏳ Player declined bot match, continuing to wait");
    socket.send({ type: "DECLINE_BOT_MATCH" });
    setShowBotOffer(false);
    // Player stays in queue, will get another offer in 30s
  }, [socket]);

  // Get mode-specific rating based on selected mode
  const getModeRating = () => {
    if (!player) return RANKS.DEFAULT_RATING;
    if (selectedMode === "MODE_1") {
      return player.ratingMode1 ?? RANKS.DEFAULT_RATING;
    }
    return player.ratingMode2 ?? RANKS.DEFAULT_RATING;
  };

  const playerRating = getModeRating();
  const playerRank = getRankFromRating(playerRating);
  const rankProgress = getRankProgress(playerRating);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.PLAY}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to Mode Selection
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-2">Ranked Match</h1>
          <p className="text-text-secondary mb-8">
            Compete for glory and climb the ladder
          </p>

          {/* Rank Display Card */}
          <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <RankBadge
                rank={playerRank.name}
                color={playerRank.color}
                rating={playerRating}
                size="lg"
                showTooltip={false}
              />
            </div>

            <div className="text-2xl font-bold mb-2">
              {isPlayerLoading ? "Loading..." : playerRating}
            </div>
            <div className="text-sm text-text-secondary mb-4">
              Rating Points
            </div>

            {/* Progress to next rank */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>{playerRank.name}</span>
                <span>
                  {RANKS.TIERS[
                    RANKS.TIERS.findIndex((t) => t.name === playerRank.name) + 1
                  ]?.name ?? "Max"}
                </span>
              </div>
              <div className="h-2 bg-board-grid rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-500"
                  style={{ width: `${rankProgress.progress}%` }}
                />
              </div>
              <div className="text-xs text-text-muted mt-1">
                {Math.round(rankProgress.next - playerRating)} points to next
                rank
              </div>
            </div>
          </div>

          {queueState === "idle" && (
            <>
              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <ModeButton
                    mode="MODE_1"
                    selected={selectedMode === "MODE_1"}
                    onClick={() => setSelectedMode("MODE_1")}
                  />
                  <ModeButton
                    mode="MODE_2"
                    selected={selectedMode === "MODE_2"}
                    onClick={() => setSelectedMode("MODE_2")}
                  />
                </div>
              </div>

              {/* Connection indicator */}
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-sm",
                  isConnected
                    ? "bg-accent-success/10 text-accent-success"
                    : "bg-accent-warning/10 text-accent-warning",
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected
                      ? "bg-accent-success"
                      : "bg-accent-warning animate-pulse",
                  )}
                />
                {isConnected ? "Ready" : "Connecting..."}
              </div>

              {/* Find Match */}
              <Button
                size="lg"
                onClick={joinQueue}
                disabled={!isConnected || isPlayerLoading || !player?.playerId}
                className="w-full"
              >
                Find Ranked Match
              </Button>

              {/* Warning */}
              <p className="text-xs text-text-muted mt-4">
                ⚠️ Leaving a ranked match will result in a rating penalty
              </p>
            </>
          )}

          {queueState === "queuing" && (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-accent-warning border-t-transparent animate-spin" />
              <p className="text-xl font-semibold mb-2">Finding Opponent...</p>
              <p className="text-text-secondary mb-2">
                Searching for players near your rank
              </p>
              <p className="text-sm text-text-muted mb-6">
                Time: {Math.floor(queueTime / 60)}:
                {String(queueTime % 60).padStart(2, "0")}
              </p>
              <Button variant="secondary" onClick={leaveQueue}>
                Cancel
              </Button>
            </div>
          )}

          {queueState === "match-found" && (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-success/20">
                <svg
                  className="w-8 h-8 text-accent-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-xl font-semibold text-accent-success mb-2">
                Match Found!
              </p>
              <p className="text-text-secondary">Joining ranked game...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bot Match Offer Modal */}
      {botOfferData && (
        <BotMatchOfferModal
          isOpen={showBotOffer}
          botDifficulty={botOfferData.botDifficulty}
          botType={botOfferData.botType}
          waitedSeconds={botOfferData.waitedSeconds}
          offerCount={botOfferData.offerCount}
          onAccept={acceptBotMatch}
          onDecline={declineBotMatch}
        />
      )}
    </main>
  );
}

function ModeButton({
  mode,
  selected,
  onClick,
}: {
  mode: GameMode;
  selected: boolean;
  onClick: () => void;
}) {
  const info = getOnlineModeInfo(mode);

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        "flex flex-col items-center gap-1",
        selected
          ? "border-accent-warning bg-accent-warning/10 text-accent-warning"
          : "border-board-grid bg-surface-elevated text-text-primary hover:border-text-muted",
      )}
    >
      <span className="font-semibold">{info.icon} {info.label}</span>
      <span className="text-xs text-text-muted font-normal">{info.shortDescription}</span>
    </button>
  );
}
