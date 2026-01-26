import type { RankTimelinePoint } from "./RankTimelinePoint";

// ANSI color codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GRAY = "\x1b[90m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

/**
 * Print rank timeline to console.
 * Shows sequential rank progression.
 * 
 * @param timeline Timeline points (chronological order)
 * @param playerId Player identifier (for display)
 */
export function printRankTimeline(
  timeline: RankTimelinePoint[],
  playerId: string
): void {
  console.log(`${BOLD}\n📈 Rank Timeline\n${RESET}`);

  if (timeline.length === 0) {
    console.log(`${GRAY}No timeline data available.${RESET}`);
    return;
  }

  console.log(`${GRAY}Player: ${playerId}${RESET}`);
  console.log(`${GRAY}Total Points: ${timeline.length}\n${RESET}`);

  // Print each point
  for (const point of timeline) {
    printTimelinePoint(point);
  }

  console.log(); // Final spacing
}

/**
 * Print a single timeline point.
 */
function printTimelinePoint(point: RankTimelinePoint): void {
  const tierColor = getTierColor(point.tier);
  const tierDisplay = `${tierColor}${point.tier}${RESET}`;
  
  // Format delta with color and sign
  let deltaDisplay = "";
  if (point.delta !== 0) {
    const deltaColor = point.delta > 0 ? GREEN : RED;
    const deltaSign = point.delta > 0 ? "+" : "";
    deltaDisplay = ` ${deltaColor}(${deltaSign}${point.delta})${RESET}`;
  }

  console.log(
    `${GRAY}[${point.index}]${RESET} ${tierDisplay} ${GRAY}—${RESET} ${
      point.points
    }${deltaDisplay}`
  );
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
