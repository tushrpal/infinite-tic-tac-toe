"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/helpers";

type LeaderboardPlayer = {
  username: string;
  name: string;
  rating: number;
  playerId: string;
};

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  displayName: string;
  rating: number;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};

type ModeFilter = "all" | "mode1" | "mode2";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeFilter>("all");

  useEffect(() => {
    let isActive = true;

    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const endpoint = selectedMode === "all"
          ? "/leaderboard"
          : `/leaderboard?mode=${selectedMode}`;

        const data = await apiRequest<LeaderboardResponse | LeaderboardEntry[]>(
          endpoint,
        );
        const entries = Array.isArray(data)
          ? data
          : Array.isArray(data.leaderboard)
            ? data.leaderboard
            : [];
        const normalized = entries.map((entry) => ({
          username: entry.username,
          name: entry.displayName,
          rating: entry.rating,
          playerId: entry.playerId,
        }));
        if (isActive) {
          setPlayers(normalized);
          setHasError(false);
        }
      } catch (error) {
        if (isActive) {
          setPlayers([]);
          setHasError(true);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      isActive = false;
    };
  }, [selectedMode]);

  return (
    <main className="flex-1 px-4 py-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
          <p className="text-text-secondary mt-1">Top players by rating</p>
        </div>

        {/* Mode Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSelectedMode("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedMode === "all"
                ? "bg-accent-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary"
            )}
          >
            All Modes
          </button>
          <button
            onClick={() => setSelectedMode("mode1")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedMode === "mode1"
                ? "bg-accent-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary"
            )}
          >
            Mode 1 (Sliding)
          </button>
          <button
            onClick={() => setSelectedMode("mode2")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedMode === "mode2"
                ? "bg-accent-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary"
            )}
          >
            Mode 2 (Classic)
          </button>
        </div>

        <div className="rounded-lg border border-board-grid overflow-hidden bg-surface-elevated">
          <table className="w-full">
            <thead className="bg-board-grid/10">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                  Player Name
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 px-4 text-center text-text-secondary"
                  >
                    Loading...
                  </td>
                </tr>
              ) : hasError ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 px-4 text-center text-text-secondary"
                  >
                    No players yet
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 px-4 text-center text-text-secondary"
                  >
                    No players yet
                  </td>
                </tr>
              ) : (
                players.map((player, index) => (
                  <tr
                    key={`${player.playerId}-${index}`}
                    className="border-t border-board-grid/50 hover:bg-board-grid/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold">{index + 1}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`${ROUTES.PROFILE}?playerId=${player.playerId}`}
                      >
                        <div>
                          {player.name && (
                            <div className="font-semibold text-text-primary hover:underline">{player.name}</div>
                          )}
                          <div className="text-xs text-text-muted">@{player.username}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {player.rating}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
