import { Suspense } from "react";
import { ProfileClient } from "./ProfileClient";
import {
  fetchPlayerMatchesServer,
  fetchPlayerProfileServer,
} from "@/lib/server/profile";
import type { PlayerMatchSummary, PlayerStatsProfile } from "@/lib/player";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

type ProfilePageProps = {
  searchParams?: { playerId?: string };
};

export async function generateMetadata({
  searchParams,
}: ProfilePageProps): Promise<ReturnType<typeof buildPageMetadata>> {
  const playerId = searchParams?.playerId;
  if (!playerId) {
    return buildPageMetadata({
      title: "Profile",
      description: "View your stats, match history, and rating.",
      path: "/profile",
      noIndex: true,
    });
  }

  try {
    const profile = await fetchPlayerProfileServer(playerId);
    const name = profile.displayName || profile.username || "Player";
    return buildPageMetadata({
      title: name,
      description: `${name} — ${profile.rating} rating, ${profile.wins}W ${profile.losses}L ${profile.draws}D on Infinite Tic-Tac-Toe.`,
      path: `/profile?playerId=${playerId}`,
      noIndex: true,
    });
  } catch {
    return buildPageMetadata({
      title: "Profile",
      description: "View player stats and match history.",
      path: PUBLIC_ROUTES.home,
      noIndex: true,
    });
  }
}

async function ProfileContent({ searchParams }: ProfilePageProps) {
  const playerId = searchParams?.playerId ?? null;

  let initialProfile: PlayerStatsProfile | null = null;
  let initialMatches: PlayerMatchSummary[] | null = null;
  let serverError: string | null = null;

  if (playerId) {
    try {
      [initialProfile, initialMatches] = await Promise.all([
        fetchPlayerProfileServer(playerId),
        fetchPlayerMatchesServer(playerId, 20),
      ]);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      serverError = status === 404
        ? "Player not found"
        : "Failed to load profile";
    }
  }

  return (
    <ProfileClient
      key={playerId ?? "own"}
      initialPlayerId={playerId}
      initialProfile={initialProfile}
      initialMatches={initialMatches}
      serverError={serverError}
    />
  );
}

export default function ProfilePage(props: ProfilePageProps) {
  return (
    <Suspense
      fallback={
        <main className="space-scope flex-1 px-4 py-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-xl border border-board-grid bg-surface-elevated p-6">
              <div className="text-sm text-text-muted">Loading profile...</div>
            </div>
          </div>
        </main>
      }
    >
      <ProfileContent {...props} />
    </Suspense>
  );
}
