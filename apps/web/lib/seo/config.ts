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
  // Verified 2026-09-26. The previous value here was "@InfiniteTTT", which
  // 404s — the site was publishing twitter:site/twitter:creator for an account
  // that does not exist.
  twitterHandle: "@infinite_ttt",
  category: "Games",
  applicationCategory: "GameApplication",
  operatingSystem: "Web Browser",
  price: "0",
  priceCurrency: "USD",
} as const;

/**
 * Third-party profiles for `Organization.sameAs`.
 *
 * This is the main mechanism by which search and generative engines decide
 * that two mentions of "Infinite Tic-Tac-Toe" refer to the same entity — which
 * matters here because "infinite tic-tac-toe" already commonly refers to the
 * unbounded-grid variant, a different game.
 *
 * Two hard rules for anything added here:
 *   1. It must be publicly reachable. A private repo or a handle that 404s is
 *      an unverifiable claim, and an unverifiable sameAs is worse for entity
 *      resolution than an empty list.
 *   2. It must link back to this site. Corroboration only counts when it goes
 *      both ways.
 *
 * Verified reachable 2026-09-26 (both return 200). Re-check before adding
 * anything else — an earlier revision of this list was empty precisely because
 * the repo was private and the X handle was wrong.
 */
export const SOCIAL_PROFILES: readonly string[] = [
  "https://github.com/tushrpal/infinite-tic-tac-toe",
  "https://x.com/infinite_ttt",
];

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

/**
 * What every crawler is kept out of: the noindex routes plus the API surface.
 * `app/robots.ts` builds its rules from this so the disallow list can't drift
 * away from NOINDEX_ROUTES / the per-page `noIndex` metadata.
 */
export const CRAWLER_DISALLOW: readonly string[] = [...NOINDEX_ROUTES, "/api/"];

/**
 * Additionally allowed for AI/LLM crawlers. `/watch/`, `/join/` and `/rooms/`
 * are ephemeral rather than private — a stale room code in a model's training
 * set is harmless, whereas keeping them crawlable lets an engine resolve a
 * shared invite link. They stay out of the index via per-page `noIndex`.
 */
export const AI_CRAWLER_DISALLOW: readonly string[] = [
  "/profile",
  "/match/",
  "/replay/",
  "/api/",
];

/**
 * Full-screen game surfaces. These get no sitewide footer — a live match or a
 * room lobby is an immersive screen, and they're all `noIndex` anyway, so the
 * footer's internal-linking job doesn't apply to them.
 */
export const IMMERSIVE_ROUTES = [
  "/match/",
  "/watch/",
  "/replay/",
  "/rooms/",
  "/join/",
] as const;

/**
 * Discovery files that are not indexable HTML documents. They belong in
 * robots.txt and in <link> relations, never in sitemap.xml.
 */
export const DISCOVERY_FILES = [
  "/llms.txt",
  "/feed.xml",
  "/humans.txt",
] as const;
