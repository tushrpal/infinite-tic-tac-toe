"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
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
import {
  AchievementsCard,
  EncouragementCard,
  NextGoalCard,
  ProfileHeader,
  RankProgressCard,
  RecentMatchesCard,
  StatTiles,
  WinRateCard,
  getBestRating,
  type Streak,
} from "@/components/profile/ProfileSections";
import { ArrowLeftIcon, PencilIcon } from "@/components/profile/ProfileIcons";

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

function getRecentForm(matches: PlayerMatchSummary[]): PlayerMatchSummary[] {
  return matches.slice(0, 10);
}

export type ProfileClientProps = {
  initialPlayerId?: string | null;
  initialProfile?: PlayerStatsProfile | null;
  initialMatches?: PlayerMatchSummary[] | null;
  serverError?: string | null;
};

export function ProfileClient({
  initialPlayerId = null,
  initialProfile = null,
  initialMatches = null,
  serverError = null,
}: ProfileClientProps) {
  const searchParams = useSearchParams();
  const queryPlayerId = searchParams.get("playerId") ?? initialPlayerId;

  const hasServerData = Boolean(initialProfile);
  const [profile, setProfile] = useState<PlayerStatsProfile | null>(initialProfile);
  const [matches, setMatches] = useState<PlayerMatchSummary[]>(initialMatches ?? []);
  const [loading, setLoading] = useState(!hasServerData && !serverError);
  const [error, setError] = useState<string | null>(serverError);
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const viewingOwnProfile = useMemo(() => {
    const storedId = getStoredPlayerId();
    return !queryPlayerId || queryPlayerId === storedId;
  }, [queryPlayerId]);

  const streak = useMemo(() => calculateStreak(matches), [matches]);
  const recentForm = useMemo(() => getRecentForm(matches), [matches]);

  useEffect(() => {
    if (hasServerData && queryPlayerId === initialPlayerId) {
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        let playerId: string;

        if (queryPlayerId) {
          playerId = queryPlayerId;
        } else {
          const storedId = getStoredPlayerId();
          if (storedId) {
            playerId = storedId;
          } else {
            const created = await ensurePlayer();
            playerId = created.playerId;
          }
        }

        try {
          const [profileData, matchData] = await Promise.all([
            fetchPlayerProfile(playerId),
            fetchPlayerMatches(playerId, 20),
          ]);

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
        const [profileData, matchData] = await Promise.all([
          fetchPlayerProfile(created.playerId),
          fetchPlayerMatches(created.playerId, 20),
        ]);

        if (isMounted) {
          setProfile(profileData);
          setMatches(matchData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
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
  }, [queryPlayerId, hasServerData, initialPlayerId]);

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

  const editForm = isEditing ? (
    <div className="space-y-2">
      <label htmlFor="display-name" className="text-xs text-text-muted">
        Display name
      </label>
      <input
        id="display-name"
        type="text"
        value={newDisplayName}
        onChange={(e) => setNewDisplayName(e.target.value)}
        placeholder="Enter display name"
        className="w-full max-w-sm rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        maxLength={50}
        autoFocus
      />
      {updateError && <div className="text-xs text-accent-error">{updateError}</div>}
      <div className="flex gap-2">
        <button
          onClick={handleSaveDisplayName}
          disabled={isUpdating}
          className="rounded-lg bg-gradient-to-r from-accent-primary to-[#7c3aed] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancelEdit}
          disabled={isUpdating}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-text-primary hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <main className="space-scope relative isolate flex-1 px-3 py-6 sm:px-4 sm:py-8">
      <ScreenBackdrop image="queueMatchBg" dim={0.6} />
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </Link>
          {profile && viewingOwnProfile && !isEditing && !loading && !error && (
            <button
              onClick={handleEditClick}
              className="glass-panel !rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent-primary/60"
            >
              <PencilIcon className="h-4 w-4 text-accent-primary" />
              Edit Profile
            </button>
          )}
        </div>

        {loading && (
          <div className="glass-panel p-6">
            <div className="text-sm text-text-muted">Loading profile...</div>
          </div>
        )}

        {error && !loading && (
          <div className="glass-panel !border-accent-error/40 p-6 text-sm text-accent-error">
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <>
            <ProfileHeader profile={profile} editing={editForm} />

            <StatTiles profile={profile} />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <WinRateCard profile={profile} recent={recentForm} />
              <EncouragementCard profile={profile} streak={streak} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <RankProgressCard rating={getBestRating(profile)} />
              <NextGoalCard rating={getBestRating(profile)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {viewingOwnProfile && (
                <AccountLinking
                  playerId={profile.playerId}
                  isAnonymous={profile.isAnonymous ?? true}
                  linkedProviders={{
                    google: profile.oauthProvider === "google",
                    discord: profile.oauthProvider === "discord",
                  }}
                />
              )}
              <AchievementsCard
                profile={profile}
                matches={matches}
                className={viewingOwnProfile ? undefined : "lg:col-span-2"}
              />
            </div>

            <RecentMatchesCard matches={matches} />
          </>
        )}
      </div>
    </main>
  );
}
