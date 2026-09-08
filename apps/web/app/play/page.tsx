import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { PrivateMatchCard } from "@/components/challenges/PrivateMatchCard";
import { getOnlineModeInfo } from "@/lib/gameModes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import type { GameMode } from "@/ws/types";

export const metadata = buildPageMetadata({
  title: "Play",
  description:
    "Choose how to play Infinite Tic-Tac-Toe — ranked matchmaking, online quick play, practice vs AI bots, local 2-player, or private rooms with friends.",
  path: PUBLIC_ROUTES.play,
  keywords: [
    ...KEYWORD_CLUSTERS.primary,
    ...KEYWORD_CLUSTERS.competitive,
    ...KEYWORD_CLUSTERS.social,
    ...KEYWORD_CLUSTERS.practice,
  ],
});

export default function PlayPage() {
  const sliding = getOnlineModeInfo("MODE_1");
  const expanding = getOnlineModeInfo("MODE_2");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Link
            href={ROUTES.HOME}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl sm:text-4xl font-display font-bold mb-4">
            Select Game Mode
          </h1>
          <p className="text-text-secondary">Choose how you want to play</p>
        </div>

        {/* Play Now */}
        <PlaySection title="Play Now">
          <GameModeCard
            href={ROUTES.PLAY_ONLINE}
            title="Online Quick Play"
            description="Jump into a casual match against a random opponent"
            icon={<OnlineIcon />}
            badge="Online"
            badgeColor="text-accent-success"
          />
          <GameModeCard
            href={ROUTES.PLAY_RANKED}
            title="Ranked Match"
            description="Compete for ranking points and climb the leaderboard"
            icon={<RankedIcon />}
            badge="Competitive"
            badgeColor="text-accent-warning"
          />
        </PlaySection>

        {/* Play with Others */}
        <PlaySection title="Play with Others" className="mt-8">
          <GameModeCard
            href={ROUTES.PLAY_ROOMS}
            title="Play with Friends"
            description="Create a room and play multiple games with friends"
            icon={<RoomsIcon />}
            badge="Social"
            badgeColor="text-purple-400"
          />
          <PrivateMatchCard />
          <GameModeCard
            href={ROUTES.PLAY_LOCAL}
            title="Local Play"
            description="Play against a friend on the same device"
            icon={<LocalIcon />}
            badge="Offline"
          />
        </PlaySection>

        {/* Learn */}
        <PlaySection title="Learn" className="mt-8">
          <GameModeCard
            href={ROUTES.PLAY_PRACTICE}
            title="Practice Mode"
            description="Unranked bot matches with difficulty selection — perfect for learning"
            icon={<PracticeIcon />}
            badge="Unranked"
            badgeColor="text-blue-400"
          />
          <GameModeCard
            href={ROUTES.HOW_TO_PLAY}
            title="How to Play"
            description="Interactive tutorial covering rules and strategy"
            icon={<TutorialIcon />}
            badge="Guide"
            badgeColor="text-accent-primary"
          />
        </PlaySection>

        {/* Info Section */}
        <div className="mt-12 p-6 rounded-xl bg-surface-elevated border border-board-grid">
          <h3 className="font-semibold mb-3">Online Game Modes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <ModeInfoCard mode="MODE_1" info={sliding} />
            <ModeInfoCard mode="MODE_2" info={expanding} />
          </div>
        </div>
      </div>
    </main>
  );
}

function PlaySection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function ModeInfoCard({
  mode,
  info,
}: {
  mode: GameMode;
  info: ReturnType<typeof getOnlineModeInfo>;
}) {
  return (
    <div>
      <span
        className={
          mode === "MODE_1"
            ? "text-playerX-primary font-semibold"
            : "text-playerO-primary font-semibold"
        }
      >
        {info.icon} {info.label}
      </span>
      <p className="text-text-secondary mt-1">{info.longDescription}</p>
    </div>
  );
}

// Game Mode Card Component
function GameModeCard({
  href,
  title,
  description,
  icon,
  badge,
  badgeColor = "text-text-muted",
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Link href={href as any} className="block group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-surface-elevated border border-board-grid hover:border-accent-primary/50 transition-all hover:shadow-lg hover:shadow-accent-primary/5">
        <div className="flex items-center gap-4 sm:contents">
          <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
            {icon}
          </div>
          <div className="flex-1 min-w-0 sm:order-none">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg sm:text-xl font-semibold group-hover:text-accent-primary transition-colors">
                {title}
              </h2>
              {badge && (
                <span className={`text-xs font-medium ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
          <div className="hidden sm:flex flex-shrink-0 text-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all">
            <ArrowIcon />
          </div>
        </div>
      </div>
    </Link>
  );
}

function LocalIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function RankedIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function TutorialIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
