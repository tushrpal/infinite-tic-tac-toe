import type { MetadataRoute } from "next";
import {
  getSiteUrl,
  CRAWLER_DISALLOW,
  AI_CRAWLER_DISALLOW,
  DISCOVERY_FILES,
} from "@/lib/seo/config";

/** Crawlers that index for a search results page — get the full disallow list. */
const SEARCH_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "FacebookBot",
] as const;

/** Crawlers that gather training/answer data — get the narrower list. */
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Google (AI surfaces)
  "Google-Extended",
  // Anthropic
  "anthropic-ai",
  "ClaudeBot",
  "Claude-Web",
  // Perplexity
  "PerplexityBot",
  // Meta
  "meta-externalagent",
  // Apple / Amazon / Cohere / Common Crawl
  "Amazonbot",
  "cohere-ai",
  "CCBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  const publicDisallow = [...CRAWLER_DISALLOW];
  const aiCrawlerDisallow = [...AI_CRAWLER_DISALLOW];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", ...DISCOVERY_FILES],
        disallow: publicDisallow,
      },
      ...SEARCH_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: publicDisallow,
      })),
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: aiCrawlerDisallow,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
