/**
 * Keyword clusters for SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).
 *
 * Primary: high-intent head terms
 * Secondary: mode-specific and feature terms
 * Long-tail: question-style queries AI answer engines surface
 * Branded: entity disambiguation for generative citations
 */

export const KEYWORD_CLUSTERS = {
  /** Head terms — homepage, title tags */
  primary: [
    "tic tac toe online",
    "play tic tac toe online free",
    "online tic tac toe multiplayer",
    "tic tac toe game online",
    "free tic tac toe",
    "multiplayer tic tac toe",
  ],

  /** Game mode differentiators */
  modes: [
    "sliding tic tac toe",
    "infinite tic tac toe",
    "expanding board tic tac toe",
    "tic tac toe no draw",
    "dynamic tic tac toe",
    "tic tac toe variants",
  ],

  /** Competitive / ranked intent */
  competitive: [
    "ranked tic tac toe",
    "competitive tic tac toe online",
    "tic tac toe leaderboard",
    "tic tac toe elo rating",
    "tic tac toe ranking system",
    "ladder tic tac toe",
  ],

  /** Social / multiplayer features */
  social: [
    "play tic tac toe with friends",
    "private tic tac toe room",
    "tic tac toe challenge friends",
    "2 player tic tac toe online",
    "tic tac toe invite link",
  ],

  /** Learning & strategy — AEO/GEO answer targets */
  learning: [
    "how to play tic tac toe",
    "how to win tic tac toe",
    "tic tac toe strategy",
    "tic tac toe tips",
    "tic tac toe rules",
    "sliding tic tac toe rules",
  ],

  /** Bot / practice intent */
  practice: [
    "tic tac toe vs computer",
    "tic tac toe bot",
    "practice tic tac toe",
    "tic tac toe AI opponent",
    "tic tac toe single player",
  ],

  /** Platform / format */
  platform: [
    "browser tic tac toe game",
    "no download tic tac toe",
    "PWA tic tac toe",
    "mobile tic tac toe online",
    "real-time tic tac toe",
  ],

  /** Branded entity terms for GEO citation clarity */
  branded: [
    "Infinite Tic-Tac-Toe",
    "Infinite TTT",
    "infinite-ttt",
    "Infinite Tic Tac Toe game",
  ],
} as const;

/** Flat deduplicated list for meta keywords tag. */
export const ALL_KEYWORDS: string[] = Array.from(
  new Set(Object.values(KEYWORD_CLUSTERS).flat())
);

/** One-sentence entity definition — optimized for AI citation (GEO). */
export const ENTITY_DEFINITION =
  "Infinite Tic-Tac-Toe (Infinite TTT) is a free, browser-based multiplayer tic-tac-toe game with two unique modes — Sliding (marks disappear after three placements, eliminating draws) and Expanding (board grows from 3×3 to 5×5 across rounds) — plus ranked Elo matchmaking, AI practice bots, friend challenges, private rooms, live spectating, and match replays.";

/** Short answer blocks for common AI queries (AEO). */
export const ANSWER_SNIPPETS = {
  whatIsIt: ENTITY_DEFINITION,
  howToPlay:
    "Take turns placing X or O on the grid. In Sliding mode, after each player has 3 marks on the board, the oldest mark is removed on the next placement — first to three-in-a-row wins with no draws. In Expanding mode, rounds play on growing boards (3×3, then 4×4, then 5×5) where you need N-in-a-row on an N×N board.",
  isFree:
    "Yes. Infinite Tic-Tac-Toe is completely free to play in your browser with no download or account required for casual matches. Optional sign-in unlocks ranked play, friends, and profile stats.",
  gameModes:
    "Sliding Mode uses a fixed 3×3 board where marks slide off after three placements per player, preventing stalemates. Expanding Mode uses round-based play on progressively larger boards where the win condition scales with board size.",
  rankedSystem:
    "Ranked matches use an Elo-style rating system starting at 1000. Wins against higher-rated opponents award more points. Players climb tiers from Bronze through Grandmaster on the global leaderboard.",
} as const;
