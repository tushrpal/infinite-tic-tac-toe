import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { PLAY_MODE_CONTENT } from "@/lib/seo/playModeContent";
import { PlayModeContent } from "@/components/play/PlayModeContent";

export const metadata = buildPageMetadata({
  title: "Ranked Match",
  description:
    "Compete in ranked Infinite Tic-Tac-Toe matches. Elo-based matchmaking, rating tiers from Bronze to Grandmaster, and global leaderboard placement.",
  path: PUBLIC_ROUTES.playRanked,
  keywords: KEYWORD_CLUSTERS.competitive,
});

export default function RankedPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PlayModeContent
        content={PLAY_MODE_CONTENT.ranked}
        path={PUBLIC_ROUTES.playRanked}
        title="Ranked Infinite Tic-Tac-Toe: How the Ladder Works"
        breadcrumbLabel="Ranked Match"
      />
    </>
  );
}
