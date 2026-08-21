"use client";

/**
 * Live Match Page
 * Real-time online game view
 */

import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { GameBoard } from "@/components/board/GameBoard";
import { TurnIndicator } from "@/components/hud/TurnIndicator";
import { ScorePanel } from "@/components/hud/ScorePanel";
import { MatchTimer } from "@/components/hud/MatchTimer";
import { BotThinkingIndicator } from "@/components/hud/BotThinkingIndicator";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useGameState } from "@/hooks/useGameState";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBotMatch } from "@/hooks/useBotMatch";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";
import type { MatchResultUIState } from "@/lib/adapters/gameAdapter";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { addToast } = useToast();
  const { connectionState } = useWebSocket();

  const [showResultModal, setShowResultModal] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  const [disconnectTimeout, setDisconnectTimeout] = useState(0);

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

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      console.log("[MatchPage] handleCellClick", {
        row,
        col,
        isYourTurn: matchState?.turn.isYourTurn,
      });
      if (matchState?.turn.isYourTurn) {
        makeMove({ row, col });
      }
    },
    [matchState, makeMove],
  );

  // Handle forfeit
  const handleForfeit = useCallback(() => {
    forfeit();
    setShowForfeitConfirm(false);
  }, [forfeit]);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
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
      <main className="flex-1 flex items-center justify-center px-4">
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

  return (
    <main className="flex-1 flex flex-col px-4 py-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        {/* Connection Status Bar */}
        {connectionState.status !== "connected" && (
          <div className="p-3 rounded-lg bg-accent-warning/10 border border-accent-warning text-center flex items-center justify-center gap-2">
            {connectionState.status === "reconnecting" && (
              <div className="w-4 h-4 rounded-full border-2 border-accent-warning border-t-transparent animate-spin" />
            )}
            <span className="text-sm text-accent-warning">
              {connectionState.status === "reconnecting"
                ? "Reconnecting to server..."
                : "Connection lost — attempting to reconnect"}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-muted">
            Match ID: {matchId.slice(0, 8)}...
            {botInfo.isBotMatch && (
              <span className="ml-2 text-purple-400">
                🤖 Bot Match
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:underline"
            >
              Share Watch Link
            </Link>
            <span>
              {matchState.board.mode === "MODE_1" ? "Sliding" : "Classic"} Mode
            </span>
          </div>
        </div>

        {/* Bot Thinking Indicator */}
        {botInfo.isBotThinking && (
          <BotThinkingIndicator botDifficulty={botInfo.botDifficulty || 'medium'} />
        )}

        {/* Score Panel */}
        <ScorePanel
          score={matchState.score}
          currentPlayer={matchState.turn.currentPlayer}
          yourPlayer={yourPlayer}
          isGameOver={matchState.isGameOver}
          winner={matchState.winner}
        />

        {/* Turn Indicator */}
        <TurnIndicator
          currentPlayer={matchState.turn.currentPlayer}
          yourPlayer={yourPlayer}
          isYourTurn={matchState.turn.isYourTurn}
          isGameOver={matchState.isGameOver}
          winner={matchState.winner}
          isDraw={matchState.isDraw}
        />

        {/* Game Board */}
        <GameBoard
          board={matchState.board}
          currentPlayer={matchState.turn.currentPlayer}
          yourPlayer={yourPlayer}
          winInfo={matchState.winInfo}
          isGameOver={matchState.isGameOver}
          onCellClick={handleCellClick}
          disabled={!matchState.turn.isYourTurn || matchState.isGameOver}
        />

        {/* Match Timer */}
        <MatchTimer
          matchStartedAt={Date.now() - 60000} // Placeholder
          isGameOver={matchState.isGameOver}
          showTurnTimer={false}
        />

        {/* Action Buttons */}
        {!matchState.isGameOver && (
          <div className="flex justify-center">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowForfeitConfirm(true)}
            >
              Forfeit
            </Button>
          </div>
        )}

        {/* Spectator count */}
        {matchState.spectatorCount > 0 && (
          <div className="text-center text-sm text-text-muted">
            👁 {matchState.spectatorCount} spectator
            {matchState.spectatorCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Result Modal */}
      <Modal
        isOpen={showResultModal || matchState.isGameOver}
        onClose={() => setShowResultModal(false)}
        title=""
        showCloseButton={false}
        size="lg"
      >
        <div className="text-center py-6">
          {/* Victory/Defeat Icon */}
          <div className="mb-6">
            {matchState.winner === yourPlayer ? (
              // Victory - Trophy
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 animate-pulse shadow-lg shadow-yellow-500/50">
                  <svg
                    className="w-14 h-14 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 text-3xl animate-bounce">
                  🎉
                </div>
                <div className="absolute -top-2 -left-2 text-3xl animate-bounce delay-100">
                  🎊
                </div>
              </div>
            ) : matchState.isDraw ? (
              // Draw - Handshake
              <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600">
                <span className="text-5xl">🤝</span>
              </div>
            ) : (
              // Defeat
              <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600">
                <span className="text-5xl">😔</span>
              </div>
            )}
          </div>

          {/* Result Text */}
          <h2
            className={cn(
              "text-4xl font-bold mb-2 animate-[fadeInUp_0.5s_ease-out]",
              matchState.winner === yourPlayer
                ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500"
                : matchState.isDraw
                  ? "text-text-secondary"
                  : "text-accent-error",
            )}
          >
            {matchState.winner === yourPlayer
              ? "Victory!"
              : matchState.isDraw
                ? "It's a Draw!"
                : "Defeat"}
          </h2>

          <p className="text-lg text-text-secondary mb-6">
            {matchState.winner === yourPlayer
              ? botInfo.isBotMatch
                ? `You defeated the ${botInfo.botDifficulty} bot!`
                : "Congratulations! You played brilliantly!"
              : matchState.isDraw
                ? "A well-fought battle!"
                : botInfo.isBotMatch
                  ? `The ${botInfo.botDifficulty} bot won this time. Try again!`
                  : "Better luck next time!"}
          </p>

          {/* Match Stats */}
          <div className="flex justify-center gap-8 mb-8 p-4 rounded-xl bg-surface-elevated">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {result?.duration || "0:00"}
              </div>
              <div className="text-sm text-text-muted">Duration</div>
            </div>
            <div className="w-px bg-border-subtle"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {result?.moveCount ||
                  matchState.board.cells.flat().filter((c) => c.value).length}
              </div>
              <div className="text-sm text-text-muted">Moves</div>
            </div>
            <div className="w-px bg-border-subtle"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {yourPlayer || "?"}
              </div>
              <div className="text-sm text-text-muted">You Played</div>
            </div>
          </div>

          {/* Bot Match Info */}
          {botInfo.isBotMatch && (
            <div className="mb-6 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
              <p className="text-sm text-purple-400">
                🤖 Bot match rating changes are reduced (0.6x multiplier)
              </p>
            </div>
          )}

          {/* Rematch UI - Hidden for bot matches */}
          {!botInfo.isBotMatch && !matchState.isBotMatch && opponentRequestedRematch ? (
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
          ) : !botInfo.isBotMatch && !matchState.isBotMatch && rematchRequested ? (
            <div className="mb-6 p-4 rounded-xl bg-surface-elevated">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
                <p className="text-text-secondary">
                  Waiting for opponent to accept...
                </p>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!botInfo.isBotMatch && !matchState.isBotMatch && !rematchRequested && !opponentRequestedRematch && (
              <Button
                size="lg"
                onClick={requestRematch}
                className="bg-gradient-to-r from-accent-primary to-purple-600 hover:from-accent-primary/90 hover:to-purple-600/90"
              >
                🔄 Request Rematch
              </Button>
            )}
            <Link href={matchState.isRanked ? ROUTES.PLAY_RANKED : ROUTES.PLAY_ONLINE}>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                🎮 Find New Match
              </Button>
            </Link>
            <Link href={ROUTES.PLAY}>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                ← Back to Menu
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Forfeit Confirmation Modal */}
      <Modal
        isOpen={showForfeitConfirm}
        onClose={() => setShowForfeitConfirm(false)}
        title="Forfeit Match?"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          Are you sure you want to forfeit? This will count as a loss.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="danger" onClick={handleForfeit}>
            Yes, Forfeit
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowForfeitConfirm(false)}
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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 rounded-lg bg-accent-warning/10 border border-accent-warning animate-pulse">
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
