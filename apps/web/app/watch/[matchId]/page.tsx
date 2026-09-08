"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { GameBoard } from "@/components/board/GameBoard";
import { ScorePanel } from "@/components/hud/ScorePanel";
import { TurnIndicator } from "@/components/hud/TurnIndicator";
import { MatchTimer } from "@/components/hud/MatchTimer";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSpectatorMatch } from "@/hooks/useSpectatorMatch";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";
import { getOnlineModeInfo } from "@/lib/gameModes";
import { ModeBadge } from "@/components/hud/ModeBadge";

function statusLabel(status: "waiting" | "live" | "finished"): string {
  if (status === "waiting") return "Waiting";
  if (status === "live") return "Live";
  return "Finished";
}

export default function WatchMatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { connectionState } = useWebSocket();

  const { matchState, rawMatchState, result, isLoading, error } =
    useSpectatorMatch({ matchId });

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading live match...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Unable to Watch Match</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link
            href={ROUTES.HOME}
            className="text-accent-primary hover:underline"
          >
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  if (!matchState || !rawMatchState) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <p className="text-text-secondary">Match is not ready yet.</p>
      </main>
    );
  }

  const viewStatus =
    matchState.isGameOver || matchState.status === "completed"
      ? "finished"
      : matchState.status === "active"
        ? "live"
        : "waiting";

  return (
    <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 sm:gap-6">
        {connectionState.status !== "connected" && (
          <div className="order-1 p-3 rounded-lg bg-accent-warning/10 border border-accent-warning text-center flex items-center justify-center gap-2">
            {connectionState.status === "reconnecting" && (
              <div className="w-4 h-4 rounded-full border-2 border-accent-warning border-t-transparent animate-spin" />
            )}
            <span className="text-sm text-accent-warning">
              {connectionState.status === "reconnecting"
                ? "Reconnecting spectator feed..."
                : "Connection lost — trying to reconnect"}
            </span>
          </div>
        )}

        <div className="order-2 sm:order-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Link
            href={ROUTES.HOME}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Home
          </Link>
          <div className="text-xs sm:text-sm text-text-muted truncate">
            Match: {matchId.slice(0, 8)}...
          </div>
        </div>

        <div className="order-3 sm:order-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-board-grid bg-surface-elevated">
          <div className="text-sm text-text-secondary">
            <ModeBadge mode={matchState.board.mode} />
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                viewStatus === "live" &&
                  "bg-accent-success/15 text-accent-success",
                viewStatus === "waiting" &&
                  "bg-accent-warning/15 text-accent-warning",
                viewStatus === "finished" &&
                  "bg-text-muted/20 text-text-secondary",
              )}
            >
              {statusLabel(viewStatus)}
            </span>
            <span className="text-xs text-text-muted">
              👁 {matchState.spectatorCount}
            </span>
          </div>
        </div>

        <div className="order-4 sm:order-6">
          <TurnIndicator
            currentPlayer={matchState.turn.currentPlayer}
            yourPlayer={null}
            isYourTurn={false}
            isGameOver={matchState.isGameOver}
            winner={matchState.winner}
            isDraw={matchState.isDraw}
            showDraw={getOnlineModeInfo(matchState.board.mode).canDraw}
          />
        </div>

        <div className="order-5 sm:order-7">
          <GameBoard
            board={matchState.board}
            currentPlayer={matchState.turn.currentPlayer}
            yourPlayer={null}
            winInfo={matchState.winInfo}
            isGameOver={matchState.isGameOver}
            disabled={true}
            showMoveNumbers={true}
          />
        </div>

        <div className="order-6 sm:order-5">
          <ScorePanel
            score={matchState.score}
            currentPlayer={matchState.turn.currentPlayer}
            yourPlayer={null}
            isGameOver={matchState.isGameOver}
            winner={matchState.winner}
          />
        </div>

        <div className="order-7 sm:order-8">
          <MatchTimer
            matchStartedAt={rawMatchState.startedAt}
            isGameOver={matchState.isGameOver}
            showTurnTimer={false}
          />
        </div>

        {viewStatus === "finished" && (
          <div className="order-8 text-center p-4 rounded-xl bg-surface-elevated border border-board-grid">
            <p className="text-lg font-semibold mb-1">
              {matchState.isDraw && getOnlineModeInfo(matchState.board.mode).canDraw
                ? "Match Ended in a Draw"
                : `${matchState.winner} Wins`}
            </p>
            <p className="text-sm text-text-secondary">
              {result?.moveCount ?? rawMatchState.gameState.moveCount} moves
              played
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
