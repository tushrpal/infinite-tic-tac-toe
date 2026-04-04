import type { RankDelta } from "./RankDelta";
import type { RankDeltaResult } from "./applyRankDelta";

/**
 * Rank summary information for post-match display.
 */
export interface RankSummary {
  /** Match outcome */
  outcome: "win" | "loss" | "draw";

  /** Performance description */
  performance: string;

  /** Rank delta applied */
  delta: RankDelta;

  /** Result after applying delta */
  result: RankDeltaResult;

  /** True if player was promoted */
  promoted: boolean;

  /** True if player was demoted */
  demoted: boolean;

  /** Opponent was a bot */
  vsBot: boolean;
}

/**
 * Create rank summary from delta and result.
 *
 * @param delta RankDelta
 * @param result RankDeltaResult
 * @returns RankSummary
 */
export function createRankSummary(
  delta: RankDelta,
  result: RankDeltaResult
): RankSummary {
  return {
    outcome: delta.outcome,
    performance: getPerformanceDescription(delta.performanceMultiplier),
    delta,
    result,
    promoted: result.promoted,
    demoted: result.demoted,
    vsBot: delta.vsBot,
  };
}

/**
 * Get human-readable performance description.
 *
 * @param multiplier Performance multiplier (0.8 - 1.3)
 * @returns Description
 */
function getPerformanceDescription(multiplier: number): string {
  if (multiplier >= 1.25) return "Dominant";
  if (multiplier >= 1.15) return "Strong";
  if (multiplier >= 1.05) return "Good";
  if (multiplier >= 0.95) return "Average";
  if (multiplier >= 0.85) return "Weak";
  return "Poor";
}

/**
 * Format rank summary for console display.
 *
 * @param summary RankSummary
 * @returns Formatted string for display
 */
export function formatRankSummary(summary: RankSummary): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("📊 RANK UPDATE");
  lines.push("═".repeat(50));

  // Outcome with emoji
  const outcomeEmoji =
    summary.outcome === "win" ? "🎉" : summary.outcome === "loss" ? "😞" : "🤝";
  const outcomeText =
    summary.outcome === "win"
      ? "VICTORY"
      : summary.outcome === "loss"
        ? "DEFEAT"
        : "DRAW";
  lines.push(`${outcomeEmoji} Result: ${outcomeText}`);

  // Performance
  if (summary.outcome !== "draw") {
    lines.push(`⚡ Performance: ${summary.performance}`);
  }

  // Rank change
  const changeSign = summary.delta.pointsChange >= 0 ? "+" : "";
  const changeColor =
    summary.delta.pointsChange > 0 ? "+" : summary.delta.pointsChange < 0 ? "-" : "=";

  if (summary.delta.pointsChange !== 0) {
    lines.push(`📈 Rank Change: ${changeSign}${summary.delta.pointsChange}`);
  } else {
    lines.push(`📊 Rank Change: No change (draw)`);
  }

  // Tier change
  if (summary.promoted) {
    lines.push("");
    lines.push(
      `🌟 PROMOTED! ${summary.result.previousTier} → ${summary.result.newTier}`
    );
  } else if (summary.demoted) {
    lines.push("");
    lines.push(
      `⬇️  Demoted: ${summary.result.previousTier} → ${summary.result.newTier}`
    );
  } else {
    lines.push(`🏆 Rank: ${summary.result.newTier} (${summary.result.newPoints} pts)`);
  }

  // Bot penalty notice
  if (summary.vsBot && summary.outcome === "win" && summary.delta.botPenaltyApplied) {
    lines.push("");
    lines.push("⚠️  Bot penalty applied: 60% of normal points");
  }

  // Explanation
  lines.push("");
  lines.push(`💭 ${summary.delta.explanation}`);

  lines.push("═".repeat(50));
  lines.push("");

  return lines.join("\n");
}

/**
 * Format a quick rank update (minimal version).
 *
 * @param summary RankSummary
 * @returns Short formatted string
 */
export function formatQuickRankUpdate(summary: RankSummary): string {
  const changeSign = summary.delta.pointsChange >= 0 ? "+" : "";

  if (summary.promoted) {
    return `🌟 ${summary.result.previousTier} → ${summary.result.newTier} (${changeSign}${summary.delta.pointsChange})`;
  }

  if (summary.demoted) {
    return `⬇️  ${summary.result.previousTier} → ${summary.result.newTier} (${changeSign}${summary.delta.pointsChange})`;
  }

  return `${summary.result.newTier}: ${summary.result.newPoints} pts (${changeSign}${summary.delta.pointsChange})`;
}
