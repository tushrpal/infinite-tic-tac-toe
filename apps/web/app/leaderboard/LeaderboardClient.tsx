"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { cn, getRankFromRating } from "@/lib/helpers";
import { RankEmblem } from "@/components/ui/RankEmblem";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
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
  // Read after mount so server and client render the same first paint.
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserLeague() {
      try {
        const playerId = getStoredPlayerId();
        if (!playerId) return;
        setMyPlayerId(playerId);

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

  const podium = players.length >= 3 && !isLoading && !hasError ? players.slice(0, 3) : null;

  const tabClass = (active: boolean) =>
    cn(
      "px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
      active
        ? "bg-accent-primary text-accent-primary-foreground shadow-glow-accent"
        : "text-text-secondary hover:text-text-primary hover:bg-white/5",
    );

  return (
    <main className="space-scope relative isolate flex-1 px-4 py-8 sm:py-12">
      <ScreenBackdrop image="leaderboardBg" dim={0.5} />
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Global Leaderboard</h1>
          <p className="text-text-secondary mt-1">
            The best players. The highest ratings. Will you make it to the top?
          </p>
          {userLeague && selectedMode === "my-league" && (
            <div className="mt-3 flex items-center justify-center gap-2">
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

        <div className="mb-8 flex justify-center">
          <div className="glass-panel !rounded-full inline-flex flex-wrap justify-center gap-1 p-1">
            <button onClick={() => handleModeChange("all")} className={tabClass(selectedMode === "all")}>
              All Modes
            </button>
            <button onClick={() => handleModeChange("mode1")} className={tabClass(selectedMode === "mode1")}>
              {getOnlineModeInfo("MODE_1").label}
            </button>
            <button onClick={() => handleModeChange("mode2")} className={tabClass(selectedMode === "mode2")}>
              {getOnlineModeInfo("MODE_2").label}
            </button>
            {userLeague && (
              <button
                onClick={() => handleModeChange("my-league")}
                className={tabClass(selectedMode === "my-league")}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: userLeague.leagueColor }}
                />
                My League ({userLeague.league})
              </button>
            )}
          </div>
        </div>

        {/* Podium: 2nd · 1st · 3rd */}
        {podium && (
          <div className="mb-8 grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Top three players">
            {[podium[1], podium[0], podium[2]].map((entry) => {
              const place = podium.indexOf(entry) + 1;
              return <PodiumCard key={entry.playerId} entry={entry} place={place} />;
            })}
          </div>
        )}

        <div className="glass-panel overflow-hidden overflow-x-auto">
          <div className="min-w-[320px]">
            <div className="flex items-center bg-white/5 px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <div className="w-10 sm:w-16 shrink-0">#</div>
              <div className="flex-1 min-w-0">Player</div>
              <div className="hidden sm:block w-32 shrink-0">Rank</div>
              <div className="w-20 sm:w-24 text-right shrink-0">Rating</div>
            </div>

            {isLoading ? (
              <div className="py-6 px-4 text-center text-text-secondary">Loading...</div>
            ) : hasError ? (
              <div className="py-6 px-4 text-center text-text-secondary">No players yet</div>
            ) : players.length === 0 ? (
              <div className="py-6 px-4 text-center text-text-secondary">
                {selectedMode === "my-league"
                  ? "No players in your league yet"
                  : "No players yet"}
              </div>
            ) : (
              <>
                {players.map((player, index) => {
                  const rank = getRankFromRating(player.rating);
                  const rankName = player.league ?? rank.name;
                  const rankColor = player.leagueColor ?? rank.color;
                  const isMe = Boolean(myPlayerId) && player.playerId === myPlayerId;

                  return (
                    <div
                      key={`${player.playerId}-${index}`}
                      className={cn(
                        "list-row-auto flex items-center border-t border-white/5 px-3 sm:px-4 py-3 transition-colors hover:bg-white/5",
                        isMe && "bg-accent-primary/15 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.5)]",
                      )}
                    >
                      <div className="w-10 sm:w-16 shrink-0 font-semibold">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <Link href={`${ROUTES.PROFILE}?playerId=${player.playerId}`}>
                          {player.name && (
                            <div className="font-semibold text-text-primary hover:underline truncate">
                              {player.name}
                              {isMe && <span className="ml-2 text-xs text-accent-primary">You</span>}
                            </div>
                          )}
                          <div className="text-xs text-text-muted truncate">@{player.username}</div>
                        </Link>
                      </div>
                      <div
                        className="hidden sm:flex w-32 shrink-0 items-center gap-2 text-sm font-medium"
                        style={{ color: rankColor }}
                      >
                        <RankEmblem rank={rankName} size={24} />
                        {rankName}
                      </div>
                      <div className="w-20 sm:w-24 shrink-0 text-right font-mono">{player.rating}</div>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="border-t border-white/5 py-4 text-center">
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
                  <div className="border-t border-white/5 py-4 text-center text-text-muted text-sm">
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

function PodiumCard({ entry, place }: { entry: LeaderboardPlayer; place: number }) {
  const rank = getRankFromRating(entry.rating);
  const rankName = entry.league ?? rank.name;
  const isFirst = place === 1;

  return (
    <Link
      href={`${ROUTES.PROFILE}?playerId=${entry.playerId}`}
      className={cn(
        "glass-panel glass-panel--interactive flex flex-col items-center px-2 text-center",
        isFirst ? "glass-panel--gold py-6 sm:py-8" : "py-4 sm:py-5",
      )}
    >
      <span
        className={cn(
          "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
          isFirst ? "bg-accent-warning text-black" : "bg-white/15 text-text-primary",
        )}
      >
        {place}
      </span>
      <RankEmblem rank={rankName} size={isFirst ? 64 : 48} />
      <div className="mt-2 w-full truncate font-semibold">{entry.name || entry.username}</div>
      <div className="font-mono text-sm text-text-secondary">{entry.rating}</div>
    </Link>
  );
}
