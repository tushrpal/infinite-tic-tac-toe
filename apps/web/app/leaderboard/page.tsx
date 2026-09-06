"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/helpers";
import { getStoredPlayerId } from "@/lib/player";

type LeaderboardPlayer = {
  username: string;
  name: string;
  rating: number;
  playerId: string;
  league?: string;
  leagueColor?: string;
};

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  displayName: string;
  rating: number;
  league?: string;
  leagueColor?: string;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  hasMore?: boolean;
};

type LeagueLeaderboardResponse = {
  entries: LeaderboardEntry[];
  total: number;
  hasMore: boolean;
};

type PlayerLeagueResponse = {
  playerId: string;
  displayName: string;
  rating: number;
  league: string;
  leagueColor: string;
  minRating: number;
  maxRating: number;
};

type ModeFilter = "all" | "mode1" | "mode2" | "my-league";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeFilter>("all");
  const [userLeague, setUserLeague] = useState<PlayerLeagueResponse | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const ITEMS_PER_PAGE = 50;

  // Load user's league on mount
  useEffect(() => {
    async function loadUserLeague() {
      try {
        const playerId = getStoredPlayerId();
        if (!playerId) return;

        const data = await apiRequest<PlayerLeagueResponse>(
          `/leaderboard/player/${playerId}/league`
        );
        setUserLeague(data);
      } catch (error) {
        console.error("Failed to load user league:", error);
      }
    }

    loadUserLeague();
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      if (selectedMode === "my-league") {
        if (!userLeague) return;

        const data = await apiRequest<LeagueLeaderboardResponse>(
          `/leaderboard/league/${userLeague.league}?offset=${players.length}&limit=${ITEMS_PER_PAGE}`
        );

        const normalized = data.entries.map((entry) => ({
          username: entry.username,
          name: entry.displayName,
          rating: entry.rating,
          playerId: entry.playerId,
          league: entry.league,
          leagueColor: entry.leagueColor,
        }));

        setPlayers((prev) => [...prev, ...normalized]);
        setHasMore(data.hasMore);
      } else {
        const endpoint = selectedMode === "all"
          ? `/leaderboard?offset=${players.length}&limit=${ITEMS_PER_PAGE}`
          : `/leaderboard?mode=${selectedMode}&offset=${players.length}&limit=${ITEMS_PER_PAGE}`;

        const data = await apiRequest<LeaderboardResponse>(endpoint);
        const normalized = data.leaderboard.map((entry) => ({
          username: entry.username,
          name: entry.displayName,
          rating: entry.rating,
          playerId: entry.playerId,
        }));

        setPlayers((prev) => [...prev, ...normalized]);
        setHasMore(data.hasMore ?? false);
      }
    } catch (error) {
      console.error("Failed to load more entries:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedMode, userLeague, players.length, isLoadingMore, hasMore]);

  useEffect(() => {
    let isActive = true;

    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        if (selectedMode === "my-league") {
          if (!userLeague) {
            if (isActive) {
              setPlayers([]);
              setHasError(false);
              setIsLoading(false);
            }
            return;
          }

          const data = await apiRequest<LeagueLeaderboardResponse>(
            `/leaderboard/league/${userLeague.league}?offset=0&limit=${ITEMS_PER_PAGE}`
          );

          const normalized = data.entries.map((entry) => ({
            username: entry.username,
            name: entry.displayName,
            rating: entry.rating,
            playerId: entry.playerId,
            league: entry.league,
            leagueColor: entry.leagueColor,
          }));

          if (isActive) {
            setPlayers(normalized);
            setHasMore(data.hasMore);
            setHasError(false);
          }
        } else {
          const endpoint = selectedMode === "all"
            ? `/leaderboard?limit=${ITEMS_PER_PAGE}`
            : `/leaderboard?mode=${selectedMode}&limit=${ITEMS_PER_PAGE}`;

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
            setHasMore(!Array.isArray(data) ? (data.hasMore ?? false) : false);
            setHasError(false);
          }
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
  }, [selectedMode, userLeague]);

  return (
    <main className="flex-1 px-4 py-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
          <p className="text-text-secondary mt-1">Top players by rating</p>
          {userLeague && selectedMode === "my-league" && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-sm px-3 py-1 rounded font-semibold"
                style={{ backgroundColor: `${userLeague.leagueColor}20`, color: userLeague.leagueColor }}
              >
                {userLeague.league} League
              </span>
              <span className="text-sm text-text-muted">
                ({userLeague.minRating} - {userLeague.maxRating === Infinity ? "∞" : userLeague.maxRating} points)
              </span>
            </div>
          )}
        </div>

        {/* Mode Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
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
          {userLeague && (
            <button
              onClick={() => setSelectedMode("my-league")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                selectedMode === "my-league"
                  ? "bg-accent-primary text-white"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary"
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: userLeague.leagueColor }}
              ></span>
              My League ({userLeague.league})
            </button>
          )}
        </div>

        <div className="rounded-lg border border-board-grid overflow-hidden bg-surface-elevated">
          {/* Table Header */}
          <div className="bg-board-grid/10 flex items-center px-4 py-3">
            <div className="w-20 text-sm font-semibold text-text-secondary">Rank</div>
            <div className="flex-1 text-sm font-semibold text-text-secondary">Player Name</div>
            <div className="w-32 text-right text-sm font-semibold text-text-secondary">Rating</div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="py-6 px-4 text-center text-text-secondary">
              Loading...
            </div>
          ) : hasError ? (
            <div className="py-6 px-4 text-center text-text-secondary">
              No players yet
            </div>
          ) : players.length === 0 ? (
            <div className="py-6 px-4 text-center text-text-secondary">
              {selectedMode === "my-league"
                ? "No players in your league yet"
                : "No players yet"}
            </div>
          ) : (
            <>
              {players.map((player, index) => (
                <div
                  key={`${player.playerId}-${index}`}
                  className="border-t border-board-grid/50 hover:bg-board-grid/30 transition-colors flex items-center px-4 py-3"
                >
                  <div className="w-20 font-semibold">{index + 1}</div>
                  <div className="flex-1">
                    <Link href={`${ROUTES.PROFILE}?playerId=${player.playerId}`}>
                      <div>
                        {player.name && (
                          <div className="font-semibold text-text-primary hover:underline">
                            {player.name}
                          </div>
                        )}
                        <div className="text-xs text-text-muted">@{player.username}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="w-32 text-right font-mono flex items-center justify-end gap-2">
                    {player.league && player.leagueColor && (
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: `${player.leagueColor}20`, color: player.leagueColor }}
                      >
                        {player.league}
                      </span>
                    )}
                    <span>{player.rating}</span>
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="border-t border-board-grid/50 py-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
              {!hasMore && players.length >= ITEMS_PER_PAGE && (
                <div className="border-t border-board-grid/50 py-4 text-center text-text-muted text-sm">
                  End of leaderboard
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
