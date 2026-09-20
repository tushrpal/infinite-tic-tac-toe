/**
 * Presentational sections of the profile page. All data and state live in
 * ProfileClient; these only render what they are given.
 */

import Link from "next/link";
import { ROUTES, RANKS } from "@/lib/constants";
import { cn, formatRelativeTime, getRankFromRating } from "@/lib/helpers";
import { getChallengeModeLabel, getOnlineModeInfo } from "@/lib/gameModes";
import { RankEmblem } from "@/components/ui/RankEmblem";
import type { PlayerMatchSummary, PlayerStatsProfile } from "@/lib/player";
import {
  BarChartIcon,
  BoltIcon,
  ClockIcon,
  CrownIcon,
  ExpandIcon,
  HandshakeIcon,
  LockIcon,
  PlayCircleIcon,
  SkullIcon,
  StarIcon,
  SwordsIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon,
  UserIcon,
  XCircleIcon,
} from "./ProfileIcons";

// ============================================
// Shared bits
// ============================================

export type Streak = { type: "win" | "loss" | "draw"; count: number };

function CardTitle({
  icon,
  children,
  aside,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-text-primary sm:text-lg">
        <span className="h-5 w-5 text-accent-primary sm:h-6 sm:w-6">{icon}</span>
        {children}
      </h2>
      {aside}
    </div>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-accent-primary to-[#7c3aed] transition-all duration-500",
          className,
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/**
 * How far through the current tier the rating is (0–100). The lowest tier is
 * measured from 0 so players still below its listed minimum see real progress.
 */
function tierProgress(rating: number): { pct: number; next: number | null; pointsLeft: number } {
  const current = getRankFromRating(rating);
  const index = RANKS.TIERS.findIndex((t) => t.name === current.name);
  const next = RANKS.TIERS[index + 1];
  if (!next) return { pct: 100, next: null, pointsLeft: 0 };
  const base = index === 0 ? 0 : current.minRating;
  return {
    pct: Math.min(100, Math.max(0, ((rating - base) / (next.minRating - base)) * 100)),
    next: next.minRating,
    pointsLeft: Math.max(0, Math.round(next.minRating - rating)),
  };
}

/** Best of the two mode ratings — what rank and rank progress are based on. */
export function getBestRating(profile: Pick<PlayerStatsProfile, "ratingMode1" | "ratingMode2">) {
  return Math.max(profile.ratingMode1 ?? 0, profile.ratingMode2 ?? 0) || RANKS.DEFAULT_RATING;
}

// ============================================
// Header
// ============================================

export function ProfileHeader({
  profile,
  editing,
}: {
  profile: PlayerStatsProfile;
  /** When set, replaces the name with the edit form. */
  editing?: React.ReactNode;
}) {
  const name = profile.displayName || profile.username || "Player";
  const rank = getRankFromRating(getBestRating(profile));

  return (
    <section className="glass-panel p-5 sm:p-6">
      <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-accent-primary bg-gradient-to-br from-accent-primary/40 to-playerO-primary/25 font-display text-3xl font-bold shadow-[0_0_28px_rgba(168,85,247,0.5)] sm:h-28 sm:w-28 sm:text-5xl">
              {name.charAt(0).toUpperCase()}
            </div>
            <RankEmblem
              rank={rank.name}
              size={44}
              className="absolute -bottom-1 -right-2 h-9 w-9 sm:h-11 sm:w-11"
            />
          </div>

          <div className="min-w-0">
            {editing ?? (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="truncate font-display text-3xl font-bold text-text-primary sm:text-4xl">
                    {name}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium"
                    style={{ color: rank.color }}
                  >
                    <RankEmblem rank={rank.name} size={18} />
                    {rank.name}
                  </span>
                </div>
                {profile.displayName && profile.username && (
                  <p className="mt-0.5 text-sm text-text-tertiary">@{profile.username}</p>
                )}
                <p className="mt-1.5 text-sm text-text-secondary">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-0.5 text-sm italic text-text-muted">
                  Small moves. Infinite possibilities.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1.5fr_1fr_1fr] divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20 py-3 md:grid-cols-3 md:rounded-none md:border-0 md:border-l md:bg-transparent md:py-0 md:pl-8">
          <RatingFigure
            icon={<CrownIcon className="h-9 w-9 text-accent-warning" />}
            value={profile.rating}
            label="Total Rating"
            big
          />
          <RatingFigure
            icon={<BoltIcon className="h-6 w-6 text-accent-primary" />}
            value={profile.ratingMode1}
            label={getOnlineModeInfo("MODE_1").label}
          />
          <RatingFigure
            icon={<ExpandIcon className="h-6 w-6 text-playerO-primary" />}
            value={profile.ratingMode2}
            label={getOnlineModeInfo("MODE_2").label}
          />
        </div>
      </div>
    </section>
  );
}

function RatingFigure({
  icon,
  value,
  label,
  big,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  big?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-2 text-center sm:px-5",
        // Phones: the big total sits icon-left / number-right; the others stack.
        big ? "gap-3 md:flex-col md:gap-0" : "flex-col",
      )}
    >
      <div className={cn("flex h-9 shrink-0 items-center", !big && "mb-1", big && "md:mb-1")}>{icon}</div>
      <div>
        <div className={cn("font-display font-bold leading-none", big ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl")}>
          {value}
        </div>
        <div className="mt-1 text-xs text-text-muted">{label}</div>
      </div>
    </div>
  );
}

// ============================================
// Stat tiles
// ============================================

export function StatTiles({ profile }: { profile: PlayerStatsProfile }) {
  return (
    <section className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-5">
      <StatTile
        icon={<SwordsIcon />}
        tone="text-accent-primary"
        value={profile.matchesPlayed}
        label="Matches"
      />
      <StatTile
        icon={<TrophyIcon />}
        tone="text-accent-success"
        value={profile.wins}
        label="Wins"
      />
      <StatTile
        icon={<SkullIcon />}
        tone="text-accent-error"
        value={profile.losses}
        label="Losses"
      />
      <StatTile
        icon={<HandshakeIcon />}
        tone="text-text-secondary"
        value={profile.draws}
        label="Draws"
      />
      <StatTile
        icon={<BarChartIcon />}
        tone="text-playerO-primary"
        value={`${profile.winRate.toFixed(1)}%`}
        label="Win Rate"
        className="hidden lg:flex"
      />
    </section>
  );
}

function StatTile({
  icon,
  tone,
  value,
  label,
  className,
}: {
  icon: React.ReactNode;
  tone: string;
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel flex items-center gap-1 px-1.5 py-2.5 sm:gap-4 sm:px-5 sm:py-3.5", className)}>
      <span className={cn("h-5 w-5 shrink-0 sm:h-9 sm:w-9", tone)}>{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-lg font-bold leading-tight sm:text-2xl">{value}</div>
        <div className="text-[10px] text-text-muted sm:text-sm">{label}</div>
      </div>
    </div>
  );
}

// ============================================
// Win rate + encouragement
// ============================================

export function WinRateCard({
  profile,
  recent,
}: {
  profile: PlayerStatsProfile;
  recent: PlayerMatchSummary[];
}) {
  const pct = Math.min(100, Math.max(0, profile.winRate));
  const fill =
    pct >= 60
      ? "from-accent-success to-emerald-400"
      : pct >= 45
        ? "from-accent-primary to-[#7c3aed]"
        : "from-accent-error to-playerX-primary";

  return (
    <section className="glass-panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold sm:text-lg">
          <BarChartIcon className="h-5 w-5 text-accent-primary sm:h-6 sm:w-6" />
          Win Rate
        </h2>
        <span className="font-display text-lg font-bold text-accent-primary">{pct.toFixed(1)}%</span>
      </div>

      <ProgressBar value={pct} className={fill} />

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-text-secondary">
        <Legend dot="bg-accent-success" label={`${profile.wins} Wins`} />
        <Legend dot="bg-white/70" label={`${profile.draws} Draws`} />
        <Legend dot="bg-accent-error" label={`${profile.losses} Losses`} />
      </div>

      {recent.length > 0 && (
        <div className="mt-4 hidden items-center justify-center gap-2 border-t border-white/10 pt-3 sm:flex">
          <span className="mr-1 text-xs text-text-muted">Last {recent.length}</span>
          {recent.map((m, i) => (
            <FormBadge key={m.matchId || i} result={m.result} />
          ))}
        </div>
      )}
    </section>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

function FormBadge({ result }: { result: "win" | "loss" | "draw" }) {
  return (
    <span
      title={result}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
        result === "win" && "bg-accent-success/90",
        result === "loss" && "bg-accent-error/90",
        result === "draw" && "bg-white/25",
      )}
    >
      {result === "win" ? "W" : result === "loss" ? "L" : "D"}
    </span>
  );
}

export function EncouragementCard({
  profile,
  streak,
}: {
  profile: PlayerStatsProfile;
  streak: Streak;
}) {
  let title = "Keep Going!";
  let text = "Every game makes you stronger.";

  if (profile.matchesPlayed === 0) {
    title = "Let's Play!";
    text = "Finish your first match to start climbing.";
  } else if (streak.type === "win" && streak.count >= 3) {
    title = `${streak.count} Wins in a Row!`;
    text = "You're on fire — keep it going.";
  } else if (profile.winRate >= 50) {
    title = "Great Work!";
    text = "You're winning more than you lose.";
  }

  return (
    <section className="glass-panel hidden items-center gap-4 p-5 lg:flex">
      <TrendingUpIcon className="h-12 w-12 shrink-0 text-accent-primary" />
      <div>
        <div className="font-semibold text-accent-primary">{title}</div>
        <p className="mt-1 text-sm text-text-secondary">{text}</p>
      </div>
    </section>
  );
}

// ============================================
// Rank progress + next goal
// ============================================

export function RankProgressCard({ rating }: { rating: number }) {
  const current = getRankFromRating(rating);
  const progress = tierProgress(rating);
  const currentIndex = RANKS.TIERS.findIndex((t) => t.name === current.name);
  const next = RANKS.TIERS[currentIndex + 1];
  const pointsLeft = progress.pointsLeft;

  return (
    <section className="glass-panel p-5" aria-labelledby="rank-progress-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="rank-progress-heading"
          className="flex items-center gap-2.5 text-base font-semibold sm:text-lg"
        >
          <CrownIcon className="h-5 w-5 text-accent-primary sm:h-6 sm:w-6" />
          Rank Progress
        </h2>
        <span className="text-sm text-accent-primary">
          {next ? `${pointsLeft} points to ${next.name}` : "Top rank reached"}
        </span>
      </div>

      <ol className="flex justify-between gap-1 rounded-xl bg-black/25 px-2 py-3 sm:grid sm:grid-cols-7">
        {RANKS.TIERS.map((tier, index) => {
          const reached = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li
              key={tier.name}
              aria-current={isCurrent ? "step" : undefined}
              className="flex flex-col items-center justify-end gap-1 text-center"
            >
              <RankEmblem
                rank={tier.name}
                size={isCurrent ? 56 : 38}
                dimmed={!reached}
                className={isCurrent ? "h-11 w-11 sm:h-14 sm:w-14" : "h-8 w-8 sm:h-10 sm:w-10"}
              />
              <span
                className={cn(
                  "text-[10px] font-medium sm:text-xs",
                  isCurrent ? "font-semibold text-text-primary" : "text-text-muted",
                )}
              >
                {tier.name}
              </span>
              {isCurrent && <span className="-mt-0.5 whitespace-nowrap text-[9px] text-accent-primary sm:text-[10px]">You are here</span>}
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        <ProgressBar value={progress.pct} />
        <div className="mt-2 flex justify-between text-sm text-text-secondary">
          <span>{next ? `${rating} / ${progress.next}` : `${rating}`}</span>
          <span className="text-text-muted">
            {next ? `${pointsLeft} points to next rank` : "Max rank"}
          </span>
        </div>
      </div>
    </section>
  );
}

export function NextGoalCard({ rating }: { rating: number }) {
  const current = getRankFromRating(rating);
  const progress = tierProgress(rating);
  const next = RANKS.TIERS[RANKS.TIERS.findIndex((t) => t.name === current.name) + 1];
  const pointsLeft = progress.pointsLeft;

  return (
    <section className="glass-panel flex flex-col p-5">
      <CardTitle icon={<TargetIcon />}>Next Goal</CardTitle>

      {next ? (
        <>
          <div className="flex flex-1 items-center gap-4">
            <RankEmblem rank={next.name} size={72} className="h-14 w-14 shrink-0 sm:h-[72px] sm:w-[72px]" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-bold sm:text-lg">Reach {next.name}</div>
              <p className="mt-1 text-sm text-text-secondary">
                Keep playing and improve your rating!
              </p>
            </div>
            <div className="shrink-0 border-l border-white/10 pl-4 text-center sm:hidden">
              <div className="font-display text-xl font-bold">{pointsLeft}</div>
              <div className="text-xs text-text-muted">points needed</div>
            </div>
          </div>
          <div className="mt-4 hidden sm:block">
            <ProgressBar value={progress.pct} />
            <div className="mt-2 flex justify-between text-sm text-text-secondary">
              <span>
                {rating} / {progress.next}
              </span>
              <span className="text-text-muted">{pointsLeft} points needed</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center gap-4">
          <RankEmblem rank={current.name} size={72} className="shrink-0" />
          <div>
            <div className="font-display text-lg font-bold">Top of the ladder</div>
            <p className="mt-1 text-sm text-text-secondary">You&apos;ve reached the highest rank.</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================
// Achievements (derived from stats — nothing stored)
// ============================================

type Achievement = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
};

function longestWinStreak(matches: PlayerMatchSummary[]): number {
  let best = 0;
  let run = 0;
  for (const m of matches) {
    run = m.result === "win" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function AchievementsCard({
  profile,
  matches,
  className,
}: {
  profile: PlayerStatsProfile;
  matches: PlayerMatchSummary[];
  className?: string;
}) {
  const silver = RANKS.TIERS[1];
  const rating = getBestRating(profile);

  const achievements: Achievement[] = [
    { id: "first-win", title: "First Win!", description: "Win your first match", current: profile.wins, target: 1 },
    {
      id: "streak",
      title: "5 Win Streak",
      description: "Win 5 in a row (recent matches)",
      current: longestWinStreak(matches),
      target: 5,
    },
    {
      id: "silver",
      title: `Reach ${silver.name}`,
      description: `Get to ${silver.minRating} rating`,
      current: rating,
      target: silver.minRating,
    },
  ];

  return (
    <section className={cn("glass-panel flex flex-col p-5", className)}>
      <CardTitle icon={<StarIcon />}>Achievements</CardTitle>
      <div className="grid flex-1 grid-cols-[1.4fr_1fr_1fr] gap-2 sm:grid-cols-3 sm:gap-3">
        {achievements.map((a) => {
          const done = a.current >= a.target;
          const pct = Math.min(100, (a.current / a.target) * 100);
          return (
            <div
              key={a.id}
              title={a.description}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center",
                done
                  ? "border-accent-warning/40 bg-accent-warning/10"
                  : "border-white/10 bg-black/25",
              )}
            >
              <div className="mb-1.5 flex h-10 w-10 items-center justify-center">
                {done ? (
                  <StarIcon className="h-9 w-9 fill-accent-warning/30 text-accent-warning" />
                ) : (
                  <LockIcon className="h-7 w-7 text-text-muted" />
                )}
              </div>
              <div className={cn("text-xs font-semibold sm:text-sm", done ? "text-text-primary" : "text-text-secondary")}>
                {a.title}
              </div>
              <div
                className={cn(
                  "mt-0.5 text-[10px] leading-tight text-text-muted sm:block sm:text-[11px]",
                  done ? "block" : "hidden",
                )}
              >
                {a.description}
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full", done ? "bg-accent-warning" : "bg-accent-primary")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================
// Recent matches
// ============================================

const ROW_COLS =
  "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.7fr)_5rem_5.5rem_5rem_7rem]";

function opponentName(match: PlayerMatchSummary): string {
  if (match.isBotMatch) {
    const d = match.botDifficulty;
    return d ? `${d.charAt(0).toUpperCase()}${d.slice(1)} Bot` : "Bot";
  }
  return match.opponentDisplayName || match.opponentUsername || "Unknown Player";
}

function formatRatingDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function RecentMatchesCard({ matches }: { matches: PlayerMatchSummary[] }) {
  return (
    <section className="glass-panel p-5">
      <CardTitle
        icon={<ClockIcon />}
        aside={
          <span className="hidden text-right text-xs text-accent-primary sm:block">
            Replays kept for last 3 matches
          </span>
        }
      >
        Recent Matches
      </CardTitle>

      {matches.length === 0 ? (
        <div className="rounded-xl bg-black/25 px-4 py-6 text-center text-sm text-text-muted">
          No matches yet.{" "}
          <Link href={ROUTES.PLAY} className="text-accent-primary hover:underline">
            Play your first match
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-black/25">
          <div className={cn("hidden gap-3 px-4 py-2.5 text-xs text-text-muted md:grid", ROW_COLS)}>
            <span>Opponent</span>
            <span>Mode</span>
            <span className="text-center">Result</span>
            <span className="text-center">Rating Change</span>
            <span>Date</span>
            <span>Replay</span>
          </div>
          <ul className="divide-y divide-white/5 border-t border-white/5">
            {matches.map((match) => (
              <MatchRow key={match.matchId} match={match} />
            ))}
          </ul>
        </div>
      )}
      {matches.length > 0 && (
        <p className="mt-3 text-center text-xs text-accent-primary sm:hidden">
          Replays kept for last 3 matches
        </p>
      )}
    </section>
  );
}

function MatchRow({ match }: { match: PlayerMatchSummary }) {
  const name = opponentName(match);
  const showHandle =
    !match.isBotMatch && match.opponentUsername && match.opponentDisplayName;

  const delta = (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        match.ratingChange > 0 && "text-accent-success",
        match.ratingChange < 0 && "text-accent-error",
        match.ratingChange === 0 && "text-text-secondary",
      )}
    >
      {formatRatingDelta(match.ratingChange)}
    </span>
  );

  const replay =
    match.hasReplay !== false ? (
      <Link
        href={ROUTES.REPLAY(match.matchId)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-primary hover:underline"
      >
        <PlayCircleIcon className="h-5 w-5" />
        Replay
      </Link>
    ) : (
      <span
        className="inline-flex items-center gap-1.5 text-sm text-text-muted"
        title="Only your last 3 match replays are stored"
      >
        <XCircleIcon className="h-5 w-5" />
        No replay
      </span>
    );

  const avatar = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-text-secondary">
      {match.isBotMatch ? <span className="text-base">🤖</span> : <UserIcon className="h-4 w-4" />}
    </span>
  );
  const nameBlock = (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium">{name}</div>
      {showHandle && <div className="truncate text-xs text-text-muted">@{match.opponentUsername}</div>}
    </div>
  );

  const chips = (phone: boolean) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {!phone && match.isBotMatch && match.botDifficulty && (
        <Chip className="bg-accent-primary/20 text-accent-primary capitalize">{match.botDifficulty}</Chip>
      )}
      <Chip
        className={
          match.isRanked
            ? "border border-accent-primary/40 bg-accent-primary/15 text-accent-primary"
            : "bg-white/10 text-text-secondary"
        }
      >
        {match.isRanked ? "Ranked" : match.isBotMatch ? "Practice" : "Casual"}
      </Chip>
      <Chip className="bg-white/10 text-text-secondary">{getChallengeModeLabel(match.mode)}</Chip>
    </div>
  );

  return (
    <li>
      {/* Desktop: table row */}
      <div className={cn("hidden items-center gap-3 px-4 py-3 md:grid", ROW_COLS)}>
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          {nameBlock}
        </div>
        {chips(false)}
        <div className="text-center">
          <ResultPill result={match.result} />
        </div>
        <div className="text-center">{delta}</div>
        <span className="text-sm text-text-secondary">{formatRelativeTime(match.createdAt)}</span>
        {replay}
      </div>

      {/* Phones: two-line row — name + chips, result + delta/date, replay icon */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 md:hidden">
        {avatar}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="truncate text-sm font-medium">{name}</div>
          {chips(true)}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ResultPill result={match.result} />
          <div className="flex items-center gap-2 text-xs">
            {delta}
            <span className="text-text-secondary">{formatRelativeTime(match.createdAt)}</span>
          </div>
        </div>
        {match.hasReplay !== false ? (
          <Link
            href={ROUTES.REPLAY(match.matchId)}
            aria-label="Watch replay"
            className="shrink-0 text-accent-primary"
          >
            <PlayCircleIcon className="h-6 w-6" />
          </Link>
        ) : (
          <span className="shrink-0 text-text-muted" title="No replay stored">
            <XCircleIcon className="h-6 w-6" />
          </span>
        )}
      </div>
    </li>
  );
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs", className)}>
      {children}
    </span>
  );
}

function ResultPill({ result }: { result: "win" | "loss" | "draw" }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[3.75rem] justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide sm:min-w-[4.25rem] sm:px-3 sm:py-1 sm:text-xs",
        result === "win" && "border-accent-success/30 bg-accent-success/15 text-accent-success",
        result === "loss" && "border-accent-error/30 bg-accent-error/15 text-accent-error",
        result === "draw" && "border-white/15 bg-white/10 text-text-secondary",
      )}
    >
      {result}
    </span>
  );
}
