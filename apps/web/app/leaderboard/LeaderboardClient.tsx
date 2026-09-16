"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/helpers";
import { getOnlineModeInfo } from "@/lib/gameModes";
import { getStoredPlayerId } from "@/lib/player";
import type { LeaderboardPlayer, ModeFilter } from "@/lib/server/leaderboard";

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

type ExtendedModeFilter = ModeFilter | "my-league";

const ITEMS_PER_PAGE = 50;

function normalizeEntry(entry: LeaderboardEntry): LeaderboardPlayer {
  return {
    username: entry.username,
    name: entry.displayName,
    rating: entry.rating,
    playerId: entry.playerId,
    league: entry.league,
    leagueColor: entry.leagueColor,
  };
}

type LeaderboardClientProps = {
  initialMode: ModeFilter;
  initialPlayers: LeaderboardPlayer[];
  initialHasMore: boolean;
};

export function LeaderboardClient({
  initialMode,
  initialPlayers,
  initialHasMore,
}: LeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>(initialPlayers);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ExtendedModeFilter>(initialMode);
  const [userLeague, setUserLeague] = useState<PlayerLeagueResponse | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    async function loadUserLeague() {
      try {
        const playerId = getStoredPlayerId();
        if (!playerId) return;

        const data = await apiRequest<PlayerLeagueResponse>(
          `/leaderboard/player/${playerId}/league`,
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
          `/leaderboard/league/${userLeague.league}?offset=${players.length}&limit=${ITEMS_PER_PAGE}`,
        );

        setPlayers((prev) => [...prev, ...data.entries.map(normalizeEntry)]);
        setHasMore(data.hasMore);
      } else {
        const endpoint = selectedMode === "all"
          ? `/leaderboard?offset=${players.length}&limit=${ITEMS_PER_PAGE}`
          : `/leaderboard?mode=${selectedMode}&offset=${players.length}&limit=${ITEMS_PER_PAGE}`;

        const data = await apiRequest<LeaderboardResponse>(endpoint);
        setPlayers((prev) => [...prev, ...data.leaderboard.map(normalizeEntry)]);
        setHasMore(data.hasMore ?? false);
      }
    } catch (error) {
      console.error("Failed to load more entries:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedMode, userLeague, players.length, isLoadingMore, hasMore]);

  useEffect(() => {
    if (selectedMode === initialMode) {
      setPlayers(initialPlayers);
      setHasMore(initialHasMore);
      setHasError(false);
      setIsLoading(false);
      return;
    }

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
            `/leaderboard/league/${userLeague.league}?offset=0&limit=${ITEMS_PER_PAGE}`,
          );

          if (isActive) {
            setPlayers(data.entries.map(normalizeEntry));
            setHasMore(data.hasMore);
            setHasError(false);
          }
        } else {
          const endpoint = selectedMode === "all"
            ? `/leaderboard?limit=${ITEMS_PER_PAGE}`
            : `/leaderboard?mode=${selectedMode}&limit=${ITEMS_PER_PAGE}`;

          const data = await apiRequest<LeaderboardResponse | LeaderboardEntry[]>(endpoint);
          const entries = Array.isArray(data)
            ? data
            : Array.isArray(data.leaderboard)
              ? data.leaderboard
              : [];

          if (isActive) {
            setPlayers(entries.map(normalizeEntry));
            setHasMore(!Array.isArray(data) ? (data.hasMore ?? false) : false);
            setHasError(false);
          }
        }
      } catch {
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
  }, [selectedMode, userLeague, initialMode, initialPlayers, initialHasMore]);

  const handleModeChange = (mode: ExtendedModeFilter) => {
    setSelectedMode(mode);
    if (mode === "all" || mode === "mode1" || mode === "mode2") {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "all") {
        params.delete("mode");
      } else {
        params.set("mode", mode);
      }
      const query = params.toString();
      router.replace(query ? `${ROUTES.LEADERBOARD}?${query}` : ROUTES.LEADERBOARD);
    }
  };

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

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => handleModeChange("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedMode === "all"
                ? "bg-accent-primary text-accent-primary-foreground"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            All Modes
          </button>
          <button
            onClick={() => handleModeChange("mode1")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedMode === "mode1"
                ? "bg-accent-primary text-accent-primary-foreground"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            Mode 1 ({getOnlineModeInfo("MODE_1").label})
          </button>
          <button
            onClick={() => handleModeChange("mode2")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedMode === "mode2"
                ? "bg-accent-primary text-accent-primary-foreground"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            Mode 2 ({getOnlineModeInfo("MODE_2").label})
          </button>
          {userLeague && (
            <button
              onClick={() => handleModeChange("my-league")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                selectedMode === "my-league"
                  ? "bg-accent-primary text-accent-primary-foreground"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary",
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: userLeague.leagueColor }}
              />
              My League ({userLeague.league})
            </button>
          )}
        </div>

        <div className="rounded-lg border border-board-grid overflow-hidden bg-surface-elevated overflow-x-auto">
          <div className="min-w-[320px]">
          <div className="bg-board-grid/10 flex items-center px-3 sm:px-4 py-3">
            <div className="w-12 sm:w-20 text-sm font-semibold text-text-secondary shrink-0">Rank</div>
            <div className="flex-1 min-w-0 text-sm font-semibold text-text-secondary">Player</div>
            <div className="w-24 sm:w-32 text-right text-sm font-semibold text-text-secondary shrink-0">Rating</div>
          </div>

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
                  className="border-t border-board-grid/50 hover:bg-board-grid/30 transition-colors flex items-center px-3 sm:px-4 py-3"
                >
                  <div className="w-12 sm:w-20 font-semibold shrink-0">{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`${ROUTES.PROFILE}?playerId=${player.playerId}`}>
                      <div>
                        {player.name && (
                          <div className="font-semibold text-text-primary hover:underline truncate">
                            {player.name}
                          </div>
                        )}
                        <div className="text-xs text-text-muted truncate">@{player.username}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="w-24 sm:w-32 text-right font-mono flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                    {player.league && player.leagueColor && (
                      <span
                        className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:inline"
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
                    className="px-4 py-2 bg-accent-primary text-accent-primary-foreground rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </main>
  );
}
