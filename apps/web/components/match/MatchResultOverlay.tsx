"use client";

/**
 * MatchResultOverlay
 * Full-screen victory / defeat / draw presentation shown when a match ends.
 * Purely presentational — the page supplies the players, share panel and
 * action buttons.
 *
 * Desktop: result art (banner, board, ELO) on the left, match details and
 * actions on the right. Phones: the same pieces in one column.
 *
 * Rendered in a portal on <body>: pages that draw a backdrop use `isolate`, which
 * would otherwise trap this overlay's z-index below the sticky nav.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/helpers";
import { ROUTES } from "@/lib/constants";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
import { InfinityMark } from "@/components/ui/InfinityMark";
import { RankEmblem } from "@/components/ui/RankEmblem";

export type MatchOutcome = "win" | "loss" | "draw";

/** One side of the match, as shown in the "You vs Opponent" panel. */
export interface ResultPlayer {
  name: string;
  /** Rank tier name, e.g. "Gold". Omitted for bots. */
  rankName?: string;
  rankColor?: string;
  /** Short descriptor shown instead of a rank, e.g. "Easy" for a bot. */
  tag?: string;
  rating?: number;
  /** Rating delta from this match, when the server reported one. */
  ratingChange?: number | null;
  isBot?: boolean;
}

export interface MatchResultOverlayProps {
  outcome: MatchOutcome;
  subtitle: string;
  /** Rating delta for the local player, when the server reported one. */
  ratingChange?: number | null;
  duration: string;
  moves: number;
  youPlayed: string;
  you?: ResultPlayer;
  opponent?: ResultPlayer;
  /** Secondary content under the stats (share panel, notes). */
  children?: React.ReactNode;
  /** Primary buttons, shown last in the details column. */
  actions?: React.ReactNode;
}

const HEADLINE = {
  win: { src: "/assets/victory.png", alt: "Victory", w: 320, h: 112 },
  loss: { src: "/assets/defeat.png", alt: "Defeat", w: 320, h: 112 },
} as const;

/**
 * Warms the browser cache with the result screen's images while the match is
 * being played, so the result appears instantly instead of popping in. Uses the
 * same <Image> props as the overlay so the optimized URLs match.
 */
export function MatchResultPreload() {
  return (
    <div aria-hidden="true" className="hidden">
      <Image src="/assets/resultBg.jpg" alt="" fill sizes="100vw" loading="eager" />
      {(["win", "loss"] as const).map((o) => (
        <Image
          key={o}
          src={HEADLINE[o].src}
          alt=""
          width={HEADLINE[o].w}
          height={HEADLINE[o].h}
          loading="eager"
        />
      ))}
      <Image src="/assets/Board_win_800px.png" alt="" width={800} height={800} loading="eager" />
      <Image src="/assets/Board_loss_800px.png" alt="" width={800} height={800} loading="eager" />
    </div>
  );
}

export function MatchResultOverlay({
  outcome,
  subtitle,
  ratingChange,
  duration,
  moves,
  youPlayed,
  you,
  opponent,
  children,
  actions,
}: MatchResultOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Move focus into the dialog so keyboard/screen-reader users land on the result,
  // and stop the page behind it from scrolling while it is open.
  useEffect(() => {
    if (!mounted) return;
    dialogRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  if (!mounted) return null;

  const boardSrc =
    outcome === "win"
      ? "/assets/Board_win_800px.png"
      : outcome === "loss"
        ? "/assets/Board_loss_800px.png"
        : "/assets/board.png";

  const headline = outcome === "draw" ? null : HEADLINE[outcome];

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={outcome === "win" ? "Victory" : outcome === "loss" ? "Defeat" : "Draw"}
      tabIndex={-1}
      className="space-scope fixed inset-0 z-[60] isolate overflow-y-auto overscroll-contain outline-none"
    >
      <ScreenBackdrop image="resultBg" dim={0.25} />

      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-4 sm:px-8 sm:py-5">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 font-display text-lg font-bold sm:text-xl"
          >
            <InfinityMark className="h-4 w-7 text-playerO-primary" />
            <span className="text-text-primary">
              Infinite <span className="text-accent-primary">TTT</span>
            </span>
          </Link>
          <Link
            href={ROUTES.HOME}
            className="glass-panel hidden items-center gap-2 !rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary sm:inline-flex"
          >
            <span aria-hidden="true">←</span> Back to Home
          </Link>
        </header>

        <div className="flex flex-1 items-center py-3 sm:py-4">
          <div className="grid w-full items-center gap-x-12 gap-y-3 text-center lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Result art */}
            <div className="flex flex-col items-center">
              {headline ? (
                <Image
                  src={headline.src}
                  alt={headline.alt}
                  width={headline.w}
                  height={headline.h}
                  priority
                  className="h-auto w-56 sm:w-72 lg:w-80 drop-shadow-[0_0_28px_rgba(251,191,36,0.4)]"
                />
              ) : (
                <h2 className="font-display text-4xl font-bold uppercase tracking-wide text-text-secondary sm:text-5xl">
                  Draw
                </h2>
              )}
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.3em] text-text-secondary sm:text-xs">
                {subtitle}
              </p>

              {/* Sized by viewport height too, so the art never pushes the actions off-screen. */}
              <Image
                src={boardSrc}
                alt=""
                width={800}
                height={800}
                className={cn(
                  "my-1 h-auto w-[min(12rem,21vh)] sm:w-[min(16rem,30vh)] lg:w-[min(19rem,38vh)]",
                  outcome === "loss" && "opacity-80",
                )}
              />

              {typeof ratingChange === "number" && ratingChange !== 0 && (
                <p
                  className={cn(
                    "flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl",
                    ratingChange > 0 ? "text-accent-success" : "text-accent-error",
                  )}
                >
                  {ratingChange > 0 ? "+" : ""}
                  {ratingChange} ELO
                  <Chevrons down={ratingChange < 0} />
                </p>
              )}
              <p className="mt-1 text-xs italic tracking-wider text-text-muted sm:text-sm">
                &ldquo;Small moves. Infinite possibilities.&rdquo;
              </p>
            </div>

            {/* Match details + actions */}
            <div className="flex w-full flex-col gap-2.5 sm:gap-3">
              {you && opponent && (
                <div className="glass-panel grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-3 text-left sm:gap-4 sm:px-5">
                  <PlayerSide label="You" player={you} />
                  <span className="font-display text-base font-bold text-text-muted sm:text-lg">VS</span>
                  <PlayerSide label={opponent.isBot ? "Bot" : "Opponent"} player={opponent} />
                </div>
              )}

              <dl className="glass-panel grid w-full grid-cols-3 divide-x divide-white/10 py-3">
                <Stat icon={<PawnIcon />} label="Moves" value={String(moves)} />
                <Stat icon={<StopwatchIcon />} label="Match Duration" value={duration} />
                <Stat icon={<CrossIcon />} label="You Played" value={youPlayed} />
              </dl>

              {children}
              {actions}
            </div>
          </div>
        </div>

        <footer className="pt-1 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-text-muted sm:text-xs lg:text-right">
          Play <span aria-hidden="true">•</span> Improve <span aria-hidden="true">•</span> Dominate
        </footer>
      </div>
    </div>,
    document.body,
  );
}

// ============================================
// Pieces
// ============================================

function PlayerSide({ label, player }: { label: string; player: ResultPlayer }) {
  const isBot = !!player.isBot;
  const change = player.ratingChange;

  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div
        aria-hidden="true"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold sm:h-14 sm:w-14 sm:text-xl",
          isBot
            ? "border-playerO-primary bg-playerO-primary/10 shadow-[0_0_16px_rgba(34,211,238,0.4)]"
            : "border-accent-primary bg-gradient-to-br from-accent-primary/40 to-playerO-primary/30 shadow-[0_0_16px_rgba(168,85,247,0.5)]",
        )}
      >
        {isBot ? <span className="text-xl sm:text-2xl">🤖</span> : player.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 leading-tight">
        <div
          className={cn(
            "text-[11px] font-medium sm:text-xs",
            isBot ? "text-playerO-primary" : "text-accent-primary",
          )}
        >
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-text-primary sm:text-base">
          {player.name}
        </div>
        {player.rankName ? (
          <div
            className="mt-0.5 flex items-center gap-1 text-xs font-medium"
            style={{ color: player.rankColor }}
          >
            <RankEmblem rank={player.rankName} size={16} />
            {player.rankName}
          </div>
        ) : player.tag ? (
          <div className="mt-0.5 text-xs text-text-secondary">{player.tag}</div>
        ) : null}
        {typeof player.rating === "number" && (
          <div className="mt-0.5 text-sm font-semibold text-text-primary sm:text-base">
            {player.rating}
            {typeof change === "number" && change !== 0 && (
              <span
                className={cn(
                  "ml-1 text-xs font-medium sm:text-sm",
                  change > 0 ? "text-accent-success" : "text-accent-error",
                )}
              >
                ({change > 0 ? "+" : ""}
                {change})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center px-2">
      <div aria-hidden="true" className="mb-0.5 h-5 w-5 text-text-secondary sm:h-6 sm:w-6">
        {icon}
      </div>
      <dd className="font-display text-xl font-bold leading-tight text-text-primary sm:text-2xl">
        {value}
      </dd>
      <dt className="text-xs text-text-muted">{label}</dt>
    </div>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-full w-full",
} as const;

function PawnIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="6.5" r="2.7" />
      <path d="M9.5 21h5M10 21c.2-3 .6-5.2 1-7h2c.4 1.8.8 4 1 7M9 13.5h6" />
    </svg>
  );
}

function StopwatchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V9.5M9.5 3h5M12 3v3.5M18 6.5l1.3-1.3" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function Chevrons({ down }: { down: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-6 w-6", down && "rotate-180")}
    >
      <path d="M6 11l6-6 6 6M6 19l6-6 6 6" />
    </svg>
  );
}
