"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/helpers";
import {
  ensurePlayer,
  fetchPlayerMatches,
  fetchPlayerProfile,
  getStoredPlayerId,
  type PlayerMatchSummary,
  type PlayerStatsProfile,
} from "@/lib/player";

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerStatsProfile | null>(null);
  const [matches, setMatches] = useState<PlayerMatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const storedId = getStoredPlayerId();
        let playerId = storedId;

        if (!playerId) {
          const created = await ensurePlayer();
          playerId = created.playerId;
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
  }, []);

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
                <div>
                  <h1 className="text-2xl font-semibold">
                    {profile.displayName ?? profile.playerId}
                  </h1>
                  <div className="text-xs text-text-muted">
                    Member since{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{profile.rating}</div>
                  <div className="text-xs text-text-muted">Rating</div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <StatCard label="Matches" value={profile.matchesPlayed} />
              <StatCard label="Wins" value={profile.wins} />
              <StatCard label="Losses" value={profile.losses} />
              <StatCard
                label="Win Rate"
                value={`${profile.winRate.toFixed(1)}%`}
              />
            </section>

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
                      <div>
                        <div className="font-medium">{match.matchId}</div>
                        <div className="text-xs text-text-muted">
                          {formatRelativeTime(match.createdAt)}
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
