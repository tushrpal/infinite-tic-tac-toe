# SEO Setup Runbook — the manual steps

Companion to [SEO_AEO_GEO_PLAN.md](./SEO_AEO_GEO_PLAN.md). Everything here needs
a browser and an account login, which is why it couldn't be done in code.

Total time: **about 60–75 minutes**, most of it waiting for verification.
Do them in order — step 2 depends on step 1.

Facts already established for this domain, so you don't have to look them up:

- DNS is on **Cloudflare** (nameservers `junade.ns.cloudflare.com`,
  `maya.ns.cloudflare.com`), so all DNS records go in the Cloudflare dashboard.
- Canonical host is **`https://www.infinitettt.com`**; the apex 308-redirects to
  it. Always use the `www` form.
- The Vercel CLI is **not installed** on this machine. Steps below use the Vercel
  dashboard. If you'd rather use the CLI: `npm i -g vercel`, then `vercel link`.

---

## Step 1 — Google Search Console (15 min, mostly waiting)

Without this, nothing in the plan is measurable. Do it first.

1. Go to <https://search.google.com/search-console>, sign in.
2. **Add property** → choose **Domain** (the left box), not URL prefix.
   - Enter `infinitettt.com` — no `https://`, no `www`.
   - Domain properties cover `www`, apex, and every subdomain in one property,
     and they verify by DNS so a redeploy can never break it.
3. Google shows a TXT record. Copy the value (looks like
   `google-site-verification=AbC123...`).
4. In **Cloudflare** → select `infinitettt.com` → **DNS** → **Add record**:
   - Type: `TXT`
   - Name: `@`
   - Content: paste the whole `google-site-verification=...` string
   - TTL: Auto
   - Save.
5. Back in Search Console, click **Verify**. If it fails, wait 5 minutes and
   retry — Cloudflare usually propagates in under a minute but Google caches.
6. Once verified: **Indexing → Sitemaps** → enter `sitemap.xml` → **Submit**.

**Also grab the verification meta token** while you're here (for step 3):
add a second property, this time **URL prefix** with `https://www.infinitettt.com`,
choose the **HTML tag** method, and copy just the `content="..."` value. You
don't need to complete that verification — you only want the token. (Keeping
both properties is fine and gives you URL-level reporting too.)

> **Expected result:** property verified, sitemap status *Success*, **12**
> discovered URLs. If it says 15, the deploy with the new sitemap hasn't
> landed yet.

---

## Step 2 — Bing Webmaster Tools (5 min)

1. Go to <https://www.bing.com/webmasters>, sign in.
2. Click **Import from Google Search Console** — this carries the property and
   verification across, so you skip the DNS dance entirely.
3. If you'd rather not link accounts: **Add site manually** →
   `https://www.infinitettt.com` → choose the **Meta tag** option → copy the
   `msvalidate.01` content value for step 3.
4. Submit the sitemap here too: **Sitemaps** → `https://www.infinitettt.com/sitemap.xml`.

---

## Step 3 — Set the environment variables in Vercel (10 min)

The code already reads these; they do nothing until they're set.

1. Vercel dashboard → your project → **Settings** → **Environment Variables**.
2. Add each of the following, scoped to **Production** only:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | the `content` value from step 1's HTML tag |
   | `NEXT_PUBLIC_BING_SITE_VERIFICATION` | the `msvalidate.01` value from step 2 |
   | `INDEXNOW_KEY` | `43fc6199544fd895369b5963e86a8dbe` |

   The IndexNow key above was generated for you. Regenerate with
   `openssl rand -hex 16` if you'd prefer your own — it just has to be 8–128
   characters of letters, digits and dashes.

3. **Also confirm `NEXT_PUBLIC_SITE_URL` is set to `https://www.infinitettt.com`
   in Production.** This one matters a lot: if it's missing, canonical URLs and
   the sitemap fall back to the hardcoded production domain, which is correct
   today but only by luck.

4. Redeploy for the vars to take effect — Vercel does **not** apply new env vars
   to the existing deployment. Either push a commit or use
   **Deployments → ⋯ → Redeploy**.

> The two `NEXT_PUBLIC_*` verification values are deliberately public — they go
> into the HTML as meta tags. `INDEXNOW_KEY` has no `NEXT_PUBLIC_` prefix
> because it must stay server-side.

---

## Step 4 — Host the IndexNow key file (5 min)

IndexNow verifies ownership by fetching a file whose name *is* the key.

1. Create the file — from the repo root:

   ```bash
   echo "43fc6199544fd895369b5963e86a8dbe" > apps/web/public/43fc6199544fd895369b5963e86a8dbe.txt
   ```

   The filename and the file's contents must both be exactly the key, and the
   key must match `INDEXNOW_KEY` from step 3. All three have to agree.

2. Commit and deploy it.

3. Verify it's live:

   ```bash
   curl https://www.infinitettt.com/43fc6199544fd895369b5963e86a8dbe.txt
   ```

   It must return the key as plain text. If you get HTML, the file isn't in
   `public/` or the deploy hasn't finished.

4. Now test the endpoint that's already built:

   ```bash
   curl -X POST https://www.infinitettt.com/api/indexnow \
     -H "Content-Type: application/json" \
     -d '{"urls":["https://www.infinitettt.com/","https://www.infinitettt.com/play/ranked"]}'
   ```

   **Expected:** `{"ok":true,"submitted":2}`.
   `503 INDEXNOW_KEY not configured` means step 3 didn't take — redeploy.

---

## Step 5 — Ping IndexNow with all 12 URLs (2 min)

Once step 4 returns `ok:true`, submit the whole set. Run from the repo root:

```bash
curl -X POST https://www.infinitettt.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"urls":[
    "https://www.infinitettt.com/",
    "https://www.infinitettt.com/play",
    "https://www.infinitettt.com/play/online",
    "https://www.infinitettt.com/play/ranked",
    "https://www.infinitettt.com/play/practice",
    "https://www.infinitettt.com/play/local",
    "https://www.infinitettt.com/play/rooms",
    "https://www.infinitettt.com/leaderboard",
    "https://www.infinitettt.com/how-to-play",
    "https://www.infinitettt.com/about",
    "https://www.infinitettt.com/privacy",
    "https://www.infinitettt.com/terms"
  ]}'
```

**Worth automating later** (plan task 1.5): call this from a post-deploy step so
every deploy notifies Bing automatically. Not urgent — do it by hand for now.

---

## Step 6 — Capture the baseline (15 min)

Do this **after** the redeploy from step 3, so you're measuring the new code.
Record the numbers in §5 of the plan doc — the whole point is comparing against
them in 30 and 90 days.

1. For each of these four URLs, run <https://pagespeed.web.dev> and note the
   **mobile** Performance score plus LCP / INP / CLS:
   - `https://www.infinitettt.com/`
   - `https://www.infinitettt.com/play`
   - `https://www.infinitettt.com/leaderboard`
   - `https://www.infinitettt.com/how-to-play`

2. In GA4 (**Reports → Realtime**), open the site in a browser and confirm a
   `web_vitals` event arrives. This proves the new instrumentation works. Full
   reporting takes ~24h to populate.

   To see them as a proper report, create a custom exploration on the
   `web_vitals` event with `metric_name` and `metric_value`.

3. Fill in the Search Console rows in §5 as zeros or blanks for now — they need
   ~28 days of data to mean anything.

4. Confirm the on-page fixes actually shipped:

   ```bash
   # should print the h1 with no opacity:0, and the qualifier text
   curl -s https://www.infinitettt.com/ | grep -o '<h1[^>]*>.\{0,300\}'

   # should print 12
   curl -s https://www.infinitettt.com/sitemap.xml | grep -c '<loc>'

   # should print the two verification meta tags
   curl -s https://www.infinitettt.com/ | grep -oE '<meta name="(google-site-verification|msvalidate.01)"[^>]*>'
   ```

---

## Step 7 — Fix the entity anchors (30 min, unblocks GEO)

This is the `sameAs` blocker. Generative engines weight independent
corroboration far above self-description, and right now there is none.

Both URLs currently fail — I checked on 2026-09-26:

| URL | Status |
| --- | --- |
| `github.com/tushrpal/infinite-tic-tac-toe` | **404** — private, so unusable as a public anchor |
| `x.com/InfiniteTTT` | **404** — may not exist |

### 7a. Make the repo public, or stop claiming it

If you're willing: GitHub → repo → **Settings** → **General** → scroll to
**Danger Zone** → **Change visibility** → Public.

Before you do, check nothing sensitive is committed:

```bash
git log --all --diff-filter=A --name-only -- '*.env*' '*.pem' '*secret*' | head -20
```

`apps/web/.env.local` exists locally — confirm it's gitignored and was never
committed. If it was, rotate those credentials before going public.

If you'd rather keep it private, that's fine — just don't add it to
`SOCIAL_PROFILES`.

### 7b. Sort out the X account

The site currently emits `twitter:site` and `twitter:creator` as `@InfiniteTTT`,
which I can't verify exists. Pick one:

- **It exists** → tell me the exact handle and put `infinitettt.com` in its bio
  (the backlink is what makes the association count).
- **It doesn't** → either create it, or I'll remove the `twitterHandle` from
  `lib/seo/config.ts`. Claiming an account you don't own is a broken signal, and
  Twitter/X cards will render without attribution either way.

### 7c. Then tell me, and I'll wire it up

Once you have working, publicly-reachable, back-linking URLs, it's a one-line
change to `SOCIAL_PROFILES` in `apps/web/lib/seo/config.ts` — I left it ready.

### 7d. Third-party listings (the actual GEO lever)

Beyond `sameAs`, these are the places AI engines demonstrably retrieve from.
Each one is an independent mention, which is worth far more than anything we
write on our own site:

- **itch.io** — free to list a web game, and genuinely well-indexed.
- **Reddit** — r/WebGames, r/incremental_games. Post as a player sharing a game,
  not as marketing; both subs will remove overt promotion.
- **Show HN** — <https://news.ycombinator.com/show>. One shot, so pick a day
  you can reply to comments.
- **Product Hunt** — worth a launch once the guide pages from Phase 3 exist.

When you write these, reuse `ENTITY_DEFINITION` from
`apps/web/lib/seo/keywords.ts` **verbatim**. Consistent phrasing across
independent sources is exactly the signal that resolves an entity.

---

## Step 8 — Resubmit the sitemap (2 min)

Do this after the deploy. The sitemap changed materially — 15 URLs down to 12,
and every `lastmod` value is different — so a manual re-crawl request is worth it.

1. Search Console → **Sitemaps** → click `sitemap.xml` → **Request re-crawl**
   (or just delete and re-add it).
2. Search Console → **URL Inspection** → paste each of these → **Request
   indexing**. These five changed the most, so they're the ones worth the quota:
   - `https://www.infinitettt.com/`
   - `https://www.infinitettt.com/play/ranked`
   - `https://www.infinitettt.com/play/online`
   - `https://www.infinitettt.com/play/rooms`
   - `https://www.infinitettt.com/leaderboard`

   There's a daily quota of roughly 10–12 manual requests, so don't burn it on
   pages that barely changed.

---

## Checklist

```
[ ] 1  Search Console property verified via Cloudflare TXT
[ ] 1  sitemap.xml submitted, shows 12 URLs
[ ] 1  HTML-tag verification token copied
[ ] 2  Bing Webmaster imported or verified
[ ] 2  sitemap submitted to Bing
[ ] 3  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION set (Production)
[ ] 3  NEXT_PUBLIC_BING_SITE_VERIFICATION set (Production)
[ ] 3  INDEXNOW_KEY set (Production)
[ ] 3  NEXT_PUBLIC_SITE_URL confirmed as https://www.infinitettt.com
[ ] 3  redeployed so the vars apply
[ ] 4  public/{key}.txt committed, deployed, returns plain text
[ ] 4  POST /api/indexnow returns {"ok":true}
[ ] 5  all 12 URLs submitted to IndexNow
[ ] 6  PSI mobile scores recorded in plan §5
[ ] 6  web_vitals event confirmed in GA4 Realtime
[ ] 6  curl checks confirm h1 / sitemap / meta tags shipped
[ ] 7  repo made public, or excluded from sameAs
[ ] 7  X handle confirmed or removed
[ ] 7  SOCIAL_PROFILES updated
[ ] 8  sitemap resubmitted, 5 key URLs re-crawl requested
```

---

## What to expect, and when

Set expectations now so you don't read noise as failure:

| When | What you should see |
| --- | --- |
| Within 24h | `web_vitals` events in GA4; IndexNow-submitted pages appearing in Bing |
| 3–7 days | Search Console starts reporting impressions; the 12 URLs move to *Indexed* |
| 2–4 weeks | Whether the play-page copy earns impressions for mode-specific terms |
| 4–8 weeks | Whether the ranked/leaderboard pages rank for anything competitive |

**Don't judge the play-page copy before ~3 weeks.** Newly-substantial pages take
a crawl cycle plus a ranking cycle. And don't add the Phase 3 guide pages until
you can see Phase 2 working in Search Console data — that's the whole reason
they're sequenced that way.
