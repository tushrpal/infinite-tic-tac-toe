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

/** Canonical production domain, used as a safety net if the env var is unset. */
const PRODUCTION_SITE_URL = "https://www.infinitettt.com";

/** Resolve canonical site URL from env with safe fallbacks. */
export function getSiteUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitUrl) {
    const withProtocol = explicitUrl.startsWith("http")
      ? explicitUrl
      : `https://${explicitUrl}`;
    return withProtocol.replace(/\/$/, "");
  }

  // NEXT_PUBLIC_SITE_URL should always be set in Vercel's Production env.
  // Never fall back to VERCEL_URL in production: it's a unique, per-deployment
  // URL (e.g. my-app-<hash>-<team>.vercel.app), not the custom domain, and
  // using it here is what leaks preview URLs into the sitemap/canonical tags.
  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  const previewUrl = process.env.VERCEL_URL?.trim();
  if (previewUrl) {
    return `https://${previewUrl}`.replace(/\/$/, "");
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
