import type { RankedMatchHistoryEntry } from "./RankedMatchHistoryEntry";

// ANSI color codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GRAY = "\x1b[90m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";

/**
 * Print ranked match history to console.
 * Shows progression through ranked matches with context.
 * 
 * @param history Match history entries (chronological order)
 * @param playerId Player identifier (for display)
 */
export function printRankedHistory(
  history: RankedMatchHistoryEntry[],
  playerId: string
): void {
  console.log(`${BOLD}\n📊 Ranked Match History\n${RESET}`);

  if (history.length === 0) {
    console.log(`${GRAY}No ranked matches found.${RESET}`);
    console.log(`${GRAY}Play some ranked matches to see your history!\n${RESET}`);
    return;
  }

  console.log(`${GRAY}Player: ${playerId}${RESET}`);
  console.log(`${GRAY}Total Ranked Matches: ${history.length}\n${RESET}`);

  // Print each match (most recent first for better UX)
  const reversed = [...history].reverse();
  
  for (let i = 0; i < reversed.length; i++) {
    const entry = reversed[i];
    const matchNumber = history.length - i;

    printHistoryEntry(entry, matchNumber);
    console.log(); // Spacing between entries
  }
}

/**
 * Print a single history entry.
 */
function printHistoryEntry(
  entry: RankedMatchHistoryEntry,
  matchNumber: number
): void {
  // Result emoji and color
  const resultDisplay = formatResult(entry.result);
  
  // Match header
  console.log(
    `${BOLD}${matchNumber}.${RESET} ${resultDisplay} ${CYAN}vs ${entry.opponentLabel}${RESET}`
  );

  // Mode and performance
  console.log(
    `   ${GRAY}Mode:${RESET} ${formatMode(entry.mode)} ${GRAY}|${RESET} ${GRAY}Performance:${RESET} ${formatPerformance(
      entry.performanceTag
    )}`
  );

  // Rank change
  const deltaColor = entry.delta > 0 ? GREEN : entry.delta < 0 ? RED : GRAY;
  const deltaSign = entry.delta > 0 ? "+" : "";
  
  console.log(
    `   ${GRAY}Rank:${RESET} ${formatRank(
      entry.rankBefore
    )} ${GRAY}→${RESET} ${formatRank(entry.rankAfter)}`
  );
  
  console.log(
    `   ${deltaColor}Δ ${deltaSign}${entry.delta}${RESET}`
  );
}

/**
 * Format result with emoji and color.
 */
function formatResult(result: "win" | "loss" | "draw"): string {
  switch (result) {
    case "win":
      return `${GREEN}✓ Win${RESET}`;
    case "loss":
      return `${RED}✗ Loss${RESET}`;
    case "draw":
      return `${YELLOW}⚬ Draw${RESET}`;
  }
}

/**
 * Format game mode.
 */
function formatMode(mode: "mode1" | "mode2"): string {
  return mode === "mode1" ? "Mode 1" : "Mode 2";
}

/**
 * Format performance tag with emoji.
 */
function formatPerformance(tag: string): string {
  switch (tag) {
    case "dominant":
      return `${GREEN}⚡ Dominant${RESET}`;
    case "close":
      return `${YELLOW}⚔️  Close${RESET}`;
    case "scrappy":
      return `${BLUE}🔥 Scrappy${RESET}`;
    case "draw":
      return `${GRAY}⚬ Draw${RESET}`;
    default:
      return tag;
  }
}

/**
 * Format rank snapshot.
 */
function formatRank(rank: { tier: string; points: number }): string {
  const tierColor = getTierColor(rank.tier);
  return `${tierColor}${rank.tier} (${rank.points})${RESET}`;
}

/**
 * Get ANSI color code for rank tier.
 */
function getTierColor(tier: string): string {
  switch (tier) {
    case "Bronze":
      return "\x1b[38;5;130m"; // Bronze-ish
    case "Silver":
      return "\x1b[37m"; // White (silver-ish)
    case "Gold":
      return "\x1b[33m"; // Yellow (gold)
    case "Platinum":
      return "\x1b[97m"; // Bright white
    case "Diamond":
      return "\x1b[96m"; // Cyan (diamond-ish)
    default:
      return "\x1b[37m";
  }
}
