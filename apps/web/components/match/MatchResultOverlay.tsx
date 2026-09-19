"use client";

/**
 * MatchResultOverlay
 * Full-screen victory / defeat / draw presentation shown when a match ends.
 * Purely presentational — the page supplies the rematch/share/actions as children.
 *
 * Rendered in a portal on <body>: pages that draw a backdrop use `isolate`, which
 * would otherwise trap this overlay's z-index below the sticky nav.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/helpers";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";

export type MatchOutcome = "win" | "loss" | "draw";

export interface MatchResultOverlayProps {
  outcome: MatchOutcome;
  subtitle: string;
  /** Rating delta for the local player, when the server reported one. */
  ratingChange?: number | null;
  duration: string;
  moves: number;
  youPlayed: string;
  children?: React.ReactNode;
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
  children,
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

      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center px-4 py-8 text-center sm:py-12">
        {headline ? (
          <Image
            src={headline.src}
            alt={headline.alt}
            width={headline.w}
            height={headline.h}
            priority
            className="mb-2 h-auto w-64 sm:w-80 drop-shadow-[0_0_24px_rgba(251,191,36,0.35)]"
          />
        ) : (
          <h2 className="mb-2 font-display text-5xl font-bold uppercase tracking-wide text-text-secondary">
            Draw
          </h2>
        )}
        <p className="text-text-secondary">{subtitle}</p>

        <Image
          src={boardSrc}
          alt=""
          width={800}
          height={800}
          className={cn(
            "my-2 h-auto w-56 sm:w-72",
            outcome === "loss" && "opacity-80",
          )}
        />

        {typeof ratingChange === "number" && ratingChange !== 0 && (
          <p
            className={cn(
              "mb-4 font-display text-3xl font-bold",
              ratingChange > 0 ? "text-accent-success" : "text-accent-error",
            )}
          >
            {ratingChange > 0 ? "+" : ""}
            {ratingChange} ELO
          </p>
        )}

        <dl className="glass-panel mb-6 grid w-full grid-cols-3 divide-x divide-white/10 py-4">
          <Stat label="Moves" value={String(moves)} />
          <Stat label="Match Duration" value={duration} />
          <Stat label="You Played" value={youPlayed} />
        </dl>

        <div className="w-full">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <dd className="font-display text-2xl font-bold text-text-primary">{value}</dd>
      <dt className="text-xs text-text-muted">{label}</dt>
    </div>
  );
}
