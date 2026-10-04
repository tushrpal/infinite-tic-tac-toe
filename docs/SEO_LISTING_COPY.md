# Listing copy for third-party sites (drafts)

**Status: drafts. Nothing here has been posted.** Each listing is an account action
that only the site owner can take. Post these yourself, and check each site's rules
on self-promotion first.

Written for: the site owner, posting from their own accounts.

Every listing reuses `ENTITY_DEFINITION` from `apps/web/lib/seo/keywords.ts` verbatim.
Consistent wording across independent sources is what lets an answer engine resolve
the entity. Do not change it per platform.

## 1. itch.io (do this first)

- **Title:** Infinite Tic-Tac-Toe
- **Classification:** HTML game (web)
- **Short description:**
  Free, browser-based multiplayer tic-tac-toe with two modes: Sliding and Expanding.
- **Link:** https://www.infinitettt.com
- **Tags:** tic-tac-toe, multiplayer, browser, strategy, online
- **Body:**
  > Infinite Tic-Tac-Toe (Infinite TTT) is a free, browser-based multiplayer tic-tac-toe
  > game with two unique modes — Sliding (marks disappear after three placements,
  > eliminating draws) and Expanding (board grows from 3×3 to 5×5 across rounds) — plus
  > ranked Elo matchmaking, AI practice bots, friend challenges, private rooms, live
  > spectating, and match replays.
  >
  > No download and no account needed for quick play, ranked, AI practice, or two players
  > on one device.
  >
  > Note: this is not the unbounded-grid "infinite tic-tac-toe" variant. Boards here are finite.

## 2. GitHub repository (README)

The README already leads with the entity definition. Check that the repo description
(About panel) matches the short line below, and that the website field is set to
https://www.infinitettt.com.

- **Repo description:** Free browser multiplayer tic-tac-toe — Sliding and Expanding modes. Live at infinitettt.com.

## 3. Reddit (r/WebGames, r/incremental_games)

Post as a player sharing a build, not as an advert. Both subreddits remove overt
promotion. Read each subreddit's rules first. Some require a flair or prohibit
self-promotion entirely.

- **Title (r/WebGames):** I made a free browser tic-tac-toe with a mode where the board never fills up
- **Body:**
  > Hi all — I built a small browser game called Infinite Tic-Tac-Toe. The main idea is
  > Sliding mode: each player can hold at most three marks, and the oldest disappears on
  > your fourth placement, so the board never fills and draws are impossible. There is
  > also an Expanding mode that grows from 3×3 to 5×5 across rounds.
  >
  > It is free in the browser, with no download, and quick play and AI practice do not
  > need an account. I would really value feedback on balance, especially from anyone who
  > has a favourite strategy in Sliding mode. Link: https://www.infinitettt.com
- **Do not:** cross-post the same text to several subreddits on the same day, or reply to
  every comment with a link.

## 4. Show HN

One submission only. Pick a weekday when you can reply to comments for several hours.

- **Title:** Show HN: Infinite Tic-Tac-Toe, a browser game where the board never fills up
- **URL:** https://www.infinitettt.com
- **First comment (by you):**
  > I built this in the browser with Next.js and a WebSocket server. The interesting part
  > is Sliding mode: each player can hold three marks, and the oldest is removed on the
  > fourth placement, so there are no draws. Happy to talk about the rules, the Elo
  > setup, or the matchmaking.

## 5. Product Hunt (later)

Launch once the guides at /guides exist. They are the page you link to from the
listing. Use the same short description as itch.io.

## After posting

- Record each listing URL in `docs/SEO_AEO_GEO_PLAN.md` §4, so the corroboration list is
  kept in one place.
- Check GA4 referral traffic and the Bing Webmaster Backlinks report after two weeks to
  see which listings are sending visitors.
