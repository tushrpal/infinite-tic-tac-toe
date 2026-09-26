import { Suspense } from "react";
import { LeaderboardClient } from "./LeaderboardClient";
import {
  fetchLeaderboardPage,
  parseLeaderboardMode,
  type LeaderboardPlayer,
} from "@/lib/server/leaderboard";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS, ANSWER_SNIPPETS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { JsonLd } from "@/components/seo/JsonLd";
import { leaderboardSchema, breadcrumbSchema } from "@/lib/seo/json-ld";
import { RANKS } from "@/lib/constants";
import { RankingExplainer } from "./RankingExplainer";

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
    <>
      {/*
        The standings are the one dataset here that no competitor can
        replicate, so they're marked up as an ItemList. Only emitted when the
        SSR fetch succeeded — an empty ItemList is a worse signal than none.
      */}
      {initialPlayers.length > 0 && (
        <JsonLd data={leaderboardSchema(initialPlayers)} />
      )}
      <LeaderboardClient
        key={mode}
        initialMode={mode}
        initialPlayers={initialPlayers}
        initialHasMore={initialHasMore}
      />
      {/*
        Inside the Suspense boundary, not after it.
        This section was previously rendered as a sibling of <Suspense> so that
        it would be in the first HTML flush. That backfired: when the standings
        resolved they were inserted *above* it and pushed it down 1487px,
        measuring CLS 0.751 on a page that is otherwise perfectly stable.
        Streaming SSR still server-renders this — just in the same chunk as the
        standings — so the content is equally crawlable with no shift.
      */}
      <RankingExplainer
        tiers={RANKS.TIERS}
        defaultRating={RANKS.DEFAULT_RATING}
        summary={ANSWER_SNIPPETS.rankedSystem}
      />
    </>
  );
}

export default function LeaderboardPage(props: LeaderboardPageProps) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: PUBLIC_ROUTES.home },
          { name: "Leaderboard", path: PUBLIC_ROUTES.leaderboard },
        ])}
      />
      {/*
        The fallback reserves roughly a viewport of height. Without it, the
        swap from a one-line "Loading..." to the full standings jerks the
        footer down the page — the same class of shift that made this route's
        CLS 0.751 before the explainer moved inside the boundary.
      */}
      <Suspense
        fallback={
          <main className="space-scope min-h-screen flex-1 px-4 py-8">
            <div className="w-full max-w-3xl mx-auto">
              <div className="py-6 text-center text-text-secondary">Loading leaderboard...</div>
            </div>
          </main>
        }
      >
        <LeaderboardContent {...props} />
      </Suspense>
    </>
  );
}
