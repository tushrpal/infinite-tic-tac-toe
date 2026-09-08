import type { MetadataRoute } from "next";
import { getSiteUrl, PUBLIC_ROUTES } from "@/lib/seo/config";

type SitemapEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const ENTRIES: SitemapEntry[] = [
  { path: PUBLIC_ROUTES.home, changeFrequency: "daily", priority: 1.0 },
  { path: PUBLIC_ROUTES.play, changeFrequency: "weekly", priority: 0.9 },
  { path: PUBLIC_ROUTES.playOnline, changeFrequency: "weekly", priority: 0.85 },
  { path: PUBLIC_ROUTES.playRanked, changeFrequency: "weekly", priority: 0.85 },
  { path: PUBLIC_ROUTES.playPractice, changeFrequency: "weekly", priority: 0.8 },
  { path: PUBLIC_ROUTES.playLocal, changeFrequency: "monthly", priority: 0.7 },
  { path: PUBLIC_ROUTES.playRooms, changeFrequency: "weekly", priority: 0.75 },
  { path: PUBLIC_ROUTES.leaderboard, changeFrequency: "hourly", priority: 0.9 },
  { path: PUBLIC_ROUTES.howToPlay, changeFrequency: "monthly", priority: 0.85 },
  { path: PUBLIC_ROUTES.about, changeFrequency: "monthly", priority: 0.6 },
  { path: PUBLIC_ROUTES.privacy, changeFrequency: "yearly", priority: 0.3 },
  { path: PUBLIC_ROUTES.terms, changeFrequency: "yearly", priority: 0.3 },
  { path: "/llms.txt", changeFrequency: "monthly", priority: 0.5 },
  { path: "/feed.xml", changeFrequency: "daily", priority: 0.6 },
  { path: "/humans.txt", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return ENTRIES.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
