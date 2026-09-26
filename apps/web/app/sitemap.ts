import type { MetadataRoute } from "next";
import { getSiteUrl, PUBLIC_ROUTES } from "@/lib/seo/config";

type SitemapEntry = {
  path: string;
  /**
   * The date this route's *content* last meaningfully changed — not the build
   * date. `new Date()` here would stamp every URL with the same instant on
   * every deploy, which tells crawlers nothing and teaches them to ignore
   * `lastmod` for the whole property.
   *
   * Bump the relevant entry when you change a page's copy. Routes whose
   * content is genuinely data-driven use `dynamicLastModified` instead.
   */
  lastModified?: string;
  /** For routes backed by live data, where "now" is an honest answer. */
  dynamicLastModified?: boolean;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/**
 * Only indexable HTML documents belong here. Discovery files (`/llms.txt`,
 * `/feed.xml`, `/humans.txt`) are advertised via robots.txt and <link>
 * relations — listing them as sitemap URLs misrepresents them as pages.
 */
const ENTRIES: SitemapEntry[] = [
  {
    path: PUBLIC_ROUTES.home,
    lastModified: "2026-09-19",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: PUBLIC_ROUTES.play,
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: PUBLIC_ROUTES.playOnline,
    lastModified: "2026-09-20",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: PUBLIC_ROUTES.playRanked,
    lastModified: "2026-09-20",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: PUBLIC_ROUTES.playPractice,
    lastModified: "2026-09-08",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: PUBLIC_ROUTES.playLocal,
    lastModified: "2026-09-08",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: PUBLIC_ROUTES.playRooms,
    lastModified: "2026-09-08",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    // Genuinely changes every few minutes as ratings move.
    path: PUBLIC_ROUTES.leaderboard,
    dynamicLastModified: true,
    changeFrequency: "hourly",
    priority: 0.9,
  },
  {
    path: PUBLIC_ROUTES.howToPlay,
    lastModified: "2026-09-20",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: PUBLIC_ROUTES.about,
    lastModified: "2026-09-08",
    changeFrequency: "yearly",
    priority: 0.6,
  },
  {
    path: PUBLIC_ROUTES.privacy,
    lastModified: "2026-09-08",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: PUBLIC_ROUTES.terms,
    lastModified: "2026-09-08",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return ENTRIES.map(
    ({ path, lastModified, dynamicLastModified, changeFrequency, priority }) => ({
      url: `${siteUrl}${path}`,
      lastModified: dynamicLastModified
        ? now
        : new Date(`${lastModified}T00:00:00.000Z`),
      changeFrequency,
      priority,
    })
  );
}
