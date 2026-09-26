/**
 * Indexable copy for the five /play/* routes.
 *
 * These routes shipped as interactive shells — one <h1>, a one-line subtitle,
 * and a widget — while being submitted to the sitemap at priority 0.70-0.85.
 * Near-duplicate, near-empty pages are thin-content candidates, and low-value
 * indexed URLs drag the whole property's quality assessment (which matters
 * more than usual here because AdSense runs on the site).
 *
 * The rule this content follows: each page must answer a *different* question.
 * If two entries here could be swapped without anyone noticing, the copy has
 * failed and the route should be noindexed instead.
 *
 * Every factual claim below was checked against the implementation:
 *   - bot tiers and their behaviour → app/play/practice/page.tsx DIFFICULTY_INFO
 *   - rooms hold 2-8 players        → components/rooms/CreateRoomModal.tsx
 *   - rooms need a linked account   → components/auth/AccountRequired.tsx
 *   - ranked does NOT need an account (no AccountRequired guard on it)
 *   - local offers Classic as well as Sliding/Expanding → getLocalModeInfo()
 *   - starting rating 200, Bronze at 400 → RANKS in lib/constants.ts
 * If any of those change, this file changes with them.
 */

import { PUBLIC_ROUTES } from "./config";

export interface PlayModeSection {
  heading: string;
  body: string;
}

export interface PlayModeFaq {
  question: string;
  answer: string;
}

export interface PlayModeContent {
  /** Answer-first lead paragraph. Answer engines extract the opening. */
  lead: string;
  sections: PlayModeSection[];
  faq: PlayModeFaq[];
  related: Array<{ href: string; label: string }>;
}

export const PLAY_MODE_CONTENT: Record<
  "ranked" | "online" | "practice" | "local" | "rooms",
  PlayModeContent
> = {
  ranked: {
    lead:
      "Ranked matches are Infinite Tic-Tac-Toe's competitive ladder. Every result adjusts your Elo rating, matchmaking pairs you with someone near your level, and your placement shows on the global leaderboard. No account is needed to play ranked — your rating is tracked from your first match.",
    sections: [
      {
        heading: "How ranked differs from quick play",
        body: "Quick play exists to get you into a game fast and nothing is at stake. Ranked is the opposite trade: matchmaking waits a little longer to find someone within a sensible rating range, and the result counts. That changes how people play — ranked opponents defend properly, so the sloppy three-in-a-row setups that win casual games get punished here.",
      },
      {
        heading: "What moves your rating",
        body: "The rating change depends on the gap between the two players. Beating someone rated well above you is worth a lot; beating someone well below you is worth very little, and losing to them costs more than a normal loss. This means you cannot farm rating off weak opponents — climbing requires beating people at or above your own level. Sliding and Expanding carry completely separate ratings, so strong play in one mode does not carry over to the other.",
      },
      {
        heading: "Choosing your mode before you queue",
        body: "Sliding rewards short-horizon tactics: with only three marks each, the board state churns constantly and you are always trading a threat for the mark you are about to lose. Expanding rewards planning — the board grows from 3×3 to 4×4 to 5×5 across rounds, marks persist within a round, and the win condition scales with the board, so you are building longer structures under more pressure. Pick the one you actually want to be ranked in, since the ladders are independent.",
      },
    ],
    faq: [
      {
        question: "Do I need an account to play ranked tic-tac-toe?",
        answer:
          "No. Ranked matchmaking works without signing in and your rating is tracked from your first match. Signing in is only needed if you want that rating to follow you across devices, along with friends and private rooms.",
      },
      {
        question: "What rating do I start at?",
        answer:
          "Every player starts at 200. Bronze begins at 400, and the tiers run Bronze, Silver, Gold, Platinum, Diamond, Master and Grandmaster, with Grandmaster at 3000.",
      },
      {
        question: "Can I lose rating for leaving a ranked match?",
        answer:
          "Abandoning a ranked match is treated as a loss, the same as being beaten on the board. Use practice mode or quick play if you want to experiment without risking rating.",
      },
    ],
    related: [
      { href: PUBLIC_ROUTES.leaderboard, label: "See the global leaderboard" },
      { href: PUBLIC_ROUTES.playPractice, label: "Warm up against AI bots" },
      { href: PUBLIC_ROUTES.howToPlay, label: "Learn the rules and strategy" },
    ],
  },

  online: {
    lead:
      "Quick play drops you into a casual online match against a real opponent, usually within seconds. Nothing is rated, no account is required, and you can leave between games freely — it is the fastest way to actually play Infinite Tic-Tac-Toe against another person.",
    sections: [
      {
        heading: "How matchmaking works",
        body: "Pick Sliding or Expanding and you join a queue for that mode. Because quick play ignores rating entirely, it only has to find one other person who wants the same mode, which is why it resolves much faster than ranked. Matches run over a live WebSocket connection, so moves appear on both boards immediately rather than on a poll.",
      },
      {
        heading: "When to use quick play instead of ranked",
        body: "Use quick play when you are learning a mode, testing an idea, or just want a game without consequences. A common pattern that works well: play a handful of quick games after switching modes to get a feel for the new board dynamics, then move to ranked once your instincts have adjusted. Nothing you do here touches your rating in either direction.",
      },
      {
        heading: "No download, no sign-up",
        body: "The game runs entirely in your browser on desktop and mobile — there is nothing to install, though you can add it to your home screen as an app if you want. Quick play needs no account at all; you get a temporary player identity automatically and can start immediately.",
      },
      {
        heading: "Who you will be playing",
        body: "Because quick play ignores rating, the queue mixes everyone: someone opening the game for the first time can be matched against a Grandmaster. That is a feature rather than a flaw — it means you see a wide range of play styles quickly, and it is the fastest way to discover the patterns that actually beat people rather than the ones that only beat bots. If you would rather face opponents at a predictable level, ranked is the mode that filters by rating.",
      },
      {
        heading: "Leaving and rejoining",
        body: "Nothing is at stake in quick play, so stepping away between games costs you nothing — there is no abandon penalty and no rating to protect. If your connection drops mid-match the game reconnects you where possible; if it cannot, you can simply queue again. Ranked treats abandonment as a loss, which is the main behavioural difference between the two queues.",
      },
    ],
    faq: [
      {
        question: "Is online tic-tac-toe here free to play?",
        answer:
          "Yes, entirely free with no download. Quick play needs no account — you can start a match against a real opponent immediately.",
      },
      {
        question: "How long does it take to find an opponent?",
        answer:
          "Usually a few seconds. Quick play does not filter by rating, so it only needs to find one other person queued for the same mode, which makes it noticeably faster than ranked matchmaking.",
      },
      {
        question: "Do quick play results affect my rating?",
        answer:
          "No. Quick play is completely unrated. Only ranked matches change your Elo rating or your leaderboard position.",
      },
    ],
    related: [
      { href: PUBLIC_ROUTES.playRanked, label: "Play ranked instead" },
      { href: PUBLIC_ROUTES.playRooms, label: "Play with friends in a private room" },
      { href: PUBLIC_ROUTES.howToPlay, label: "Learn the rules" },
    ],
  },

  practice: {
    lead:
      "Practice mode puts you against an AI bot at Easy, Medium or Hard difficulty. Every game is unrated, so it is the right place to learn a mode's mechanics, test an opening, or work out why a particular pattern keeps beating you — without a rating on the line.",
    sections: [
      {
        heading: "What each difficulty actually does",
        body: "Easy plays essentially at random. It will not punish mistakes, which makes it useful for learning the rules of a mode — especially Sliding, where watching your oldest mark vanish takes a few games to internalise. Medium plays tactically: it takes wins it can see and blocks yours, so it will catch simple oversights. Hard plays strategically, thinking several moves ahead rather than reacting, and it will exploit the specific weakness of trading away a mark you still needed.",
      },
      {
        heading: "Why practice against a bot is worth it here",
        body: "In standard tic-tac-toe, perfect play from both sides is always a draw, so practising is nearly pointless once you know the basic blocks. Neither mode here can end in a draw, which means there is always a winning line to find and genuine skill to develop. Practising against Hard is the fastest way to learn what real defensive play looks like before you meet it in ranked.",
      },
      {
        heading: "Which difficulty to start on",
        body: "If a mode is new to you, play two or three games on Easy purely to see the mechanics — how marks slide off, or how the board and win condition scale between rounds. Move to Medium as soon as you are winning comfortably, and treat consistently beating Hard as the signal that you are ready to queue for ranked.",
      },
    ],
    faq: [
      {
        question: "Does practice against bots affect my rating?",
        answer:
          "No. Every practice match is unrated and none of them appear on the leaderboard. Only ranked matches change your Elo rating.",
      },
      {
        question: "How many bot difficulties are there?",
        answer:
          "Three. Easy plays random moves, Medium plays tactically by taking wins and blocking threats, and Hard plays strategically several moves ahead.",
      },
      {
        question: "Can I practise both game modes against a bot?",
        answer:
          "Yes. Practice supports both Sliding and Expanding, and since each mode rewards a different kind of thinking, it is worth practising them separately.",
      },
    ],
    related: [
      { href: PUBLIC_ROUTES.howToPlay, label: "Read the rules and strategy guide" },
      { href: PUBLIC_ROUTES.playRanked, label: "Queue for a ranked match" },
      { href: PUBLIC_ROUTES.playOnline, label: "Play a casual online match" },
    ],
  },

  local: {
    lead:
      "Local play is two people on one device, taking turns on the same screen. It is the only place you can play Classic tic-tac-toe here alongside Sliding and Expanding Rounds, it needs no opponent online, and once the page has loaded it does not need a connection at all.",
    sections: [
      {
        heading: "Three modes, including Classic",
        body: "Local play offers Sliding, Classic and Expanding Rounds. Classic is ordinary 3×3 tic-tac-toe — three in a row, draws possible — which is useful for teaching someone the basic game before showing them a variant. Expanding Rounds is a best-of-five series where the board grows each round, so a local session has a natural arc rather than ending after one game.",
      },
      {
        heading: "Good for teaching someone the variants",
        body: "Sliding is much easier to explain sitting next to someone than over a text description: you place a fourth mark, their oldest one disappears, and the idea lands immediately. Because both players share one board, you can talk through why a move was a mistake as it happens — which is something online play cannot give you.",
      },
      {
        heading: "Works without a connection",
        body: "Local matches run entirely in the browser with no server involved, so once the page has loaded you can keep playing on a plane or with no signal. Nothing is rated and nothing is recorded to the leaderboard.",
      },
      {
        heading: "Which local mode to pick",
        body: "Start with Classic if either player has never played tic-tac-toe at all — it is the game everyone already knows, and it makes the variants easier to explain afterwards by contrast. Pick Sliding for a quick session where you want the twist immediately; single games are short because draws cannot happen. Pick Expanding Rounds when you have longer: it is a best-of-five where the board grows each round, so the difficulty ramps and the series has a real ending rather than stopping arbitrarily.",
      },
      {
        heading: "Passing one device back and forth",
        body: "Both players use the same board, so the only etiquette needed is handing the phone or laptop over after each move. On a touchscreen this works better than it sounds — the board is large enough to tap accurately one-handed, and because each turn is a single tap there is no fiddly input to get wrong while the device changes hands.",
      },
    ],
    faq: [
      {
        question: "Can two people play tic-tac-toe on the same device?",
        answer:
          "Yes. Local play is pass-and-play on one screen — both players take turns on the same board, with no second device and no accounts needed.",
      },
      {
        question: "Can I play classic 3×3 tic-tac-toe here?",
        answer:
          "Yes, in local play. Classic mode is standard 3×3 tic-tac-toe with draws possible. The online modes are Sliding and Expanding only.",
      },
      {
        question: "Does local play work offline?",
        answer:
          "Yes. Local matches are computed in the browser, so once the page has loaded no connection is needed. Local games are unrated.",
      },
    ],
    related: [
      { href: PUBLIC_ROUTES.playOnline, label: "Play someone online instead" },
      { href: PUBLIC_ROUTES.howToPlay, label: "Learn the rules of each mode" },
      { href: PUBLIC_ROUTES.playPractice, label: "Play against an AI bot" },
    ],
  },

  rooms: {
    lead:
      "Rooms are private lobbies for playing a series of games with people you invite. Create one, share the room code or invite link, and everyone who joins can play multiple matches in a row without requeueing. Rooms hold between two and eight players and need a linked account, since a room has to persist while people join.",
    sections: [
      {
        heading: "Inviting people",
        body: "Every room gets a short code and a shareable link. The link carries a rich preview with the room code in it, so pasting it into a chat shows what it is rather than a bare URL. Anyone with either the code or the link can join — there is no friend request step and no approval queue.",
      },
      {
        heading: "More than two people",
        body: "A room holds up to eight players even though Infinite Tic-Tac-Toe is a two-player game. The extras are not idle: players who are not in the current match can watch it live, and you can rotate who plays between games. That makes a room work for a small group taking turns rather than only a single pair.",
      },
      {
        heading: "Rooms versus a direct challenge",
        body: "Use a direct challenge from your friends list when you want one game against one specific person. Use a room when you want a session — several games, a group, or people joining partway through. Room matches are unrated, so a long session with friends will not move your ranked rating.",
      },
    ],
    faq: [
      {
        question: "How do I play tic-tac-toe with a friend online?",
        answer:
          "Create a private room and share the invite link or room code. Your friend joins with either one — no friend request needed. You can also send a direct challenge from your friends list for a single game.",
      },
      {
        question: "How many people can be in a room?",
        answer:
          "Between two and eight. Since a match is two players, anyone not currently playing can spectate the live game and swap in for the next one.",
      },
      {
        question: "Do I need an account to create a room?",
        answer:
          "Yes. Rooms need a linked account because the room has to persist while other people join and reconnect. Quick play, ranked and practice all work without signing in.",
      },
    ],
    related: [
      { href: PUBLIC_ROUTES.playOnline, label: "Play a random opponent instead" },
      { href: PUBLIC_ROUTES.playRanked, label: "Play a rated match" },
      { href: PUBLIC_ROUTES.howToPlay, label: "Learn the rules" },
    ],
  },
};
