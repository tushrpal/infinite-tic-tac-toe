import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { PrivateMatchCard } from "@/components/challenges/PrivateMatchCard";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
import { getOnlineModeInfo } from "@/lib/gameModes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import type { GameMode } from "@/ws/types";

export const metadata = buildPageMetadata({
  title: "Play",
  description:
    "Choose how to play Infinite Tic-Tac-Toe — ranked matchmaking, online quick play, practice vs AI bots, 2-player on one device, or private rooms with friends.",
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
    <main className="space-scope relative isolate flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
      <ScreenBackdrop image="playBg" dim={0.45} />
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
            Choose Your Battle
          </h1>
          <p className="text-text-secondary">
            Different ways to play. Same infinite fun.
          </p>
        </div>

        {/* Play Now */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureModeCard
            href={ROUTES.PLAY_ONLINE}
            title="Quick Play"
            description="Find a random opponent and start playing instantly."
            icon={<LightningIcon />}
            badge="Online"
            cta="Play Now"
            tone="purple"
          />
          <FeatureModeCard
            href={ROUTES.PLAY_RANKED}
            title="Ranked Match"
            description="Compete for ranking points and climb the leaderboard."
            icon={<TrophyIcon />}
            badge="Competitive"
            cta="Find Match"
            tone="gold"
          />
        </div>

        {/* Play with Others */}
        <PlaySection title="More Ways to Play" className="mt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <GameModeCard
              href={ROUTES.PLAY_ROOMS}
              title="Play with Friends"
              description="Create a room and challenge your friends."
              icon={<RoomsIcon />}
              cta="Create Room"
            />
            <PrivateMatchCard />
            <GameModeCard
              href={ROUTES.PLAY_LOCAL}
              title="2 Players, One Device"
              description="Play on the same device with a friend."
              icon={<LocalIcon />}
              cta="Play Now"
            />
          </div>
        </PlaySection>

        {/* Learn */}
        <PlaySection title="Learn & Practice" className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <GameModeCard
              href={ROUTES.PLAY_PRACTICE}
              title="Practice Mode"
              description="Sharpen your skills against AI bots."
              icon={<PracticeIcon />}
              cta="Start Practice"
              layout="row"
            />
            <GameModeCard
              href={ROUTES.HOW_TO_PLAY}
              title="How to Play"
              description="Learn the rules, modes and strategies."
              icon={<TutorialIcon />}
              cta="View Guide"
              layout="row"
            />
          </div>
        </PlaySection>

        {/* Info Section */}
        <div className="mt-10 p-5 sm:p-6 glass-panel">
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
      <h2 className="text-sm font-semibold text-text-secondary mb-3">{title}</h2>
      {children}
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

// Large hero card for the two primary queues (Quick Play / Ranked)
function FeatureModeCard({
  href,
  title,
  description,
  icon,
  badge,
  cta,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  cta: string;
  tone: "purple" | "gold";
}) {
  const isGold = tone === "gold";
  return (
    <Link href={href as any} className="block group">
      <div
        className={`glass-panel glass-panel--interactive h-full p-6 sm:p-7 text-center ${
          isGold ? "glass-panel--gold" : ""
        }`}
      >
        <div
          className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
            isGold
              ? "bg-accent-warning/15 text-accent-warning"
              : "bg-accent-primary/20 text-accent-primary"
          }`}
        >
          {icon}
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold">{title}</h2>
        <span
          className={`mt-1 inline-block text-xs font-medium ${
            isGold ? "text-accent-warning" : "text-accent-success"
          }`}
        >
          {badge}
        </span>
        <p className="mt-3 mb-5 text-sm text-text-secondary">{description}</p>
        <span
          className={`inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-lg px-6 font-medium text-white transition-all group-hover:brightness-110 ${
            isGold
              ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25"
              : "bg-gradient-to-r from-accent-primary to-[#7c3aed] shadow-lg shadow-accent-primary/30"
          }`}
        >
          {cta} <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

// Compact card used for secondary modes
function GameModeCard({
  href,
  title,
  description,
  icon,
  cta,
  layout = "column",
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
  layout?: "column" | "row";
}) {
  const isRow = layout === "row";
  return (
    <Link href={href as any} className="block group h-full">
      <div
        className={`glass-panel glass-panel--interactive h-full p-4 sm:p-5 ${
          isRow ? "flex items-center gap-4" : "flex flex-col items-center text-center"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary transition-colors group-hover:bg-accent-primary/25 ${
            isRow ? "" : "mb-3"
          }`}
        >
          {icon}
        </div>
        <div className={isRow ? "flex-1 min-w-0" : "w-full"}>
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 mb-3 text-xs text-text-secondary">{description}</p>
          <span className="inline-flex h-8 w-full items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-medium text-text-primary transition-colors group-hover:border-accent-primary/50 group-hover:bg-accent-primary/10">
            {cta}
          </span>
        </div>
      </div>
    </Link>
  );
}

function LightningIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 21h8m-4-4v4m-5-18h10v6a5 5 0 01-10 0V3zm10 2h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
    </svg>
  );
}

function LocalIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6M3 10a3 3 0 106 0" />
    </svg>
  );
}

function TutorialIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
