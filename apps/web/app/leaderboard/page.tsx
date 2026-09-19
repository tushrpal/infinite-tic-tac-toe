import { Suspense } from "react";
import { LeaderboardClient } from "./LeaderboardClient";
import {
  fetchLeaderboardPage,
  parseLeaderboardMode,
  type LeaderboardPlayer,
} from "@/lib/server/leaderboard";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: "Leaderboard",
  description:
    "Global Infinite Tic-Tac-Toe leaderboard — top ranked players by Elo rating in Sliding and Expanding modes. Climb from Bronze to Grandmaster.",
  path: PUBLIC_ROUTES.leaderboard,
  keywords: KEYWORD_CLUSTERS.competitive,
});

type LeaderboardPageProps = {
  searchParams?: { mode?: string };
};

async function LeaderboardContent({ searchParams }: LeaderboardPageProps) {
  const mode = parseLeaderboardMode(searchParams?.mode);

  let initialPlayers: LeaderboardPlayer[] = [];
  let initialHasMore = false;

  try {
    const data = await fetchLeaderboardPage(mode);
    initialPlayers = data.players;
    initialHasMore = data.hasMore;
  } catch (error) {
    console.error("SSR leaderboard fetch failed:", error);
  }

  return (
    <LeaderboardClient
      key={mode}
      initialMode={mode}
      initialPlayers={initialPlayers}
      initialHasMore={initialHasMore}
    />
  );
}

export default function LeaderboardPage(props: LeaderboardPageProps) {
  return (
    <Suspense
      fallback={
        <main className="space-scope flex-1 px-4 py-8">
          <div className="w-full max-w-3xl mx-auto">
            <div className="py-6 text-center text-text-secondary">Loading leaderboard...</div>
          </div>
        </main>
      }
    >
      <LeaderboardContent {...props} />
    </Suspense>
  );
}
