"use client";

/**
 * Online Quick Play Page
 * Matchmaking for casual online games
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWebSocket, useSocketEvent } from "@/hooks/useWebSocket";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { ROUTES, RANKS } from "@/lib/constants";
import { cn, getRankFromRating } from "@/lib/helpers";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
import { MatchmakingView } from "@/components/matchmaking/MatchmakingView";
import { BotMatchOfferModal } from "@/components/modals/BotMatchOfferModal";
import { getOnlineModeInfo } from "@/lib/gameModes";
import type { GameMode } from "@/ws/types";

type QueueState = "idle" | "queuing" | "match-found";

export default function OnlinePlayPage() {
  const router = useRouter();
  const { socket, isConnected, connectionState } = useWebSocket();
  const { player, isLoading: isPlayerLoading } = usePlayer();

  const [selectedMode, setSelectedMode] = useState<GameMode>("MODE_1");
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [queueTime, setQueueTime] = useState(0);

  // Bot offer modal state (shown when no human opponent turns up)
  const [showBotOffer, setShowBotOffer] = useState(false);
  const [botOfferData, setBotOfferData] = useState<{
    botDifficulty: "easy" | "medium" | "hard";
    botType: "random" | "heuristic" | "minimax";
    waitedSeconds: number;
    offerCount: number;
  } | null>(null);

  // Queue timer
  useEffect(() => {
    if (queueState !== "queuing") {
      setQueueTime(0);
      return;
    }
    const interval = setInterval(() => setQueueTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [queueState]);

  // Handle queue joined
  useSocketEvent(
    "QUEUE_JOINED",
    (payload) => {
      setQueueState("queuing");
      setQueuePosition(payload.position);
      setEstimatedWait(payload.estimatedWait);
    },
    [],
  );

  // Handle queue status updates
  useSocketEvent(
    "QUEUE_STATUS",
    (payload) => {
      setQueuePosition(payload.position);
      setEstimatedWait(payload.estimatedWait);
    },
    [],
  );

  // Handle queue left
  useSocketEvent(
    "QUEUE_LEFT",
    () => {
      setQueueState("idle");
      setShowBotOffer(false);
    },
    [],
  );

  // Handle bot match offer
  useSocketEvent(
    "BOT_MATCH_OFFER",
    (payload) => {
      setBotOfferData(payload);
      setShowBotOffer(true);
    },
    [],
  );

  // Handle match found
  useSocketEvent(
    "MATCH_FOUND",
    (payload) => {
      setQueueState("match-found");
      setMatchId(payload.matchId);
      setShowBotOffer(false);
      // Store match data for the match page to retrieve
      socket.setPendingMatch({
        matchId: payload.matchId,
        yourPlayer: payload.yourPlayer,
        matchState: payload.matchState,
      });
      // Navigate to match page after short delay for UX
      setTimeout(() => {
        router.push(ROUTES.MATCH(payload.matchId));
      }, 1500);
    },
    [router, socket],
  );

  // Join queue
  const joinQueue = useCallback(() => {
    if (isConnected && player?.playerId) {
      socket.joinQueue(
        player.playerId,
        selectedMode,
        false,
        player.displayName || player.username || "Player",
      );
    }
  }, [socket, isConnected, selectedMode, player]);

  // Leave queue
  const leaveQueue = useCallback(() => {
    socket.leaveQueue();
    setQueueState("idle");
    setShowBotOffer(false);
  }, [socket]);

  const acceptBotMatch = useCallback(() => {
    socket.send({ type: "ACCEPT_BOT_MATCH" });
    setShowBotOffer(false);
    // Match is created server-side, then MATCH_FOUND fires
  }, [socket]);

  const declineBotMatch = useCallback(() => {
    // Player stays in queue and gets another offer shortly
    socket.send({ type: "DECLINE_BOT_MATCH" });
    setShowBotOffer(false);
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueState === "queuing") {
        socket.leaveQueue();
      }
    };
  }, [socket, queueState]);

  return (
    <main className="space-scope relative isolate flex-1 flex flex-col items-center justify-center px-4 py-12">
      <ScreenBackdrop
        image={queueState === "queuing" ? "queueBg" : "queueMatchBg"}
        dim={queueState === "queuing" ? 0.3 : 0.5}
        alignToAnchor={queueState === "queuing"}
      />
      <div className={cn("w-full", queueState === "queuing" ? "max-w-3xl" : "max-w-md")}>
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
          {queueState !== "queuing" && (
            <>
              <h1 className="text-3xl font-display font-bold mb-2">Quick Play</h1>
              <p className="text-text-secondary mb-8">
                Find a random opponent online
              </p>
            </>
          )}

          {/* Connection Status — stays visible while queuing so a dropped
              connection is never silent. */}
          <ConnectionStatus status={connectionState.status} />

          {queueState === "idle" && (
            <>
              {/* Mode Selection */}
              <div className="mb-8">
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

              {/* Find Match Button */}
              <Button
                size="lg"
                onClick={joinQueue}
                disabled={!isConnected || isPlayerLoading || !player?.playerId}
                className="w-full"
              >
                Find Match
              </Button>
            </>
          )}

          {queueState === "queuing" && (
            <QueueingView
              rating={
                (selectedMode === "MODE_1" ? player?.ratingMode1 : player?.ratingMode2) ??
                RANKS.DEFAULT_RATING
              }
              playerName={player?.displayName || player?.username || "Player"}
              elapsedSeconds={queueTime}
              position={queuePosition}
              estimatedWait={estimatedWait}
              onCancel={leaveQueue}
            />
          )}

          {queueState === "match-found" && <MatchFoundView />}
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
          isRanked={false}
          onAccept={acceptBotMatch}
          onDecline={declineBotMatch}
        />
      )}
    </main>
  );
}

// Connection Status Component
function ConnectionStatus({ status }: { status: string }) {
  const isConnected = status === "connected";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6",
        "text-sm",
        isConnected
          ? "bg-accent-success/10 text-accent-success"
          : "bg-accent-warning/10 text-accent-warning",
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-accent-success" : "bg-accent-warning animate-pulse",
        )}
      />
      {isConnected
        ? "Connected"
        : status === "connecting"
          ? "Connecting..."
          : "Reconnecting..."}
    </div>
  );
}

// Mode Selection Button
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
        "flex flex-col items-center gap-2",
        selected
          ? "border-accent-primary bg-accent-primary/10"
          : "border-white/10 bg-white/5 hover:border-white/30",
      )}
    >
      <span
        className={cn(
          "font-semibold",
          selected ? "text-accent-primary" : "text-text-primary",
        )}
      >
        {info.icon} {info.label}
      </span>
      <span className="text-xs text-text-muted">{info.shortDescription}</span>
    </button>
  );
}

// Queueing View
function QueueingView({
  rating,
  playerName,
  elapsedSeconds,
  position,
  estimatedWait,
  onCancel,
}: {
  rating: number;
  playerName: string;
  elapsedSeconds: number;
  position: number;
  estimatedWait: number;
  onCancel: () => void;
}) {
  const rank = getRankFromRating(rating);
  const detail = [
    position > 0 ? `Position in queue: ${position}` : null,
    estimatedWait > 0 ? `Estimated wait: ~${Math.ceil(estimatedWait / 1000)}s` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <MatchmakingView
      playerName={playerName}
      rankName={rank.name}
      rankColor={rank.color}
      rating={rating}
      elapsedSeconds={elapsedSeconds}
      detail={detail || undefined}
      onCancel={onCancel}
    />
  );
}

// Match Found View
function MatchFoundView() {
  return (
    <div className="py-8">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-success/20">
          <CheckIcon className="w-8 h-8 text-accent-success" />
        </div>
        <p className="text-xl font-semibold text-accent-success">
          Match Found!
        </p>
      </div>
      <p className="text-text-secondary">Joining game...</p>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}
