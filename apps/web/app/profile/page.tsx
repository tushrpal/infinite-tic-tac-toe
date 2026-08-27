"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/helpers";
import {
  ensurePlayer,
  fetchPlayerMatches,
  fetchPlayerProfile,
  getStoredPlayerId,
  updateDisplayName,
  type PlayerMatchSummary,
  type PlayerStatsProfile,
} from "@/lib/player";
import { AccountLinking } from "@/components/profile/AccountLinking";

type Streak = {
  type: "win" | "loss" | "draw";
  count: number;
};

// Calculate current streak from match history
function calculateStreak(matches: PlayerMatchSummary[]): Streak {
  if (matches.length === 0) {
    return { type: "draw", count: 0 };
  }

  const mostRecent = matches[0];
  let count = 0;

  for (const match of matches) {
    if (match.result === mostRecent.result) {
      count++;
    } else {
      break;
    }
  }

  return { type: mostRecent.result, count };
}

// Get recent form (last 10 matches)
function getRecentForm(matches: PlayerMatchSummary[]): PlayerMatchSummary[] {
  return matches.slice(0, 10);
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<PlayerStatsProfile | null>(null);
  const [matches, setMatches] = useState<PlayerMatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if viewing own profile
  const viewingOwnProfile = useMemo(() => {
    const queryPlayerId = searchParams.get('playerId');
    const storedId = getStoredPlayerId();
    return !queryPlayerId || queryPlayerId === storedId;
  }, [searchParams]);

  // Calculate streak and recent form
  const streak = useMemo(() => calculateStreak(matches), [matches]);
  const recentForm = useMemo(() => getRecentForm(matches), [matches]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if viewing another player's profile via query param
        const queryPlayerId = searchParams.get('playerId');

        let playerId: string;

        if (queryPlayerId) {
          // Viewing another player's profile
          playerId = queryPlayerId;
        } else {
          // Viewing own profile
          const storedId = getStoredPlayerId();
          if (storedId) {
            playerId = storedId;
          } else {
            const created = await ensurePlayer();
            playerId = created.playerId;
          }
        }

        try {
          const profileData = await fetchPlayerProfile(playerId);
          const matchData = await fetchPlayerMatches(playerId, 20);

          if (isMounted) {
            setProfile(profileData);
            setMatches(matchData);
          }
          return;
        } catch (innerError) {
          const status = (innerError as Error & { status?: number }).status;
          if (status !== 404) {
            throw innerError;
          }
        }

        const created = await ensurePlayer();
        const profileData = await fetchPlayerProfile(created.playerId);
        const matchData = await fetchPlayerMatches(created.playerId, 20);

        if (isMounted) {
          setProfile(profileData);
          setMatches(matchData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleEditClick = () => {
    if (profile) {
      setNewDisplayName(profile.displayName || "");
      setIsEditing(true);
      setUpdateError(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewDisplayName("");
    setUpdateError(null);
  };

  const handleSaveDisplayName = async () => {
    if (!profile || !newDisplayName.trim()) {
      setUpdateError("Display name cannot be empty");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updated = await updateDisplayName(profile.playerId, newDisplayName.trim());
      setProfile({ ...profile, displayName: updated.displayName ?? null });
      setIsEditing(false);
      setNewDisplayName("");
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update display name");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.HOME}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Back to Home
          </Link>
          <span className="text-xs text-text-muted">Profile</span>
        </div>

        {loading && (
          <div className="rounded-xl border border-board-grid bg-surface-elevated p-6">
            <div className="text-sm text-text-muted">Loading profile...</div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-accent-error/40 bg-surface-elevated p-6 text-sm text-accent-error">
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <>
            <section className="rounded-xl border border-board-grid bg-surface-elevated p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  {/* Display Name (editable) - Main Heading */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Enter display name"
                        className="w-full max-w-sm px-3 py-2 border border-board-grid rounded-lg bg-surface-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        maxLength={50}
                      />
                      {updateError && (
                        <div className="text-xs text-accent-error">{updateError}</div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveDisplayName}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50"
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm bg-board-grid text-text-primary rounded-lg hover:bg-board-grid/80"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-text-primary">
                          {profile.displayName || profile.username || "No display name set"}
                        </h1>
                        {viewingOwnProfile && (
                          <button
                            onClick={handleEditClick}
                            className="text-sm text-accent-primary hover:underline"
                            title="Edit display name"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {/* Username (subtitle) - Only show when both exist */}
                      {profile.displayName && profile.username && (
                        <p className="text-text-tertiary mt-1">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-text-muted mt-2">
                    Member since{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{profile.rating}</div>
                  <div className="text-xs text-text-muted">Total Rating</div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{profile.ratingMode1}</div>
                      <div className="text-xs text-text-muted">Mode 1</div>
                    </div>
                    <div>
                      <div className="font-semibold">{profile.ratingMode2}</div>
                      <div className="text-xs text-text-muted">Mode 2</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <StatCard label="Matches" value={profile.matchesPlayed} />
              <StatCard label="Wins" value={profile.wins} />
              <StatCard label="Losses" value={profile.losses} />
              <StatCard label="Draws" value={profile.draws} />
            </section>

            {/* Win Rate Progress Bar */}
            <section className="rounded-xl border border-board-grid bg-surface-elevated p-6">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Win Rate</h3>
                  <span className="text-lg font-bold">{profile.winRate.toFixed(1)}%</span>
                </div>
                <WinRateBar winRate={profile.winRate} />
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>{profile.wins}W</span>
                <span>{profile.draws}D</span>
                <span>{profile.losses}L</span>
              </div>
            </section>

            {/* Account Linking - Only show on own profile */}
            {viewingOwnProfile && (
              <AccountLinking
                playerId={profile.playerId}
                isAnonymous={profile.isAnonymous ?? true}
                linkedProviders={{
                  google: profile.oauthProvider === 'google',
                  discord: profile.oauthProvider === 'discord',
                }}
              />
            )}

            {/* Performance Stats */}
            {matches.length > 0 && (
              <section className="rounded-xl border border-board-grid bg-surface-elevated p-6">
                <h2 className="text-lg font-semibold mb-4">Performance</h2>

                {/* Current Streak */}
                <div className="mb-6">
                  <div className="text-xs text-text-muted mb-2">Current Streak</div>
                  <StreakDisplay streak={streak} />
                </div>

                {/* Recent Form */}
                <div>
                  <div className="text-xs text-text-muted mb-2">
                    Recent Form (Last {recentForm.length} matches)
                  </div>
                  <RecentFormDisplay matches={recentForm} />
                </div>
              </section>
            )}

            <section className="rounded-xl border border-board-grid bg-surface-elevated p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Matches</h2>
                <span className="text-xs text-text-muted">
                  {matches.length} shown
                </span>
              </div>

              {matches.length === 0 ? (
                <div className="text-sm text-text-muted">No matches yet.</div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.matchId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-board-grid/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Opponent info */}
                            <div className="flex flex-col min-w-0">
                              {match.isBotMatch ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">vs Bot</span>
                                  {match.botDifficulty && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 capitalize">
                                      {match.botDifficulty}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <span className="font-medium truncate">
                                    vs {match.opponentDisplayName || match.opponentUsername || 'Unknown Player'}
                                  </span>
                                  {match.opponentUsername && match.opponentDisplayName && (
                                    <span className="text-xs text-text-muted">
                                      @{match.opponentUsername}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Match type badges */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {match.isRanked ? (
                                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                                  Ranked
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-board-grid text-text-muted">
                                  {match.isBotMatch ? 'Practice' : 'Casual'}
                                </span>
                              )}
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-board-grid/60 text-text-secondary">
                                {match.mode === 'mode1' ? 'Mode 1' : 'Mode 2'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">
                            {formatRelativeTime(match.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <ResultPill result={match.result} />
                        <div className="text-sm font-semibold">
                          {formatRatingDelta(match.ratingChange)}
                        </div>
                        <Link
                          href={ROUTES.REPLAY(match.matchId)}
                          className="text-sm text-accent-primary hover:underline"
                        >
                          Replay
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-board-grid bg-surface-elevated p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function WinRateBar({ winRate }: { winRate: number }) {
  const percentage = Math.min(100, Math.max(0, winRate));

  // Color based on win rate
  const color =
    percentage >= 60 ? "bg-accent-success" :
    percentage >= 45 ? "bg-accent-primary" :
    "bg-accent-error";

  return (
    <div className="w-full bg-board-grid rounded-full h-3 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function StreakDisplay({ streak }: { streak: Streak }) {
  if (streak.count === 0) {
    return (
      <div className="text-sm text-text-muted">
        No current streak
      </div>
    );
  }

  const color =
    streak.type === "win" ? "text-accent-success" :
    streak.type === "loss" ? "text-accent-error" :
    "text-text-secondary";

  const bgColor =
    streak.type === "win" ? "bg-accent-success/10" :
    streak.type === "loss" ? "bg-accent-error/10" :
    "bg-board-grid/30";

  const icon =
    streak.type === "win" ? "🔥" :
    streak.type === "loss" ? "❄️" :
    "➖";

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${bgColor}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <div className={`text-xl font-bold ${color}`}>
          {streak.count} {streak.type === "win" ? "Win" : streak.type === "loss" ? "Loss" : "Draw"}{streak.count !== 1 ? "s" : ""}
        </div>
        <div className="text-xs text-text-muted">Current Streak</div>
      </div>
    </div>
  );
}

function RecentFormDisplay({ matches }: { matches: PlayerMatchSummary[] }) {
  if (matches.length === 0) {
    return (
      <div className="text-sm text-text-muted">
        No recent matches
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {matches.map((match, index) => (
        <FormBadge key={match.matchId || index} result={match.result} />
      ))}
    </div>
  );
}

function FormBadge({ result }: { result: "win" | "loss" | "draw" }) {
  const bgColor =
    result === "win" ? "bg-accent-success" :
    result === "loss" ? "bg-accent-error" :
    "bg-board-grid";

  const letter =
    result === "win" ? "W" :
    result === "loss" ? "L" :
    "D";

  return (
    <div
      className={`w-8 h-8 rounded-md ${bgColor} flex items-center justify-center text-white text-xs font-bold`}
      title={result}
    >
      {letter}
    </div>
  );
}

function ResultPill({ result }: { result: "win" | "loss" | "draw" }) {
  const color =
    result === "win"
      ? "text-accent-success"
      : result === "loss"
        ? "text-accent-error"
        : "text-text-secondary";

  return (
    <span
      className={`rounded-full bg-board-grid/60 px-3 py-1 text-xs font-semibold uppercase ${color}`}
    >
      {result}
    </span>
  );
}

function formatRatingDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-xl border border-board-grid bg-surface-elevated p-6">
            <div className="text-sm text-text-muted">Loading profile...</div>
          </div>
        </div>
      </main>
    }>
      <ProfileContent />
    </Suspense>
  );
}
