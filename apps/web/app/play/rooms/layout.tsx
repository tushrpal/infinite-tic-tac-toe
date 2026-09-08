import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: "Play with Friends",
  description:
    "Create a private tic-tac-toe room and play multiple games with friends. Invite links, room codes, and Sliding or Expanding mode selection.",
  path: PUBLIC_ROUTES.playRooms,
  keywords: KEYWORD_CLUSTERS.social,
});

export default function RoomsPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
