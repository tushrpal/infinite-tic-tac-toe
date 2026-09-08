import { getSiteUrl } from "@/lib/seo/config";

/**
 * Ping Bing/Yandex IndexNow after deploys or content updates.
 * Set INDEXNOW_KEY in env and host the key file at /{key}.txt
 *
 * Usage (CI): curl -X POST https://yoursite.com/api/indexnow \
 *   -H "Content-Type: application/json" \
 *   -d '{"urls":["https://yoursite.com/"]}'
 */
export async function POST(request: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return Response.json({ error: "INDEXNOW_KEY not configured" }, { status: 503 });
  }

  let body: { urls?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const urls = body.urls?.filter(Boolean);
  if (!urls?.length) {
    return Response.json({ error: "urls array required" }, { status: 400 });
  }

  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  const payload = {
    host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList: urls,
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];

  const results = await Promise.allSettled(
    endpoints.map((endpoint) =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  );

  const ok = results.some((r) => r.status === "fulfilled" && r.value.ok);

  return Response.json(
    { ok, submitted: urls.length },
    { status: ok ? 200 : 502 }
  );
}
