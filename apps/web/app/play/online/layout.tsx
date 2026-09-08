import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: "Online Quick Play",
  description:
    "Jump into a casual online tic-tac-toe match instantly. Free multiplayer quick play against random opponents in Sliding or Expanding mode.",
  path: PUBLIC_ROUTES.playOnline,
  keywords: [...KEYWORD_CLUSTERS.primary, ...KEYWORD_CLUSTERS.platform],
});

export default function OnlinePlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
