import type { MatchResult } from "@infinite-ttt/shared";
import type { RankedSession } from "./RankedSession";
import { updateRankedSession } from "./RankedSession";
import type { RankedOpponent } from "./opponentResolver";
import { resolveRankedOpponent } from "./opponentResolver";
import type { RankPreview } from "./rankPreview";
import { computeRankPreview, formatRankPreview } from "./rankPreview";
import type { RankSummary } from "./rankSummary";
import { createRankSummary, formatRankSummary } from "./rankSummary";
import { createRankedMatchContext } from "./RankedMatchContext";
import { computeRankDelta } from "./computeRankDelta";
import { applyRankDelta } from "./applyRankDelta";

/**
 * Orchestrates a complete ranked match flow.
 * Handles pre-match preview, match execution, and post-match rank updates.
 *
 * This is the main entry point for ranked matches.
 *
 * Phases:
 * 1. Pre-Match: Resolve opponent, show rank preview
 * 2. Match: Execute game (delegated to caller)
 * 3. Post-Match: Compute and apply rank delta, show summary
 */
export class RankedMatchController {
  private session: RankedSession;

  constructor(session: RankedSession) {
    this.session = session;
  }

  /**
   * Get current session.
   */
  getSession(): RankedSession {
    return this.session;
  }

  /**
   * Phase 1: Pre-Match Setup
   *
   * Resolves opponent and computes rank preview.
   *
   * @param mode Game mode (1 or 2)
   * @param humanOpponent Optional human opponent (for PvP)
   * @returns Pre-match data
   */
  preMatch(
    mode: 1 | 2,
    humanOpponent?: { playerId: string; points: number }
  ): {
    opponent: RankedOpponent;
    preview: RankPreview;
    previewText: string;
  } {
    // Resolve opponent
    const opponent = humanOpponent
      ? resolveRankedOpponent(
          this.session.player,
          {
            playerId: humanOpponent.playerId,
            points: humanOpponent.points,
            tier: this.session.player.tier, // Simplified for local
            isBot: false,
          } as any
        )
      : resolveRankedOpponent(this.session.player);

    // Compute preview
    const preview = computeRankPreview(this.session.player, opponent, mode);
    const previewText = formatRankPreview(preview);

    return {
      opponent,
      preview,
      previewText,
    };
  }

  /**
   * Phase 2: Match Execution
   *
   * This phase is delegated to the caller (game loop).
   * The caller must:
   * 1. Run the game
   * 2. Generate MatchResult with isRanked=true
   * 3. Call postMatch() with the result
   */

  /**
   * Phase 3: Post-Match Rank Update
   *
   * Computes rank delta, applies it, and generates summary.
   *
   * @param matchResult MatchResult from completed match
   * @param opponent Opponent used in match
   * @returns Post-match data
   */
  postMatch(
    matchResult: MatchResult,
    opponent: RankedOpponent
  ): {
    summary: RankSummary;
    summaryText: string;
    updatedSession: RankedSession;
  } {
    // Create match context
    const context = createRankedMatchContext(
      this.session.player,
      opponent.player,
      matchResult.isRanked,
      matchResult.mode === "mode1" ? 1 : 2
    );

    // Compute rank delta
    const delta = computeRankDelta(
      matchResult,
      this.session.player.playerId,
      context
    );

    // Apply delta
    const result = applyRankDelta(this.session.player.points, delta);

    // Create summary
    const summary = createRankSummary(delta, result);
    const summaryText = formatRankSummary(summary);

    // Update session
    const updatedSession = updateRankedSession(
      this.session,
      result.newPoints,
      delta.outcome
    );

    // Store updated session
    this.session = updatedSession;

    return {
      summary,
      summaryText,
      updatedSession,
    };
  }

  /**
   * Show current rank status.
   */
  showRankStatus(): string {
    const { player, matchesPlayed, wins, losses, draws } = this.session;
    const winRate =
      matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) : "0.0";

    const lines: string[] = [];
    lines.push("");
    lines.push("🏆 RANKED STATUS");
    lines.push("═".repeat(50));
    lines.push(`Rank: ${player.tier} (${player.points} pts)`);
    lines.push(
      `Record: ${wins}W - ${losses}L - ${draws}D (${winRate}% WR)`
    );
    lines.push(`Matches: ${matchesPlayed}`);
    lines.push("═".repeat(50));
    lines.push("");

    return lines.join("\n");
  }

  /**
   * Complete ranked match flow (convenience method).
   *
   * This combines all phases:
   * 1. Pre-match setup
   * 2. Match execution (via callback)
   * 3. Post-match update
   *
   * @param mode Game mode
   * @param playMatch Callback that executes the match and returns MatchResult
   * @param humanOpponent Optional human opponent
   * @returns Complete flow result
   */
  async executeRankedMatch(
    mode: 1 | 2,
    playMatch: (opponent: RankedOpponent) => Promise<MatchResult>,
    humanOpponent?: { playerId: string; points: number }
  ): Promise<{
    preview: RankPreview;
    opponent: RankedOpponent;
    matchResult: MatchResult;
    summary: RankSummary;
    updatedSession: RankedSession;
  }> {
    // Phase 1: Pre-match
    const { opponent, preview } = this.preMatch(mode, humanOpponent);

    // Phase 2: Match execution (delegated)
    const matchResult = await playMatch(opponent);

    // Verify match is marked as ranked
    if (!matchResult.isRanked) {
      throw new Error("Match result must have isRanked=true for ranked matches");
    }

    // Phase 3: Post-match
    const { summary, updatedSession } = this.postMatch(matchResult, opponent);

    return {
      preview,
      opponent,
      matchResult,
      summary,
      updatedSession,
    };
  }
}
