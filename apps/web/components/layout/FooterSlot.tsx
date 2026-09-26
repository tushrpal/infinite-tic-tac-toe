"use client";

import { usePathname } from "next/navigation";
import { IMMERSIVE_ROUTES } from "@/lib/seo/config";

/**
 * Renders the sitewide footer everywhere except full-screen game surfaces
 * (live matches, replays, spectating, room lobbies, invite landings).
 *
 * The footer arrives as `children` rather than being imported here on purpose:
 * importing it would pull it across the client boundary and ship every link as
 * JS. Passed in from the server layout, `Footer` stays a server component and
 * only this pathname check is client-side.
 */
export function FooterSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isImmersive = IMMERSIVE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isImmersive) return null;

  return <>{children}</>;
}
