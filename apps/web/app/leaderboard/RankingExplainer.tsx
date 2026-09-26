import Link from "next/link";
import type { Route } from "next";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

type Tier = {
  readonly name: string;
  readonly minRating: number;
  readonly color: string;
};

/**
 * Explanatory content for the leaderboard.
 *
 * The leaderboard shipped as a single <h1> plus a table: no prose, no
 * subheadings, nothing that answered the questions people actually search for
 * ("tic tac toe elo rating", "tic tac toe ranking system"). Tier thresholds
 * come from RANKS.TIERS rather than being written out, so the copy can't drift
 * away from the values the app actually uses.
 */
export function RankingExplainer({
  tiers,
  defaultRating,
  summary,
}: {
  tiers: readonly Tier[];
  defaultRating: number;
  summary: string;
}) {
  const topTier = tiers[tiers.length - 1];

  return (
    <section
      aria-labelledby="ranking-explainer-heading"
      className="border-t border-white/5 px-4 py-14"
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="ranking-explainer-heading"
          className="mb-4 font-display text-2xl font-bold text-text-primary"
        >
          How Infinite Tic-Tac-Toe Ranking Works
        </h2>
        <p className="mb-10 leading-relaxed text-text-secondary">{summary}</p>

        <h3 className="mb-4 font-semibold text-text-primary">Rank tiers</h3>
        <ul className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiers.map((tier) => (
            <li
              key={tier.name}
              className="rounded-xl border border-white/5 bg-surface-elevated/40 p-3"
            >
              <span
                className="block text-sm font-semibold"
                style={{ color: tier.color }}
              >
                {tier.name}
              </span>
              <span className="text-xs text-text-muted">
                {tier.minRating}+ rating
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mb-3 font-semibold text-text-primary">
          How rating is calculated
        </h3>
        <p className="mb-6 leading-relaxed text-text-secondary">
          Ranked matches use an Elo-style calculation. The points you gain or
          lose depend on the gap between your rating and your opponent&apos;s:
          beating someone rated well above you moves you a long way, while
          beating someone far below you barely moves the needle — and losing to
          them costs more. Every player starts at {defaultRating}, so the first
          few matches place you quickly rather than grinding you up from zero.
        </p>

        <h3 className="mb-3 font-semibold text-text-primary">
          Separate ratings per mode
        </h3>
        <p className="mb-6 leading-relaxed text-text-secondary">
          Sliding and Expanding are different games strategically, so they carry
          independent ratings. Being {topTier?.name ?? "Grandmaster"} in Sliding
          says nothing about your Expanding rank — you can filter the standings
          above by mode to see each ladder on its own.
        </p>

        <h3 className="mb-3 font-semibold text-text-primary">
          Getting on the leaderboard
        </h3>
        <p className="leading-relaxed text-text-secondary">
          Only ranked matches affect your rating. Practice games against AI
          bots, local two-player games and private room matches are all
          unrated, so you can warm up without risk.{" "}
          <Link
            href={PUBLIC_ROUTES.playRanked as Route}
            className="text-accent-primary underline-offset-4 hover:underline"
          >
            Play a ranked match
          </Link>{" "}
          to get a placement, or read{" "}
          <Link
            href={PUBLIC_ROUTES.howToPlay as Route}
            className="text-accent-primary underline-offset-4 hover:underline"
          >
            how to play
          </Link>{" "}
          first.
        </p>
      </div>
    </section>
  );
}
