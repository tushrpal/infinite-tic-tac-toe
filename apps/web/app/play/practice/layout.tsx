import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { PLAY_MODE_CONTENT } from "@/lib/seo/playModeContent";
import { PlayModeContent } from "@/components/play/PlayModeContent";

export const metadata = buildPageMetadata({
  title: "Practice vs AI Bots",
  description:
    "Practice Infinite Tic-Tac-Toe against AI bots. Choose Easy, Medium, or Hard difficulty. Unranked matches perfect for learning strategy.",
  path: PUBLIC_ROUTES.playPractice,
  keywords: KEYWORD_CLUSTERS.practice,
});

export default function PracticePlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PlayModeContent
        content={PLAY_MODE_CONTENT.practice}
        path={PUBLIC_ROUTES.playPractice}
        title="Practising Tic-Tac-Toe Against AI Bots"
        breadcrumbLabel="Practice vs AI"
      />
    </>
  );
}
