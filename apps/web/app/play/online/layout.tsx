import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { PLAY_MODE_CONTENT } from "@/lib/seo/playModeContent";
import { PlayModeContent } from "@/components/play/PlayModeContent";

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
  return (
    <>
      {children}
      <PlayModeContent
        content={PLAY_MODE_CONTENT.online}
        path={PUBLIC_ROUTES.playOnline}
        title="Free Online Tic-Tac-Toe Quick Play"
        breadcrumbLabel="Online Quick Play"
      />
    </>
  );
}
