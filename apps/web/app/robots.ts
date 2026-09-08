import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  const publicDisallow = [
    "/profile",
    "/match/",
    "/replay/",
    "/watch/",
    "/join/",
    "/rooms/",
    "/api/",
  ];

  const aiCrawlerDisallow = ["/profile", "/match/", "/replay/", "/api/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/feed.xml", "/humans.txt"],
        disallow: publicDisallow,
      },
      // OpenAI
      { userAgent: "GPTBot", allow: "/", disallow: aiCrawlerDisallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow: aiCrawlerDisallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: aiCrawlerDisallow },
      // Google
      { userAgent: "Googlebot", allow: "/", disallow: publicDisallow },
      { userAgent: "Google-Extended", allow: "/", disallow: aiCrawlerDisallow },
      // Anthropic
      { userAgent: "anthropic-ai", allow: "/", disallow: aiCrawlerDisallow },
      { userAgent: "ClaudeBot", allow: "/", disallow: aiCrawlerDisallow },
      { userAgent: "Claude-Web", allow: "/", disallow: aiCrawlerDisallow },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "/", disallow: aiCrawlerDisallow },
      // Meta
      { userAgent: "FacebookBot", allow: "/", disallow: publicDisallow },
      { userAgent: "meta-externalagent", allow: "/", disallow: aiCrawlerDisallow },
      // Apple / Amazon / Cohere / Common Crawl
      { userAgent: "Applebot", allow: "/", disallow: publicDisallow },
      { userAgent: "Amazonbot", allow: "/", disallow: aiCrawlerDisallow },
      { userAgent: "cohere-ai", allow: "/", disallow: aiCrawlerDisallow },
      { userAgent: "CCBot", allow: "/", disallow: aiCrawlerDisallow },
      // Bing / DuckDuckGo
      { userAgent: "Bingbot", allow: "/", disallow: publicDisallow },
      { userAgent: "DuckDuckBot", allow: "/", disallow: publicDisallow },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
