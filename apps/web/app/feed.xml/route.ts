import { getSiteUrl, PUBLIC_ROUTES, SITE } from "@/lib/seo/config";
import { ANSWER_SNIPPETS } from "@/lib/seo/keywords";

/** RSS feed for crawlers, aggregators, and feed readers. */
export async function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toUTCString();

  const items = [
    {
      title: SITE.name,
      link: siteUrl,
      description: SITE.description,
      pubDate: now,
    },
    {
      title: "How to Play Infinite Tic-Tac-Toe",
      link: `${siteUrl}${PUBLIC_ROUTES.howToPlay}`,
      description: ANSWER_SNIPPETS.howToPlay,
      pubDate: now,
    },
    {
      title: "Global Leaderboard",
      link: `${siteUrl}${PUBLIC_ROUTES.leaderboard}`,
      description:
        "Top ranked Infinite Tic-Tac-Toe players by Elo rating. Updated live.",
      pubDate: now,
    },
    {
      title: "About Infinite Tic-Tac-Toe",
      link: `${siteUrl}${PUBLIC_ROUTES.about}`,
      description: ANSWER_SNIPPETS.whatIsIt,
      pubDate: now,
    },
  ];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items
      .map(
        (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${item.link}</guid>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
