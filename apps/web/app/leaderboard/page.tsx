"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/api";

type LeaderboardPlayer = {
  name: string;
  rating: number;
};

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  displayName: string;
  rating: number;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadLeaderboard() {
      try {
        const data = await apiRequest<LeaderboardResponse | LeaderboardEntry[]>(
          "/leaderboard",
        );
        const entries = Array.isArray(data)
          ? data
          : Array.isArray(data.leaderboard)
            ? data.leaderboard
            : [];
        const normalized = entries.map((entry) => ({
          name: entry.displayName,
          rating: entry.rating,
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
  }, []);

  return (
    <main className="flex-1 px-4 py-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href={ROUTES.HOME}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
          <p className="text-text-secondary mt-1">Top players by rating</p>
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
                    key={`${player.name}-${player.rating}-${index}`}
                    className="border-t border-board-grid/50"
                  >
                    <td className="py-3 px-4 font-semibold">{index + 1}</td>
                    <td className="py-3 px-4">{player.name}</td>
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
