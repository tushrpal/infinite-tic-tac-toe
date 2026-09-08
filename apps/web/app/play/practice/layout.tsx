import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

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
  return children;
}
