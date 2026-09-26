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

      {/*
        Rendered outside Suspense so the explanatory content is in the initial
        HTML regardless of whether the standings fetch resolves. This section
        is what turns /leaderboard from an h1-plus-a-table into a page that can
        answer "how does tic-tac-toe ranking work" — the page previously had
        zero h2s and no prose at all.
      */}
      <RankingExplainer
        tiers={RANKS.TIERS}
        defaultRating={RANKS.DEFAULT_RATING}
        summary={ANSWER_SNIPPETS.rankedSystem}
      />
    </>
  );
}
