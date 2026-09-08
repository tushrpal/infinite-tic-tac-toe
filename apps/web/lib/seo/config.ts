/**
 * Central site configuration for SEO, AEO, and GEO.
 */

export const SITE = {
  name: "Infinite Tic-Tac-Toe",
  shortName: "Infinite TTT",
  tagline: "Free online multiplayer tic-tac-toe with ranked play",
  description:
    "Play Infinite Tic-Tac-Toe online for free. Challenge players worldwide in Sliding and Expanding modes, climb the ranked leaderboard, practice against AI bots, and invite friends to private rooms — no download required.",
  locale: "en_US",
  language: "en",
  twitterHandle: "@InfiniteTTT",
  category: "Games",
  applicationCategory: "GameApplication",
  operatingSystem: "Web Browser",
  price: "0",
  priceCurrency: "USD",
} as const;

/** Resolve canonical site URL from env with safe localhost fallback. */
export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (envUrl) {
    const withProtocol = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
    return withProtocol.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

/** Public routes included in sitemap and llms.txt. */
export const PUBLIC_ROUTES = {
  home: "/",
  play: "/play",
  playOnline: "/play/online",
  playRanked: "/play/ranked",
  playPractice: "/play/practice",
  playLocal: "/play/local",
  playRooms: "/play/rooms",
  leaderboard: "/leaderboard",
  howToPlay: "/how-to-play",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/** Routes that should not be indexed (dynamic, auth-gated, or ephemeral). */
export const NOINDEX_ROUTES = [
  "/profile",
  "/match/",
  "/replay/",
  "/watch/",
  "/join/",
  "/rooms/",
] as const;
