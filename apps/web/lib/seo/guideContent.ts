/**
 * Indexable guide pages for the two game modes this site owns the name for.
 *
 * Phase 3 of docs/SEO_AEO_GEO_PLAN.md. Each guide leads with the direct answer
 * (answer engines extract the opening), uses question-shaped headings, and
 * carries a FAQ whose answers stand alone out of context.
 *
 * Mode rules here are taken from the same published copy as llms.txt and
 * lib/seo/keywords.ts (ANSWER_SNIPPETS). If a rule changes in the engine, change
 * it here too.
 */

import { PUBLIC_ROUTES } from "./config";

export interface GuideSection {
  /** Phrased as the question a person would type. */
  heading: string;
  body: string[];
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideContent {
  slug: string;
  path: string;
  title: string;
  description: string;
  /** Answer-first lead. Must answer the primary query in the first ~60 words. */
  lead: string;
  sections: GuideSection[];
  faq: GuideFaq[];
  related: Array<{ href: string; label: string }>;
}

export const SLIDING_GUIDE: GuideContent = {
  slug: "sliding-tic-tac-toe-rules",
  path: "/guides/sliding-tic-tac-toe-rules",
  title: "Sliding Tic-Tac-Toe Rules",
  description:
    "Sliding tic-tac-toe rules: a fixed 3×3 board where each player holds at most three marks, and the oldest mark disappears on your fourth placement. Learn how to play and why draws are impossible.",
  lead:
    "Sliding tic-tac-toe is the Sliding mode in Infinite Tic-Tac-Toe. It is played on a fixed 3×3 board. Each player can have at most three marks on the board at once. On your fourth placement, your oldest mark is removed. The first player to get three in a row wins, and the mode has no draws.",
  sections: [
    {
      heading: "How do you play sliding tic-tac-toe?",
      body: [
        "Players take turns placing X or O on the grid, and X goes first. Place a mark on any empty cell. Three in a row, column or diagonal wins.",
        "The difference is the limit. You may hold only three marks at a time. When you place a fourth, your oldest mark is removed from the board.",
      ],
    },
    {
      heading: "Why can sliding tic-tac-toe never end in a draw?",
      body: [
        "A normal tic-tac-toe board fills up, and the game ends as a draw if nobody has three in a row. In sliding mode, marks keep leaving the board, so there is always an empty cell to play on and the board never fills.",
        "That means the game keeps going until someone completes a line.",
      ],
    },
    {
      heading: "What strategy works in sliding tic-tac-toe?",
      body: [
        "Your oldest mark is the one that will disappear next, so do not rely on it to block or to complete a line. Plan two or three moves ahead, because the board changes every turn.",
        "The centre cell still matters because it belongs to four winning lines. Taking it early is a strong opening. Create two possible wins at once, since your opponent can only block one.",
      ],
    },
    {
      heading: "Where can you play sliding tic-tac-toe?",
      body: [
        "Sliding mode is free in your browser with no download. You can play it against an AI bot, against a random opponent in quick play, in ranked matches, or with a friend on one device.",
        "Ranked Sliding has its own rating, separate from Expanding.",
      ],
    },
  ],
  faq: [
    {
      question: "How many marks can each player have in sliding tic-tac-toe?",
      answer:
        "Each player can have at most three marks on the board. Placing a fourth mark removes your oldest one.",
    },
    {
      question: "Does sliding tic-tac-toe have draws?",
      answer:
        "No. Because old marks are removed, the board never fills up, so the game cannot end in a draw. It continues until one player makes three in a row.",
    },
    {
      question: "Is sliding tic-tac-toe free?",
      answer:
        "Yes. It runs in your browser with no download and no account needed for quick play, ranked matches, AI practice or two players on one device.",
    },
    {
      question: "How is sliding tic-tac-toe different from expanding tic-tac-toe?",
      answer:
        "Sliding keeps a fixed 3×3 board and removes your oldest mark. Expanding grows the board from 3×3 to 4×4 to 5×5 over rounds, and marks stay for the whole round.",
    },
  ],
  related: [
    { href: PUBLIC_ROUTES.howToPlay, label: "How to play" },
    { href: PUBLIC_ROUTES.playRanked, label: "Ranked matches" },
    { href: PUBLIC_ROUTES.playPractice, label: "Practice vs bots" },
    { href: "/guides/expanding-tic-tac-toe-rules", label: "Expanding tic-tac-toe rules" },
  ],
};

export const EXPANDING_GUIDE: GuideContent = {
  slug: "expanding-tic-tac-toe-rules",
  path: "/guides/expanding-tic-tac-toe-rules",
  title: "Expanding Tic-Tac-Toe Rules",
  description:
    "Expanding tic-tac-toe rules: a round-based game where the board grows from 3×3 to 4×4 to 5×5, and you need N in a row on an N×N board. Learn how to play and how it differs from classic tic-tac-toe.",
  lead:
    "Expanding tic-tac-toe is the Expanding mode in Infinite Tic-Tac-Toe. It is played in rounds on a board that grows: the first round is on 3×3, then 4×4, then 5×5. To win, you need N marks in a row on an N×N board. Marks stay on the board for the whole round.",
  sections: [
    {
      heading: "How do you play expanding tic-tac-toe?",
      body: [
        "Players take turns placing X or O, and X goes first. Each round is played on the current board size. Place marks on empty cells, and the first player to get a full line of the required length wins that round.",
        "When a round ends, the board grows to the next size and the next round begins.",
      ],
    },
    {
      heading: "What is the win condition in expanding tic-tac-toe?",
      body: [
        "The win condition scales with the board. On a 3×3 board you need three in a row. On a 4×4 board you need four in a row. On a 5×5 board you need five in a row.",
        "Horizontal, vertical and diagonal lines all count.",
      ],
    },
    {
      heading: "Why does the board grow?",
      body: [
        "Growing the board keeps each round fresh. The early rounds are small and quick to read. Later rounds give more room, so the game rewards planning rather than a single lucky threat.",
      ],
    },
    {
      heading: "Where can you play expanding tic-tac-toe?",
      body: [
        "Expanding mode is free in your browser with no download. You can play it against an AI bot, in quick play, in ranked matches, or with a friend on one device.",
        "Ranked Expanding has its own rating, separate from Sliding.",
      ],
    },
  ],
  faq: [
    {
      question: "What board sizes does expanding tic-tac-toe use?",
      answer:
        "Expanding tic-tac-toe starts on a 3×3 board and grows to 4×4 and then 5×5 across rounds.",
    },
    {
      question: "How many in a row do you need to win expanding tic-tac-toe?",
      answer:
        "You need N marks in a row on an N×N board. That is three on 3×3, four on 4×4, and five on 5×5.",
    },
    {
      question: "Do marks stay on the board in expanding tic-tac-toe?",
      answer:
        "Yes. Marks stay for the whole round. They are only cleared when the board grows to the next size.",
    },
    {
      question: "Is expanding tic-tac-toe free?",
      answer:
        "Yes. It runs in your browser with no download and no account needed for quick play, ranked matches, AI practice or two players on one device.",
    },
  ],
  related: [
    { href: PUBLIC_ROUTES.howToPlay, label: "How to play" },
    { href: PUBLIC_ROUTES.playRanked, label: "Ranked matches" },
    { href: PUBLIC_ROUTES.playPractice, label: "Practice vs bots" },
    { href: "/guides/sliding-tic-tac-toe-rules", label: "Sliding tic-tac-toe rules" },
  ],
};

export const GUIDE_HUB = {
  path: "/guides",
  title: "Tic-Tac-Toe Guides",
  description:
    "Rules and strategy guides for Infinite Tic-Tac-Toe: sliding and expanding modes, with answers to common questions about how the game works.",
};

export const GUIDES: GuideContent[] = [SLIDING_GUIDE, EXPANDING_GUIDE];

/**
 * The plain "tic tac toe" page. It is play-first: a classic 3×3 board sits above
 * the copy, so the page serves the people who searched to play now. The copy
 * explains the classic game and points to the two variants.
 */
export const TIC_TAC_TOE_GUIDE: GuideContent = {
  slug: "tic-tac-toe",
  path: PUBLIC_ROUTES.ticTacToe,
  title: "Tic-Tac-Toe: Play Free Online",
  description:
    "Play tic-tac-toe free in your browser. Classic 3×3 rules, how to win, and the Sliding and Expanding variants from Infinite Tic-Tac-Toe. No download needed.",
  lead:
    "Tic-tac-toe is a two-player game on a 3×3 grid. Players take turns placing X or O, and the first to get three in a row, column or diagonal wins. Play the classic version below, free, with no download or account. Infinite Tic-Tac-Toe also offers two variants that change the rules.",
  sections: [
    {
      heading: "How do you play tic-tac-toe?",
      body: [
        "X goes first, then players alternate. Each turn, place your mark in any empty cell. The first player to complete a line of three wins.",
        "If every cell fills up and nobody has three in a row, the game is a draw.",
      ],
    },
    {
      heading: "How do you win at tic-tac-toe?",
      body: [
        "A winning line is three marks in a row horizontally, vertically or diagonally. The centre cell belongs to four of the eight possible lines, and each corner belongs to three.",
        "Block your opponent when they have two in a line with the third cell open. If you can make two threats at once, your opponent can only block one.",
      ],
    },
    {
      heading: "Can tic-tac-toe end in a draw?",
      body: [
        "Yes. In classic tic-tac-toe, a draw happens when the board fills with no winner. With careful play from both sides, it is very hard to win, so draws are common.",
      ],
    },
    {
      heading: "How is this different from the variants?",
      body: [
        "Classic tic-tac-toe can end in a draw. Sliding mode is also on a fixed 3×3 board, but each player holds at most three marks, and the oldest is removed on the fourth move, so draws are impossible. Expanding mode starts on 3×3 and grows to 4×4 and then 5×5 across rounds.",
        "Classic play is available on one device at the local play page, and Sliding and Expanding are available online and against bots.",
      ],
    },
  ],
  faq: [
    {
      question: "Is tic-tac-toe free to play online?",
      answer:
        "Yes. The board on this page is free and runs in your browser with no download and no account.",
    },
    {
      question: "Who goes first in tic-tac-toe?",
      answer: "X goes first in the classic game, and players then alternate turns.",
    },
    {
      question: "Can you always draw at tic-tac-toe?",
      answer:
        "With careful play from both players, classic tic-tac-toe ends in a draw. A player who makes an error can lose, so the game rewards attention.",
    },
    {
      question: "Can I play tic-tac-toe with a friend?",
      answer:
        "Yes. Use the two-player mode on one device for classic play, or challenge a friend online in Sliding or Expanding mode.",
    },
  ],
  related: [
    { href: PUBLIC_ROUTES.playLocal, label: "Classic on one device" },
    { href: PUBLIC_ROUTES.playPractice, label: "Practice vs bots" },
    { href: PUBLIC_ROUTES.playOnline, label: "Online quick play" },
    { href: PUBLIC_ROUTES.guideSliding, label: "Sliding tic-tac-toe rules" },
    { href: PUBLIC_ROUTES.guideExpanding, label: "Expanding tic-tac-toe rules" },
    { href: PUBLIC_ROUTES.howToPlay, label: "How to play" },
  ],
};
