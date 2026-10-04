import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { PLAY_MODE_CONTENT } from "@/lib/seo/playModeContent";
import { PlayModeContent } from "@/components/play/PlayModeContent";

export const metadata = buildPageMetadata({
  title: "2 Players, One Device",
  description:
    "Play tic-tac-toe with a friend on the same device. Classic, Sliding, and Expanding modes — no internet required.",
  path: PUBLIC_ROUTES.playLocal,
  keywords: ["one device tic tac toe", "2 player tic tac toe same device", ...KEYWORD_CLUSTERS.primary],
});

export default function LocalPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PlayModeContent
        content={PLAY_MODE_CONTENT.local}
        path={PUBLIC_ROUTES.playLocal}
        title="Two-Player Tic-Tac-Toe on One Device"
        breadcrumbLabel="2 Players, One Device"
      />
    </>
  );
}
