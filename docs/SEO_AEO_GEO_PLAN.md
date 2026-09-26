# SEO / AEO / GEO Plan — Infinite Tic-Tac-Toe

**Status:** Phases 1, 2 and 4 complete. Phase 3 (content layer) is next — see §7
**Audit date:** 2026-09-26
**Last updated:** 2026-09-26
**Audited against:** `main` @ 8d36ef7, plus live production at `https://www.infinitettt.com`
**Scope:** `apps/web` only (the backend has no indexable surface)

---

## 0. TL;DR

The technical SEO foundation here is genuinely above average — a centralized `lib/seo`
module, correct canonicals with preview-URL leak protection, five schema types,
per-AI-crawler `robots.txt`, `llms.txt`, an RSS feed, an IndexNow endpoint and
dynamic OG images. Very few side projects ship this much.

What is missing is not plumbing. It is **three things**:

1. **There is almost nothing to rank.** Twelve indexable URLs, of which five are
   interactive shells with one `<h1>` and no body copy. The `learning` and `modes`
   keyword clusters in `lib/seo/keywords.ts` have no dedicated pages pointing at them.
2. **Nothing is measured.** No Search Console property, no Bing Webmaster, no
   web-vitals reporting. There is currently no way to tell whether any of the
   existing work is producing impressions.
3. **The entity is unresolvable.** `organizationSchema().sameAs` is an empty array.
   For generative engines, `sameAs` is the main mechanism for deciding that two
   mentions of "Infinite Tic-Tac-Toe" are the same thing.

Phases 1 and 2 below fix those. Phases 3–5 are compounding work.

---

## 1. What already works — do not regress this

Verified live, not just in source:

| Area | Evidence |
| --- | --- |
| Canonical URLs | `<link rel="canonical" href="https://www.infinitettt.com">`, and UTM params are correctly stripped (`/?utm_source=x` → clean canonical) |
| Preview-URL safety | `getSiteUrl()` in [config.ts](../apps/web/lib/seo/config.ts#L27) explicitly refuses to fall back to `VERCEL_URL` in production — this is the exact bug that leaks `*.vercel.app` into sitemaps, and it is already handled |
| Structured data | Live homepage emits `Organization`, `WebSite`, `WebApplication`+`VideoGame`, `FAQPage` (4 Q&A); `/how-to-play` adds `HowTo` + `BreadcrumbList` |
| AI crawler policy | `robots.txt` names GPTBot, OAI-SearchBot, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Google-Extended, meta-externalagent, Applebot, Amazonbot, cohere-ai, CCBot — all `Allow: /` with private routes excluded |
| AEO surfaces | `/llms.txt` (200), `/feed.xml` (200), both with entity definition + Q&A blocks |
| OG images | `/opengraph-image` returns `image/png`, `max-age=31536000 immutable`; `/join/[code]` has its own per-code image |
| Domain hygiene | apex → `www` 308, HSTS `max-age=63072000`, `/play/` → 308, `poweredByHeader: false` |
| 404 correctness | Returns HTTP 404 **and** `<meta name="robots" content="noindex">` |
| Private-route exclusion | `/profile`, `/match/`, `/replay/`, `/watch/`, `/join/`, `/rooms/` disallowed and `noIndex` |
| Leaderboard SSR | `/leaderboard` server-renders 50 real players with `revalidate: 30` — the data is in the HTML, not client-fetched |
| 3D hero cost control | `HomeScene` is `dynamic(..., { ssr: false })` and gated behind `saveData` / `deviceMemory` / `hardwareConcurrency` / WebGL probes |

**Regression guard:** any change to `lib/seo/*`, `app/robots.ts` or `app/sitemap.ts`
should be checked against this table before merge.

---

## 2. Findings

Severity is by expected traffic impact, not by effort.

### P0 — blocking growth

#### P0-1. No content layer. Twelve URLs is the whole site.

`PUBLIC_ROUTES` has 12 entries. Of those, 4 carry real prose (`/`, `/about`,
`/how-to-play`, `/play`) and 2 are legal boilerplate.

Meanwhile `lib/seo/keywords.ts` defines 8 keyword clusters, ~45 terms. The
`learning` cluster (`how to win tic tac toe`, `tic tac toe strategy`,
`sliding tic tac toe rules`) and the `modes` cluster (`sliding tic tac toe`,
`expanding board tic tac toe`, `tic tac toe no draw`) are the highest-intent
informational terms the project has, and **no page exists whose job is to rank
for them.** They are currently sprayed into the `keywords` meta tag — which
Google has ignored since 2009 — instead of being addressed by content.

This is also the binding constraint on GEO. An answer engine cites a URL that
answers a question. Right now there are two candidate URLs sitewide.

#### P0-2. Five indexed play routes are thin content.

Measured on live HTML:

| Route | Sitemap priority | `<h1>` | `<h2>` | `<h3>` |
| --- | --- | --- | --- | --- |
| `/play/ranked` | 0.85 | 1 | 0 | 0 |
| `/leaderboard` | 0.90 | 1 | 0 | 0 |
| `/play` | 0.90 | 1 | 5 | 5 |
| `/how-to-play` | 0.85 | 1 | 5 | 17 |

`/play/online`, `/play/practice`, `/play/local`, `/play/rooms` follow the
`/play/ranked` shape: an `<h1>`, a one-line subtitle, and an interactive widget.
They are submitted at priority 0.70–0.85 and near-duplicate each other.

Two consequences: Google's thin/near-duplicate handling can drop them or treat
them as soft 404s, and low-value indexed pages drag the sitewide quality
assessment — which matters more than usual here because **AdSense is live**
(`public/ads.txt`, `ca-pub-7401169722110446`), and "thin content / low value
add" is one of the most common AdSense disapproval reasons.

#### P0-3. Homepage `<h1>` is brand-only *and* ships hidden.

Live HTML from `/`:

```html
<h1 class="font-display ..." style="opacity:0;transform:translateY(16px)">
  <span>Infinite</span><br/><span>Tic-Tac-Toe</span>
</h1>
```

Two separate problems in one element ([HomeOverlay.tsx:60](../apps/web/components/home/HomeOverlay.tsx#L60)):

- **No intent keyword.** The strongest on-page signal on the most important URL
  says only the brand name. The `<title>` does the work ("Play Online Free");
  the `<h1>` does not back it up.
- **`opacity:0` in the server response.** framer-motion's `initial` prop is
  serialized into SSR HTML. Google renders JS so it resolves, but this is
  textbook hidden-text shape, and any crawler that does not execute JS sees a
  zero-opacity headline.

#### P0-4. Zero measurement.

- No `google-site-verification` meta tag, no `msvalidate.01` (checked live —
  absent). `metadata.verification` is never set in `buildRootMetadata()`.
- GA4 is wired (`G-SEV1SDLYRN`) but there is **no** `useReportWebVitals`, no
  `web-vitals` import anywhere in `app/`, `components/`, `lib/` or `hooks/`.
- `app/api/indexnow/route.ts` exists and is correct, but `INDEXNOW_KEY` has to
  be set and the route has to actually be called by something. Nothing calls it.

Until Search Console exists, every other item in this document is unfalsifiable.

#### P0-5. Empty entity graph.

[json-ld.ts:30](../apps/web/lib/seo/json-ld.ts#L30) — `sameAs: []`.

`SITE.twitterHandle` is `@InfiniteTTT` and is emitted as `twitter:site` /
`twitter:creator`. If that account does not exist or is not linked back, the
claim is unverifiable and the entity stays ambiguous — which is precisely the
condition under which a generative engine declines to cite, or conflates the
game with generic "infinite tic tac toe" variants (there are several, including
the well-known unbounded-grid version, which is **not** what this game is).

### P1 — high value, low-to-moderate effort

#### P1-1. The leaderboard's unique data is not marked up.

`/leaderboard` is the most citable asset the project owns: live, first-party,
not replicable by a competitor. It SSRs 50 ranked players and emits **no**
`ItemList`, no `Dataset`, no `<h2>`/`<h3>` structure, and no prose explaining
the rating system on the page itself.

#### P1-2. Sitemap signal quality.

[app/sitemap.ts](../apps/web/app/sitemap.ts) sets `lastModified: new Date()` for
every entry, evaluated at build. Live sitemap confirms: all 15 URLs share
`2026-09-24T07:36:31.854Z`. A sitemap where everything changed at the same
instant on every deploy carries no information, and Google learns to ignore
`lastmod` for the property.

Also: `/llms.txt`, `/feed.xml` and `/humans.txt` are listed as sitemap URLs.
Sitemaps are for indexable HTML documents. These three are discovery files and
belong in `robots.txt` (where they already are) and in `<link>` relations — not
in the sitemap.

#### P1-3. No custom 404.

No `app/not-found.tsx`, `app/error.tsx` or `app/global-error.tsx`. Live 404 is
the Next.js default: *"404: This page could not be found."* — no navigation, no
internal links, no recovery path. Every broken inbound link and every stale
`/join/{code}` share dead-ends there.

#### P1-4. Internal linking is nearly absent.

There is no sitewide `<footer>`. `app/page.tsx` has one (About / Privacy /
Terms); `app/about/page.tsx` has a CTA block. Every other page ends with
nothing. `Navigation` exposes 4 links (Play, Leaderboard, How to Play, Profile).

Result: `/how-to-play` — the site's one real content page — is reachable from
the nav and nowhere else. The play-mode pages do not link to the rules. There is
no hub-and-spoke structure for link equity to flow through.

#### P1-5. Homepage performance is unmeasured and structurally risky.

- 16 initial JS chunks, **~248 KB gzipped** transferred on `/`.
- Hero is `h-[200svh] lg:h-[240svh]`, scroll-scrubbed, driving a Three.js scene.
- Two `fetchPriority="high"` image preloads compete for LCP: `homeBg.jpg`
  (199 KB source) and `board.png` (**458 KB** source).
- `public/favicon.svg` is **280 KB**; `web-app-manifest-512x512.png` is **384 KB**.
- `public/assets/` is 2.9 MB of PNG/JPG, several files 180–460 KB.

The lazy-loading and device gating are already right. What is missing is a
number: no CWV field data exists, so INP on the scroll-scrubbed hero on mid-tier
mobile is unknown.

#### P1-6. AdSense injected as a raw `<head>` script.

[app/layout.tsx:62](../apps/web/app/layout.tsx#L62) uses a bare
`<script async src="...adsbygoogle.js">` inside `<head>` rather than
`next/script`, so Next cannot sequence it. It resolves before hydration and
competes with the font preloads and LCP images.

#### P1-7. Stale HTML through Cloudflare.

Live `/` returned `Age: 185104` (~51 hours) with `x-vercel-cache: HIT` and
`cf-cache-status: DYNAMIC`, behind `Server: cloudflare`. Worth confirming that
`sitemap.xml`, `robots.txt` and `/leaderboard` are not served stale after a
deploy — a sitemap cached for two days defeats IndexNow entirely.

### P2 — worth doing, not urgent

- **P2-1.** `NOINDEX_ROUTES` is exported from `lib/seo/config.ts` and **never
  imported**; `app/robots.ts` redeclares the same list inline as `publicDisallow`.
  Two sources of truth that will drift.
- **P2-2.** `buildPageMetadata` defaults `keywords` to all ~45 terms on every
  page. Ignored by Google; it is a mild "over-optimized" tell. Either scope it
  per page or drop it.
- **P2-3.** No `hreflang`, no i18n. "tic tac toe" has very large non-English
  volume (es / pt-BR / de / hi / id). Zero of it is addressable today.
- **P2-4.** `VideoGame` schema has no `aggregateRating`. This is a legitimate
  rich-result win **but requires real collected ratings** — do not fabricate it;
  fabricated ratings are a manual-action risk.
- **P2-5.** No dynamic OG for `/leaderboard` (e.g. "Top: {player} — {rating}"),
  which is exactly the kind of image that earns shares.
- **P2-6.** `robots.ts` emits a `Host:` directive — read only by Yandex. Harmless.
- **P2-7.** `sitemap.xml` has no `<image:image>` entries.

---

## 3. The plan

Five phases. Phase 1 and 2 are prerequisites for judging anything else.

### Phase 1 — Instrumentation (do this first, ~half a day)

Nothing else is worth doing until there is feedback.

| # | Task | File(s) |
| --- | --- | --- |
| 1.1 | Create Google Search Console property for `https://www.infinitettt.com` (DNS TXT via Cloudflare — survives redeploys). Submit `sitemap.xml`. | — |
| 1.2 | Create Bing Webmaster Tools property (imports from GSC). Generate an IndexNow key. | — |
| 1.3 | Add `verification: { google, other: { 'msvalidate.01': ... } }` to `buildRootMetadata()` as a belt-and-braces second signal. | `lib/seo/metadata.ts` |
| 1.4 | Set `INDEXNOW_KEY` in Vercel production env; host `public/{key}.txt`. | Vercel env, `public/` |
| 1.5 | Call `/api/indexnow` from a post-deploy step with the 10 canonical URLs. | CI or Vercel deploy hook |
| 1.6 | Add `useReportWebVitals` → GA4 events (LCP, INP, CLS, TTFB) in a small client component mounted in the root layout. | new `components/analytics/WebVitals.tsx`, `app/layout.tsx` |
| 1.7 | Record a baseline: PageSpeed Insights (mobile) for `/`, `/play`, `/leaderboard`, `/how-to-play`. Commit the numbers into this file under §5. | this doc |

**Acceptance:** GSC shows the sitemap as *Success* with 12 discovered URLs; GA4
shows `web-vitals` events within 24 h; a manual `POST /api/indexnow` returns
`{ ok: true }`.

### Phase 2 — Fix what is already indexed (~2 days)

Do not add pages until the existing ones are worth ranking.

| # | Task | Why | File(s) |
| --- | --- | --- | --- |
| 2.1 | Rewrite the homepage `<h1>` to carry intent — e.g. `Infinite Tic-Tac-Toe — Free Online Multiplayer`, with the brand visually dominant and the qualifier in a smaller `<span>` inside the same `<h1>`. The design stays; the string changes. | Fixes the signal without touching the art direction | `components/home/HomeOverlay.tsx` |
| 2.2 | Remove `opacity:0` from the SSR'd `<h1>`. Animate a wrapper `<div>`, or gate `initial` on a mounted flag so the server emits the heading at full opacity. | Removes the hidden-text shape | `components/home/HomeOverlay.tsx` |
| 2.3 | Give each `/play/*` route 150–250 words of genuinely mode-specific copy plus 2–3 `<h2>`s — rules, when to pick this mode, what rating range to expect. Not filler: each page must answer a different question. | Kills P0-2 | `app/play/{online,ranked,practice,local,rooms}/page.tsx` |
| 2.4 | If 2.3 cannot be done well for a given route, `noIndex` it and drop it from the sitemap instead. Five thin pages are worse than two good ones. | Explicit decision per route | `lib/seo/config.ts`, `app/sitemap.ts` |
| 2.5 | Add `ItemList` JSON-LD to `/leaderboard` (top 20 as `ListItem` → `Person`/`name` + `position`), plus an on-page `<h2>` section explaining the Elo system, tiers and reset cadence. | Unlocks P1-1 | `lib/seo/json-ld.ts`, `app/leaderboard/page.tsx` |
| 2.6 | Add `app/not-found.tsx`: branded, with links to `/`, `/play`, `/how-to-play`, `/leaderboard`. | P1-3 | new `app/not-found.tsx` |
| 2.7 | Extract the homepage footer into `components/layout/Footer.tsx` and mount it in the root layout. Include About, How to Play, Leaderboard, all five play modes, Privacy, Terms. | P1-4, and the cheapest internal-linking win available | new `components/layout/Footer.tsx`, `app/layout.tsx`, `app/page.tsx` |
| 2.8 | Populate `sameAs` in `organizationSchema()` with every profile that actually exists and links back (X, GitHub repo, itch.io / Reddit if applicable). Verify `@InfiniteTTT` exists and has the site in its bio — if it does not, either create it or remove `twitterHandle` rather than claiming it. | P0-5 | `lib/seo/json-ld.ts`, `lib/seo/config.ts` |
| 2.9 | Give `app/sitemap.ts` real per-route `lastModified` dates (a static map updated when a route's content changes, or git mtime at build). Remove `/llms.txt`, `/feed.xml`, `/humans.txt` from the sitemap. | P1-2 | `app/sitemap.ts` |
| 2.10 | Make `app/robots.ts` import `NOINDEX_ROUTES` from `lib/seo/config.ts` instead of redeclaring it. | P2-1 | `app/robots.ts` |

**Acceptance:** every indexed URL has ≥1 `<h1>` and ≥2 `<h2>`; live `/` HTML has
no `opacity:0` on the `<h1>`; `/leaderboard` validates as `ItemList` in Google's
Rich Results Test; sitemap URLs all return 200 HTML with distinct `lastmod`.

### Phase 3 — Content layer (the actual growth lever, ongoing)

This is where traffic comes from. Target the `learning` and `modes` clusters
with pages that exist to answer one question each.

Proposed structure — a `/guides/` hub, not a blog (no dates to go stale, no
pagination, evergreen):

| URL | Primary query | Schema |
| --- | --- | --- |
| `/guides` | hub | `CollectionPage` + `BreadcrumbList` |
| `/guides/tic-tac-toe-rules` | "tic tac toe rules" | `HowTo` + `FAQPage` |
| `/guides/how-to-win-tic-tac-toe` | "how to win tic tac toe" (high volume) | `HowTo` + `FAQPage` |
| `/guides/tic-tac-toe-strategy` | "tic tac toe strategy" | `Article` + `FAQPage` |
| `/guides/sliding-tic-tac-toe-rules` | "sliding tic tac toe" (owned term) | `HowTo` |
| `/guides/expanding-tic-tac-toe-rules` | "expanding board tic tac toe" (owned term) | `HowTo` |
| `/guides/tic-tac-toe-variants` | "tic tac toe variants" | `Article` + `ItemList` |
| `/guides/why-tic-tac-toe-ends-in-draws` | "tic tac toe always draw" | `Article` + `FAQPage` |
| `/guides/elo-rating-explained` | "elo rating system" ∩ brand | `Article` |

Rules for each guide page — non-negotiable if this is to work for GEO as well as SEO:

- **Answer in the first 60 words.** Generative engines extract the lead. Lead
  with the direct answer, then expand. This is the single highest-leverage AEO
  behaviour.
- **One `<h2>` per sub-question**, phrased as the question a person would type.
- **A `FAQPage` block** of 3–5 Q&A, with answers that stand alone out of context.
- **Interactive proof.** Reuse `components/how-to-play/MiniBoard.tsx` to show,
  not tell. This is the defensible differentiator over the thousands of
  text-only tic-tac-toe articles — and it creates dwell time.
- **Link down to the matching play mode** and up to `/guides`.
- **900–1,500 words.** Below ~600 it competes with nothing; above ~2,000 on this
  topic it is padding.

Sequencing: ship `/guides/sliding-tic-tac-toe-rules` and
`/guides/expanding-tic-tac-toe-rules` **first**. Those terms are owned — nobody
else can write authoritatively about this game's modes — so they rank fastest
and validate the template before spending effort on competitive head terms.

Supporting work:

- Extend `PUBLIC_ROUTES` and `sitemap.ts` per page.
- Extend `public/llms.txt` with a `## Guides` section listing each URL and its
  one-line answer. This file is how an LLM crawler builds a map of the site.
- Add each guide to `/feed.xml` with a real `pubDate` — the feed currently
  stamps everything `now`, which makes it useless as a change signal.
- Add `articleSchema()` and `collectionPageSchema()` helpers to `lib/seo/json-ld.ts`.

### Phase 4 — Performance (~1–2 days, after Phase 1 gives numbers)

Order these by what the Phase 1 baseline actually shows. Likely order:

| # | Task |
| --- | --- |
| 4.1 | Regenerate oversized static assets: `favicon.svg` 280 KB → <10 KB (it is almost certainly an un-simplified export), `web-app-manifest-512x512.png` 384 KB → <40 KB. Run the whole of `public/assets/` through a compressor; `board.png` at 458 KB is the LCP candidate on `/`. |
| 4.2 | Drop to **one** `fetchPriority="high"` preload on `/`. Two competing high-priority images means neither wins; pick whichever is actually the LCP element. |
| 4.3 | Move the AdSense tag to `next/script` with `strategy="afterInteractive"` (or `lazyOnload`) so it cannot contend with LCP. |
| 4.4 | Measure INP on the scroll-scrubbed hero on a real mid-tier Android. If it is poor, the `useScrollProgress` → Three.js path is the suspect; consider making `HomeStaticScene` the default below a width/perf threshold rather than only on the existing device-hint failures. |
| 4.5 | Audit the 248 KB initial JS. `framer-motion` is imported by `HomeOverlay`, which is above the fold; check whether `@react-three/*` barrel imports are leaking into the initial chunk despite the `dynamic()` boundary. |
| 4.6 | Verify Cloudflare is not caching `sitemap.xml` / `robots.txt` / `/leaderboard` beyond their intent (see P1-7). Add explicit `Cache-Control` for those routes. |
| 4.7 | Extend `next.config.js` `headers()` with `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy`. |

### Phase 5 — Compounding / optional

| # | Task | Note |
| --- | --- | --- |
| 5.1 | Dynamic OG image for `/leaderboard` showing the current #1 | High share-rate, low effort |
| 5.2 | Public, indexable player pages for **top-100 only**, opt-in, at `/player/{username}` | Real programmatic-SEO surface. Keep the existing `/profile` noindex. Opt-in is a privacy requirement, not a nicety |
| 5.3 | `aggregateRating` on `VideoGame` schema | **Only** once real ratings are collected. Never synthesize |
| 5.4 | i18n + `hreflang` for es / pt-BR / de / hi | Large effort, but the term has huge non-English volume |
| 5.5 | `Speakable` schema on guide pages | Cheap AEO signal for voice surfaces |
| 5.6 | `<image:image>` in sitemap | Minor |
| 5.7 | Scope `keywords` per page or remove entirely | Cosmetic; no ranking effect either way |

---

## 4. AEO and GEO specifics

Worth stating separately, because the tactics diverge from classical SEO.

**AEO (answer engines / featured snippets / voice)** — the aim is to be the
extracted answer, not just the ranked link.

- Already done well: `FAQPage` on `/` and `/how-to-play`, `HowTo` on
  `/how-to-play`, and `ANSWER_SNIPPETS` as a single source of answer text reused
  across page copy, JSON-LD and `llms.txt`. That reuse pattern is correct and
  should continue into every guide page.
- Missing: question-shaped `<h2>`s, and answers placed in the first paragraph
  rather than after context. Every Phase 3 page must lead with the answer.

**GEO (ChatGPT / Claude / Perplexity / AI Overviews)** — the aim is to be cited.

- Already done well: `llms.txt` with an explicit `## Entity` block, AI crawlers
  allowed rather than blocked, `ENTITY_DEFINITION` as one canonical sentence.
- The gap is **corroboration**. Generative engines weight independent
  third-party mentions far more heavily than self-description. `sameAs: []`
  means the entity has no anchors. Concretely:
  - Populate `sameAs` (Phase 2.8).
  - Get the game listed on sites AI engines demonstrably retrieve from: itch.io,
    a Reddit presence in r/WebGames / r/incremental_games, a Show HN, Product
    Hunt, and a GitHub repo README that states the entity definition verbatim.
  - **Disambiguate deliberately.** "Infinite tic-tac-toe" already refers to the
    unbounded-grid variant in common usage. `ENTITY_DEFINITION` should say
    explicitly what this game is *and is not*, so an engine does not merge the
    two. This is a one-sentence edit with outsized effect.
- Keep `llms.txt` genuinely current. It is the highest-signal-per-byte file on
  the site for this purpose, and a stale one actively misinforms.

---

## 5. Baseline metrics

Fill this in during Phase 1.7, then re-measure at +30 / +90 days.

| Metric | Baseline (2026-09-__) | +30d | +90d |
| --- | --- | --- | --- |
| GSC indexed pages | | | |
| GSC total impressions / 28d | | | |
| GSC total clicks / 28d | | | |
| Ranking keywords (top 100) | | | |
| PSI mobile — `/` | | | |
| PSI mobile — `/play` | | | |
| PSI mobile — `/leaderboard` | | | |
| Field LCP (p75, mobile) | | | |
| Field INP (p75, mobile) | | | |
| Field CLS (p75, mobile) | | | |
| Initial JS on `/` (gzip) | 248 KB | | |
| Brand citation in ChatGPT / Perplexity for "sliding tic tac toe" | | | |

Known figures at audit time (2026-09-26, pre-Phase-2):

- Initial JS on `/`: **248 KB gzipped** across 16 chunks
- `public/assets/`: **2.9 MB**; `public/icons/`: 276 KB
- URLs in sitemap: **15** (12 HTML + 3 non-HTML that should be removed)
- Live HTML size: `/` 74 KB, `/how-to-play` 123 KB, `/leaderboard` 48 KB

### Measured baseline — post-Phase-2 deploy (2026-09-26)

Objective figures, measured against production after the Phase 2 deploy. These
need no browser and are exactly reproducible, so they're the numbers to compare
against first.

| Measure | Value |
| --- | --- |
| Sitemap URLs | 12 (GSC: *Success*, 12 discovered) |
| IndexNow submission | `{"ok":true,"submitted":12}` |
| Initial JS on `/` | **255 KB gzipped**, 17 chunks |
| HTML delivered (gzip) | `/` 14 KB · `/play` 11 KB · `/leaderboard` 12 KB · `/how-to-play` 16 KB · `/play/ranked` 11 KB |
| TTFB, `/` (3 runs) | 0.20s / 0.30s / 0.15s |
| LCP image, delivered | `homeBg.jpg` → **39 KB AVIF**; `board.png` → **23 KB AVIF** |
| Icons, delivered raw | `favicon.svg` **205 KB** · `manifest-512` **375 KB** · `manifest-192` 64 KB · `apple-touch-icon` 38 KB |
| `fetchpriority="high"` preloads on `/` | **2** (should be 1 — they compete) |

**Correction to P1-5 above.** That finding treated `board.png` (447 KB source)
and `homeBg.jpg` (194 KB source) as LCP weight. They aren't: measured with a
browser `Accept` header, Next's image optimizer delivers them as 23 KB and
39 KB AVIF. Large *source* files cost repo and deploy size, not load time.

The real unoptimized payload is the icon set — `favicon.svg` and the manifest
PNGs bypass `/_next/image` entirely and ship raw, ~580 KB between them. A
favicon should be under 10 KB. That is the genuine Phase 4.1 target.

### PSI mobile baseline — 2026-09-26T14:59Z

Lighthouse 13.5.0, mobile emulation, via the PageSpeed Insights API so the run
is exactly repeatable at +30d / +90d. No CrUX field data at current traffic —
expected, not a fault. Compare Lab-to-Lab until traffic grows.

| Route | Score | FCP | **LCP** | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 63 | 3.5s | **5.7s** | 240ms | 0 | 5.9s |
| `/play` | 60 | 5.3s | **8.0s** | 40ms | 0 | 6.5s |
| `/leaderboard` | 71 | 1.5s | **6.4s** | 230ms | 0.001 | 4.0s |
| `/how-to-play` | 58 | 5.4s | **8.5s** | 130ms | 0 | 6.6s |

| Metric | Baseline | +30d | +90d |
| --- | --- | --- | --- |
| PSI mobile — `/` | 63 | | |
| PSI mobile — `/play` | 60 | | |
| PSI mobile — `/leaderboard` | 71 | | |
| PSI mobile — `/how-to-play` | 58 | | |
| GA4 `web_vitals` firing | not yet confirmed | | |


### Phase 4 result — 2026-09-26, after the perf work

Same PSI API, same settings, so like-for-like with the baseline above.

| Route | Baseline | After | Δ | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 63 | **90** | +27 | 5.7s → **3.3s** | 0 | 240 → 15ms |
| `/play` | 60 | **93** | +33 | 8.0s → **2.9s** | 0 | 40 → 99ms |
| `/leaderboard` | 71 | **94** | +23 | 6.4s → **2.9s** | 0 | 230 → 17ms |
| `/how-to-play` | 58 | **94** | +36 | 8.5s → **2.9s** | 0 | 130 → 80ms |

Three changes produced this, in rough order of impact: AdSense moved off the
critical path (`lazyOnload`), one high-priority image preload instead of two,
and 945 KB of icons removed. The 3D hero and our own bundle were never
touched — the baseline showed they were not the problem.

LCP is now 2.9-3.3s against a 2.5s "good" threshold. Every route is in the
"needs improvement" band rather than "poor"; none is green yet.

**A regression this caught.** The first post-deploy run showed `/leaderboard`
at 72 with CLS **0.751**. The cause was the `RankingExplainer` section added in
Phase 2: it sat outside the `<Suspense>` boundary so it would land in the
first HTML flush, and the standings then resolved *above* it and pushed it
down 1487px. The Phase 1.7 baseline had recorded 0.001 for this route because
that run hit a warm cache and resolved before the flush — the defect was
present all along and the baseline simply got a lucky run. Moving the section
inside the boundary fixed it (0.751 → 0).

Worth generalising: **a single Lighthouse run is not evidence of stability.**
Re-check CLS on any route whose content streams.

### What is left for performance

Deferred until there is field data, since lab numbers are now decent:

- LCP 2.9-3.3s → under 2.5s. The remaining cost is the hero backdrop image
  plus render-blocking font CSS, not JS.
- `public/assets/` is still 2.9 MB of source images. They are delivered as
  small AVIF via `/_next/image`, so this is repo and deploy weight, not user
  cost — low priority.
- Our own initial JS (~255 KB) is untouched and was never implicated.

### What the baseline actually says

**CLS is 0 and TBT is fine.** Layout stability is perfect and main-thread
blocking is within budget everywhere. **LCP is the only failing metric**, and it
fails on every route (5.7s–8.5s against a 2.5s "good" threshold).

**The cause is third-party JavaScript, not our code.** Unused-JS breakdown on `/`:

| Script | Total | Unused |
| --- | --- | --- |
| AdSense `m2026092301` | 163 KB | **119 KB** |
| Google Tag / GA4 | 172 KB | **72 KB** |
| adsbygoogle.js | 51 KB | **30 KB** |
| our chunk `2766` | 51 KB | 31 KB |

That is **~390 KB of third-party JS against ~255 KB of our own**, with ~221 KB
of the third-party total never executed. Longest tasks: gtag 148ms, AdSense
117ms + 98ms.

**This revises P1-5.** The 3D hero and framer-motion are not the bottleneck —
TBT would be far worse if they were. The dominant, fixable cost is that
`adsbygoogle.js` is a raw `<script>` in `<head>` (P1-6), giving ad code
document-blocking priority ahead of the LCP image.

### Revised Phase 4 order (evidence-based)

1. **Move AdSense to `next/script` with `lazyOnload`.** Biggest single lever:
   219 KB of ad JS currently competes with LCP. **Trade-off to decide
   consciously:** deferring ads slightly delays first impression render, which
   can reduce measured viewability. On a site whose LCP is 5.7s, faster pages
   almost certainly earn more than earlier ad calls — but it is a revenue
   decision, not purely a technical one.
2. **One `fetchpriority="high"` preload, not two.** Two competing high-priority
   images means neither wins the race to LCP.
3. **Shrink the raw icons** — `favicon.svg` 205 KB, `manifest-512` 375 KB.
4. Re-measure. Only then consider touching the hero or the JS bundle.

Items 4.4 and 4.5 in the original Phase 4 list (INP on the scroll hero, auditing
our own bundle) are **deprioritised** — the data does not support them yet.

---

## 6. Sequencing summary

```
Phase 1  Instrumentation      ~0.5d   ← blocks everything; do first
Phase 2  Fix indexed pages    ~2d     ← do before adding pages
Phase 3  Content layer        ongoing ← where the traffic is
Phase 4  Performance          ~1-2d   ← prioritize using Phase 1 data
Phase 5  Compounding          later
```

The one sequencing rule that matters: **do not start Phase 3 before Phase 2.**
Adding nine guide pages to a site that already has five thin pages and no
internal linking will produce nine more thin pages. Phase 2.7 (the footer) and
2.3 (mode copy) are what make Phase 3 compound instead of dilute.

---

## 7. Progress log

### 2026-09-26 — Phase 2 done, Phase 1 code done

Branch `feat/seo-phase-1-2`. Verified against a production build served
locally: `tsc --noEmit` clean, `next build` clean, 60/60 tests passing
(17 of them new, in `lib/seo/__tests__/seo.test.ts`).

**Done:**

| Task | Outcome |
| --- | --- |
| 1.3 | `verification` wired into `buildRootMetadata()`, reading `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION`. Omitted entirely when unset. **Needs the env vars set to take effect.** |
| 1.6 | `components/analytics/WebVitals.tsx` reports LCP/INP/CLS/TTFB to GA4 as `web_vitals` events via `useReportWebVitals`. |
| 2.1 | Homepage `<h1>` now reads "Infinite Tic-Tac-Toe / Free Online Multiplayer" — the qualifier is inside the `<h1>`, backing the title tag. |
| 2.2 | Hidden-text fixed. The entrance animation moved from framer-motion's `initial` to a CSS keyframe (`.hero-rise`), so the from-state lives in the stylesheet and the served `<h1>` has no `opacity:0`. Verified in built HTML. |
| 2.3 | All five `/play/*` routes have real copy: 4 sections + 3 FAQ + related links each, from `lib/seo/playModeContent.ts`. Rendered via a server component in each route's `layout.tsx`, so the client page bundles are untouched. `<h2>` count went 0 → 4 on ranked/online/local/rooms. |
| 2.4 | Not needed — every route got usable copy, so nothing was noindexed. |
| 2.5 | `/leaderboard` emits `ItemList` (top 20, `Person` by display name only) plus a `RankingExplainer` section with four subheadings covering tiers, rating maths, per-mode ratings and how to get ranked. h2 0 → 4. |
| 2.6 | `app/not-found.tsx` — branded, with 7 recovery links. Still returns 404 + noindex. |
| 2.7 | `components/layout/Footer.tsx` in the root layout, 10 internal links in 3 columns. Suppressed on immersive routes via `FooterSlot` + the new `IMMERSIVE_ROUTES` constant. Homepage's local footer removed. |
| 2.9 | Sitemap has per-route `lastModified` (distinct real dates; leaderboard stays dynamic). `/llms.txt`, `/feed.xml`, `/humans.txt` removed — 15 URLs → 12. `changeFrequency` values made honest (home `daily` → `weekly`). |
| 2.10 | `robots.ts` builds from `CRAWLER_DISALLOW` / `AI_CRAWLER_DISALLOW` in config. A test asserts the list can't drift from `NOINDEX_ROUTES`, and that nothing in the sitemap is disallowed. Dropped the Yandex-only `Host:` directive (P2-6). |

**Fixed along the way, not in the original plan:**

- **Two published facts were wrong.** `ANSWER_SNIPPETS.rankedSystem` claimed
  ratings start at 1000; the schema says 200 (`RANKS.DEFAULT_RATING`, and
  migration `20260824185035`). `ANSWER_SNIPPETS.isFree` claimed sign-in is
  needed for ranked; ranked has no `AccountRequired` guard — rooms, friends and
  direct challenges are the gated features. Both strings are published in
  `llms.txt`, `/feed.xml`, the About page and JSON-LD, so both were feeding
  incorrect claims to answer engines. Corrected in both places.
- **Every `FAQPage` shared one `@id`.** `faqPageSchema()` hardcoded
  `{url}/how-to-play#faq`, so the homepage FAQ and the tutorial FAQ published
  the same identifier with different contents. Now takes a `path`. Test added.
- **Entity disambiguation (from §4).** Added `ENTITY_DISAMBIGUATION`, published
  as schema.org `disambiguatingDescription` on both entity nodes and as a
  prominent section in `llms.txt`, stating outright that this is not the
  unbounded-grid variant.

**Deliberately not done:**

- **2.8 `sameAs` — blocked.** `SOCIAL_PROFILES` added to config (empty,
  documented) and `organizationSchema()` now omits `sameAs` rather than
  emitting `[]`. Nothing was added because nothing verified:
  `github.com/tushrpal/infinite-tic-tac-toe` returns 404 (private) and
  `x.com/InfiniteTTT` returns 404. A `sameAs` pointing at an unreachable URL is
  worse than none. **Next step: make the repo public and/or supply working
  profile URLs, then add them to `SOCIAL_PROFILES`.** Until the X handle is
  confirmed, `twitter:site`/`twitter:creator` are claiming an unverifiable
  account and should either be substantiated or removed.

### Immediate next actions (need account access, not code)

1. **1.1 / 1.2** — create the Search Console and Bing Webmaster properties.
   Nothing in this document is measurable until these exist.
2. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and
   `NEXT_PUBLIC_BING_SITE_VERIFICATION` in Vercel production.
3. **1.4 / 1.5** — set `INDEXNOW_KEY`, host `public/{key}.txt`, call
   `/api/indexnow` post-deploy.
4. **1.7** — capture the §5 baseline.
5. Resubmit `sitemap.xml` (it dropped from 15 URLs to 12 and all `lastmod`
   values changed).
6. Then **Phase 4**, prioritised by what 1.7 actually shows.
