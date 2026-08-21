/**
 * Tutorial Content Data
 * Structured content for the how-to-play guide
 */

export interface TutorialSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface GameRule {
  title: string;
  description: string;
  example?: string;
}

export interface WinPattern {
  name: string;
  description: string;
  pattern: Array<[number, number]>; // [row, col] coordinates
}

// ============================================
// Tutorial Sections
// ============================================

export const tutorialSections: TutorialSection[] = [
  {
    id: "basics",
    title: "Basic Rules",
    description: "Learn the fundamental rules of Infinite Tic-Tac-Toe",
    icon: "📚",
  },
  {
    id: "modes",
    title: "Game Modes",
    description: "Understand the different ways to play",
    icon: "🎮",
  },
  {
    id: "winning",
    title: "How to Win",
    description: "Discover all the ways to achieve victory",
    icon: "🏆",
  },
  {
    id: "strategy",
    title: "Strategy Tips",
    description: "Improve your gameplay with pro tips",
    icon: "💡",
  },
];

// ============================================
// Basic Rules
// ============================================

export const basicRules: GameRule[] = [
  {
    title: "Take Turns",
    description: "Players alternate placing their marks (X or O) on the 3x3 grid. X always goes first.",
  },
  {
    title: "Mark Placement",
    description: "Click or tap an empty cell to place your mark. Once placed, marks cannot be moved.",
  },
  {
    title: "Win or Draw",
    description: "Get three of your marks in a row (horizontal, vertical, or diagonal) to win. If all cells are filled with no winner, the game is a draw.",
  },
];

// ============================================
// Game Modes
// ============================================

export const gameModes = [
  {
    id: "classic",
    name: "Classic Mode",
    description: "Traditional Tic-Tac-Toe rules. The game ends when someone wins or all 9 cells are filled.",
    rules: [
      "Standard 3x3 grid",
      "First to get 3 in a row wins",
      "Game ends in draw if board fills up",
      "Quick matches, typically under 1 minute",
    ],
    icon: "🎯",
  },
  {
    id: "sliding",
    name: "Sliding Mode (Mode 1)",
    description: "An infinite twist! After 6 moves (3 per player), the oldest piece slides off the board when a new piece is placed.",
    rules: [
      "Game never ends in a draw",
      "Your oldest mark disappears when you place your 4th mark",
      "Forces dynamic strategy and adaptation",
      "Matches can last longer but are more engaging",
    ],
    icon: "♾️",
    highlight: true,
  },
];

// ============================================
// Winning Patterns
// ============================================

export const winPatterns: WinPattern[] = [
  {
    name: "Horizontal",
    description: "Three in a row across",
    pattern: [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  {
    name: "Vertical",
    description: "Three in a column down",
    pattern: [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: "Diagonal \\",
    description: "Top-left to bottom-right",
    pattern: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
  },
  {
    name: "Diagonal /",
    description: "Bottom-left to top-right",
    pattern: [
      [2, 0],
      [1, 1],
      [0, 2],
    ],
  },
];

// ============================================
// Strategy Tips
// ============================================

export const strategyTips = [
  {
    title: "Control the Center",
    description: "The center cell (middle square) is the most valuable position. It's part of 4 different winning lines.",
    priority: "high",
  },
  {
    title: "Create Multiple Threats",
    description: "Set up two winning opportunities at once. Your opponent can only block one!",
    priority: "high",
  },
  {
    title: "Block Your Opponent",
    description: "Always check if your opponent is one move away from winning. Block them before pursuing your own win.",
    priority: "high",
  },
  {
    title: "Corner Strategy",
    description: "Corner cells are powerful. They're part of 3 winning lines each (one row, one column, one diagonal).",
    priority: "medium",
  },
  {
    title: "Think Ahead (Sliding Mode)",
    description: "In sliding mode, remember which of your pieces will disappear next. Don't rely on pieces that are about to vanish!",
    priority: "medium",
  },
  {
    title: "Force Mistakes",
    description: "Put pressure on your opponent by creating complex situations where they might overlook a threat.",
    priority: "low",
  },
];

// ============================================
// FAQ
// ============================================

export const faq = [
  {
    question: "What happens if I disconnect during a match?",
    answer: "You have 60 seconds to reconnect. If you reconnect within this time, the game continues where it left off. If you don't reconnect, you forfeit the match.",
  },
  {
    question: "How does the ranking system work?",
    answer: "Your rating starts at 1000. Win matches to gain rating points, lose to drop points. The amount you gain or lose depends on your opponent's rating. Beating higher-rated players gives more points!",
  },
  {
    question: "Can I play against bots?",
    answer: "Yes! When creating a match, you can choose to play against AI opponents of varying difficulty levels. Bot matches still affect your rating, but with a reduced multiplier (0.6x).",
  },
  {
    question: "What's the difference between ranked and casual?",
    answer: "Ranked matches affect your rating and appear on the leaderboard. Casual matches are just for fun and don't impact your rating.",
  },
  {
    question: "Can I rematch my opponent?",
    answer: "Yes! After a match ends, you can request a rematch. If your opponent accepts, you'll start a new game immediately with the same opponent.",
  },
  {
    question: "How does sliding mode keep the game from being a draw?",
    answer: "In sliding mode, pieces automatically disappear after 6 total moves (3 per player). This constant movement prevents board stalemates and keeps the game dynamic.",
  },
];
