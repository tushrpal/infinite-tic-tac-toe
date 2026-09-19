"use client";

/**
 * Live Match Page
 * Real-time online game view
 */

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { GameBoard } from "@/components/board/GameBoard";
import { TurnIndicator } from "@/components/hud/TurnIndicator";
import { ScorePanel } from "@/components/hud/ScorePanel";
import { MatchTimer } from "@/components/hud/MatchTimer";
import { BotThinkingIndicator } from "@/components/hud/BotThinkingIndicator";
import { MarkCountPanel } from "@/components/hud/MarkCountPanel";
import { ModeBadge } from "@/components/hud/ModeBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
import {
  MatchResultOverlay,
  MatchResultPreload,
  type MatchOutcome,
} from "@/components/match/MatchResultOverlay";
import { useToast } from "@/components/ui/Toast";
import { useGameState } from "@/hooks/useGameState";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBotMatch } from "@/hooks/useBotMatch";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { ConnectionStatus, OfflineBanner } from "@/components/feedback/ConnectionStatus";
import { ROUTES } from "@/lib/constants";
import { isBeginnerRank } from "@/lib/helpers";
import { countMarksOnBoard, getOnlineModeInfo } from "@/lib/gameModes";
import { getMatchWinShareText } from "@/lib/share";
import { ShareButtons } from "@/components/share/ShareButtons";
import { announce } from "@/lib/accessibility";
import type { MatchResultUIState } from "@/lib/adapters/gameAdapter";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { addToast } = useToast();
  const { connectionState } = useWebSocket();
  const { handleError } = useErrorHandler({ context: "Match" });

  const [showResultModal, setShowResultModal] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  const [disconnectTimeout, setDisconnectTimeout] = useState(0);
  const prevTurnRef = useRef<{ player: string; isGameOver: boolean } | null>(null);

  const handleMatchEnd = useCallback((result: MatchResultUIState) => {
    setShowResultModal(true);
  }, []);

  const handleMoveRejected = useCallback(
    (reason: string) => {
      addToast({
        type: "error",
        title: "Invalid Move",
        message: reason,
      });
    },
    [addToast],
  );

  const handleOpponentDisconnected = useCallback(
    (timeout: number) => {
      setDisconnectTimeout(timeout);
      setShowDisconnectWarning(true);
      addToast({
        type: "warning",
        title: "Opponent Disconnected",
        message: `Waiting for reconnection... (${Math.ceil(timeout / 1000)}s)`,
      });
    },
    [addToast],
  );

  const handleOpponentReconnected = useCallback(() => {
    setShowDisconnectWarning(false);
    addToast({
      type: "success",
      title: "Opponent Reconnected",
      message: "Game resumes",
    });
  }, [addToast]);

  const handleReconnected = useCallback(() => {
    addToast({
      type: "success",
      title: "Reconnected to match",
      message: "Game resumes",
    });
  }, [addToast]);

  const handleRematchStarting = useCallback(
    (newMatchId: string) => {
      addToast({
        type: "success",
        title: "Rematch Starting!",
        message: "Navigating to new match...",
      });
      router.push(`/match/${newMatchId}`);
    },
    [addToast, router],
  );

  const {
    matchState,
    rawMatchState,
    result,
    yourPlayer,
    isLoading,
    error,
    makeMove,
    forfeit,
    requestRematch,
    acceptRematch,
    declineRematch,
    rematchRequested,
    opponentRequestedRematch,
  } = useGameState({
    matchId,
    onMatchEnd: handleMatchEnd,
    onMoveRejected: handleMoveRejected,
    onOpponentDisconnected: handleOpponentDisconnected,
    onOpponentReconnected: handleOpponentReconnected,
    onReconnected: handleReconnected,
    onRematchStarting: handleRematchStarting,
  });

  // Bot match info
  const botInfo = useBotMatch({ matchState, yourPlayer });

  // Whether to show the sliding-rule "this mark will be removed" hint.
  // Only for beginners (Gold or below) in infinite (MODE_1) mode.
  const currentPlayerRating = rawMatchState?.players[matchState?.turn.currentPlayer ?? 'X']?.rating;
  const showRemovalHint =
    matchState?.board.mode === 'MODE_1' &&
    currentPlayerRating !== undefined &&
    isBeginnerRank(currentPlayerRating);

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (matchState?.turn.isYourTurn) {
        makeMove({ row, col });
      }
    },
    [matchState, makeMove],
  );

  // Screen reader announcements for turn changes and game end
  useEffect(() => {
    if (!matchState) return;

    const prev = prevTurnRef.current;
    const current = {
      player: matchState.turn.currentPlayer,
      isGameOver: matchState.isGameOver,
    };

    if (prev && !prev.isGameOver && matchState.isGameOver) {
      if (matchState.isDraw && getOnlineModeInfo(matchState.board.mode).canDraw) {
        announce("Game over. It's a draw.", "assertive");
      } else if (matchState.winner === yourPlayer) {
        announce("You win!", "assertive");
      } else if (matchState.winner) {
        announce("You lose.", "assertive");
      }
    } else if (
      prev &&
      !matchState.isGameOver &&
      prev.player !== current.player
    ) {
      if (matchState.turn.isYourTurn) {
        announce("Your turn.", "polite");
      } else if (yourPlayer) {
        announce("Opponent's turn.", "polite");
      }
    }

    prevTurnRef.current = current;
  }, [
    matchState?.turn.currentPlayer,
    matchState?.turn.isYourTurn,
    matchState?.isGameOver,
    matchState?.winner,
    matchState?.isDraw,
    matchState?.board.mode,
    yourPlayer,
  ]);

  const markCounts = useMemo(
    () =>
      matchState
        ? countMarksOnBoard(matchState.board.cells)
        : { X: 0, O: 0 },
    [matchState?.board.cells],
  );

  // Handle forfeit
  const handleForfeit = useCallback(() => {
    forfeit();
    setShowForfeitConfirm(false);
  }, [forfeit]);

  // Loading state
  if (isLoading) {
    return (
      <main className="space-scope flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Joining match...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="space-scope flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-error/20">
            <svg
              className="w-8 h-8 text-accent-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Unable to Join Match</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link href={ROUTES.PLAY}>
            <Button>Back to Play</Button>
          </Link>
        </div>
      </main>
    );
  }

  // No match state
  if (!matchState) {
    return null;
  }

  const watchUrl = `/watch/${matchId}` as Route;
  const isSlidingMode = matchState.board.mode === "MODE_1";
  const showDraw = getOnlineModeInfo(matchState.board.mode).canDraw;
  const matchStartedAt = rawMatchState?.startedAt ?? null;

  const outcome: MatchOutcome =
    matchState.winner === yourPlayer
      ? "win"
      : matchState.isDraw && showDraw
        ? "draw"
        : "loss";
  const ratingChange = yourPlayer ? (result?.ratingChanges?.[yourPlayer]?.change ?? null) : null;
  const moveCount = rawMatchState?.gameState.moveHistory?.length ?? 0;

  const resultSubtitle =
    outcome === "win"
      ? botInfo.isBotMatch
        ? `You defeated the ${botInfo.botDifficulty} bot!`
        : "Congratulations! You played brilliantly!"
      : outcome === "draw"
        ? "A well-fought battle!"
        : botInfo.isBotMatch
          ? `The ${botInfo.botDifficulty} bot won this time. Try again!`
          : "Better luck next time!";

  return (
    <main className="space-scope relative isolate flex-1 flex flex-col px-3 sm:px-4 py-4 sm:py-6">
      <ScreenBackdrop image="rankedMatchBg" dim={0.35} />

      {/* Offline Banner */}
      <OfflineBanner />

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 sm:gap-5">
        {/* Connection Status */}
        <ConnectionStatus connectionState={connectionState} compact={false} />

        {/* Players */}
        <ScorePanel
          score={matchState.score}
          currentPlayer={matchState.turn.currentPlayer}
          yourPlayer={yourPlayer}
          isGameOver={matchState.isGameOver}
          winner={matchState.winner}
          className="max-w-2xl mx-auto"
        />

        {/* Turn Indicator */}
        <TurnIndicator
          currentPlayer={matchState.turn.currentPlayer}
          yourPlayer={yourPlayer}
          isYourTurn={matchState.turn.isYourTurn}
          isGameOver={matchState.isGameOver}
          winner={matchState.winner}
          isDraw={matchState.isDraw}
          showDraw={showDraw}
          className="mx-auto w-full max-w-xs"
        />

        {/* Bot Thinking Indicator */}
        {botInfo.isBotThinking && (
          <BotThinkingIndicator botDifficulty={botInfo.botDifficulty || 'medium'} />
        )}

        {/* Board flanked by match info */}
        <div className="grid items-center gap-4 lg:grid-cols-[1fr_minmax(0,520px)_1fr] lg:gap-8">
          <aside className="order-2 lg:order-1 grid grid-cols-2 gap-3 lg:grid-cols-1">
            <InfoTile label="Time">
              <MatchTimer
                matchStartedAt={matchStartedAt}
                isGameOver={matchState.isGameOver}
                showTurnTimer={false}
                className="!border-0 !bg-transparent !p-0"
              />
            </InfoTile>
            <InfoTile label="Game Mode">
              <ModeBadge mode={matchState.board.mode} />
            </InfoTile>
          </aside>

          <div className="order-1 lg:order-2">
            <GameBoard
              board={matchState.board}
              currentPlayer={matchState.turn.currentPlayer}
              yourPlayer={yourPlayer}
              winInfo={matchState.winInfo}
              isGameOver={matchState.isGameOver}
              onCellClick={handleCellClick}
              disabled={!matchState.turn.isYourTurn || matchState.isGameOver}
              mode={matchState.board.mode}
              moveHistory={
                showRemovalHint ? rawMatchState?.gameState.moveHistory : undefined
              }
            />
          </div>

          <aside className="order-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
            <InfoTile label="Move #">
              <span className="font-display text-xl font-semibold">{moveCount + (matchState.isGameOver ? 0 : 1)}</span>
            </InfoTile>
            {isSlidingMode && !matchState.isGameOver ? (
              <MarkCountPanel
                markCounts={markCounts}
                currentPlayer={matchState.turn.currentPlayer}
                className="!justify-between"
              />
            ) : (
              <InfoTile label="Spectators">
                <span className="font-display text-xl font-semibold">
                  {matchState.spectatorCount}
                </span>
              </InfoTile>
            )}
          </aside>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {!matchState.isGameOver ? (
            <Button variant="danger" size="sm" onClick={() => setShowForfeitConfirm(true)}>
              Surrender
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3 text-text-muted">
            {matchState.spectatorCount > 0 && isSlidingMode && !matchState.isGameOver && (
              <span>
                👁 {matchState.spectatorCount} spectator
                {matchState.spectatorCount > 1 ? "s" : ""}
              </span>
            )}
            <Link
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:underline whitespace-nowrap"
            >
              Share Watch Link
            </Link>
          </div>
        </div>
      </div>

      {!matchState.isGameOver && <MatchResultPreload />}

      {/* Result Overlay */}
      {(showResultModal || matchState.isGameOver) && (
        <MatchResultOverlay
          outcome={outcome}
          subtitle={resultSubtitle}
          ratingChange={ratingChange}
          duration={result?.duration || "0:00"}
          moves={result?.moveCount || moveCount}
          youPlayed={yourPlayer || "?"}
        >
          {/* Bot Match Info */}
          {botInfo.isBotMatch && (
            <div className="mb-6 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
              <p className="text-sm text-purple-400">
                🤖 Bot match rating changes are reduced (0.6x multiplier)
              </p>
            </div>
          )}

          {/* Rematch UI - Hidden for bot matches */}
          {!botInfo.isBotMatch && opponentRequestedRematch ? (
            <div className="mb-6 p-4 rounded-xl bg-accent-primary/10 border-2 border-accent-primary animate-pulse">
              <p className="text-lg font-semibold mb-3">
                🎮 Opponent wants a rematch!
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="lg" onClick={acceptRematch}>
                  Accept Rematch
                </Button>
                <Button variant="secondary" size="lg" onClick={declineRematch}>
                  Decline
                </Button>
              </div>
            </div>
          ) : !botInfo.isBotMatch && rematchRequested ? (
            <div className="mb-6 p-4 rounded-xl glass-panel">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
                <p className="text-text-secondary">
                  Waiting for opponent to accept...
                </p>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {!botInfo.isBotMatch && !rematchRequested && !opponentRequestedRematch ? (
              <Button
                size="lg"
                onClick={requestRematch}
                className="bg-gradient-to-r from-accent-primary to-[#7c3aed]"
                rightIcon={<span aria-hidden="true">→</span>}
              >
                Request Rematch
              </Button>
            ) : null}
            <Link href={ROUTES.PLAY}>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto border-white/15 bg-white/5">
                Find New Match
              </Button>
            </Link>
            <Link href={ROUTES.HOME}>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Share victory / match to social feeds */}
          <div className="p-4 rounded-xl glass-panel">
            <p className="text-sm text-text-secondary mb-3 text-center">
              {outcome === "win" ? "Share your victory!" : "Challenge friends to beat you!"}
            </p>
            <ShareButtons
              campaign="match_win"
              text={
                outcome === "win"
                  ? getMatchWinShareText(getOnlineModeInfo(matchState.board.mode).label)
                  : undefined
              }
              variant="icons"
            />
          </div>
        </MatchResultOverlay>
      )}

      {/* Forfeit Confirmation Modal */}
      <Modal
        isOpen={showForfeitConfirm}
        onClose={() => setShowForfeitConfirm(false)}
        title="Surrender Match?"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          Are you sure you want to surrender? This will count as a loss.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button variant="danger" onClick={handleForfeit} className="w-full sm:w-auto">
            Yes, Surrender
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowForfeitConfirm(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Disconnect Warning */}
      {showDisconnectWarning && (
        <DisconnectWarningBanner timeoutMs={disconnectTimeout} />
      )}
    </main>
  );
}

/**
 * Disconnect warning banner with countdown timer
 */
function DisconnectWarningBanner({ timeoutMs }: { timeoutMs: number }) {
  const [remaining, setRemaining] = useState(Math.ceil(timeoutMs / 1000));

  useEffect(() => {
    setRemaining(Math.ceil(timeoutMs / 1000));
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeoutMs]);

  return (
    <div className="fixed bottom-4 left-4 right-4 safe-bottom md:left-auto md:right-4 md:w-80 p-4 rounded-lg bg-accent-warning/10 border border-accent-warning animate-pulse z-50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-accent-warning text-lg">&#9888;</span>
        <p className="text-sm font-semibold text-accent-warning">
          Opponent disconnected
        </p>
      </div>
      <p className="text-xs text-text-secondary">
        Waiting for reconnection... {remaining > 0 ? `(${remaining}s)` : ""}
      </p>
    </div>
  );
}

function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel px-4 py-3">
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <div className="text-text-primary">{children}</div>
    </div>
  );
}
