"use client";

/**
 * Online Quick Play Page
 * Matchmaking for casual online games
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWebSocket, useSocketEvent } from "@/hooks/useWebSocket";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";
import type { GameMode } from "@/ws/types";

type QueueState = "idle" | "queuing" | "match-found";

// Generate or retrieve a player ID from localStorage
function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = `player_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("playerId", id);
  }
  return id;
}

function getUsername(): string {
  if (typeof window === "undefined") return "Player";
  return localStorage.getItem("username") || "Player";
}

export default function OnlinePlayPage() {
  const router = useRouter();
  const { socket, isConnected, connectionState } = useWebSocket();

  const [selectedMode, setSelectedMode] = useState<GameMode>("MODE_1");
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Store player identity
  const playerIdRef = useRef<string>("");
  const usernameRef = useRef<string>("Player");

  useEffect(() => {
    playerIdRef.current = getPlayerId();
    usernameRef.current = getUsername();
  }, []);

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
    },
    [],
  );

  // Handle match found
  useSocketEvent(
    "MATCH_FOUND",
    (payload) => {
      setQueueState("match-found");
      setMatchId(payload.matchId);
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
    if (isConnected && playerIdRef.current) {
      socket.joinQueue(
        playerIdRef.current,
        selectedMode,
        false,
        usernameRef.current,
      );
    }
  }, [socket, isConnected, selectedMode]);

  // Leave queue
  const leaveQueue = useCallback(() => {
    socket.leaveQueue();
    setQueueState("idle");
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
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
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
          <h1 className="text-3xl font-display font-bold mb-2">Quick Play</h1>
          <p className="text-text-secondary mb-8">
            Find a random opponent online
          </p>

          {/* Connection Status */}
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
                    label="Sliding"
                    selected={selectedMode === "MODE_1"}
                    onClick={() => setSelectedMode("MODE_1")}
                  />
                  <ModeButton
                    mode="MODE_2"
                    label="Classic"
                    selected={selectedMode === "MODE_2"}
                    onClick={() => setSelectedMode("MODE_2")}
                  />
                </div>
              </div>

              {/* Find Match Button */}
              <Button
                size="lg"
                onClick={joinQueue}
                disabled={!isConnected}
                className="w-full"
              >
                Find Match
              </Button>
            </>
          )}

          {queueState === "queuing" && (
            <QueueingView
              position={queuePosition}
              estimatedWait={estimatedWait}
              onCancel={leaveQueue}
            />
          )}

          {queueState === "match-found" && <MatchFoundView />}
        </div>
      </div>
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
  label,
  selected,
  onClick,
}: {
  mode: GameMode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        "flex flex-col items-center gap-2",
        selected
          ? "border-accent-primary bg-accent-primary/10"
          : "border-board-grid bg-surface-elevated hover:border-text-muted",
      )}
    >
      <span
        className={cn(
          "font-semibold",
          selected ? "text-accent-primary" : "text-text-primary",
        )}
      >
        {label}
      </span>
      <span className="text-xs text-text-muted">
        {mode === "MODE_1" ? "3 in a row" : "Marks slide"}
      </span>
    </button>
  );
}

// Queueing View
function QueueingView({
  position,
  estimatedWait,
  onCancel,
}: {
  position: number;
  estimatedWait: number;
  onCancel: () => void;
}) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-8">
      {/* Searching animation */}
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
        <p className="text-xl font-semibold">Searching for opponent{dots}</p>
      </div>

      {/* Queue info */}
      <div className="space-y-2 mb-8 text-sm text-text-secondary">
        {position > 0 && (
          <p>
            Position in queue:{" "}
            <span className="text-text-primary">{position}</span>
          </p>
        )}
        {estimatedWait > 0 && (
          <p>
            Estimated wait:{" "}
            <span className="text-text-primary">
              ~{Math.ceil(estimatedWait / 1000)}s
            </span>
          </p>
        )}
      </div>

      {/* Cancel button */}
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
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
