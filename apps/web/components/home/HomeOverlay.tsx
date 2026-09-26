"use client";

import { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/helpers";

/**
 * HTML/UI layer for the home hero. Rendered on top of the 3D canvas; only
 * the CTA buttons capture pointer events, everything else lets clicks pass
 * through to the scene behind it. Fades out as the user scrolls into the
 * cinematic camera move so the board can take over as the focal point.
 */
export function HomeOverlay({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const reducedMotion = useReducedMotion();
  const initial = reducedMotion ? false : { opacity: 0, y: 16 };

  const scrollOpacity = useTransform(scrollProgress, [0, 0.32], [1, 0]);
  const scrollY = useTransform(scrollProgress, [0, 0.32], [0, reducedMotion ? 0 : -30]);

  // Once fully faded, remove from layout/tab order entirely rather than
  // leaving invisible-but-focusable buttons behind.
  const [isPastHero, setIsPastHero] = useState(false);
  useMotionValueEvent(scrollProgress, "change", (value) => {
    setIsPastHero(value > 0.4);
  });

  return (
    <motion.div
      style={{ opacity: scrollOpacity, y: scrollY }}
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-start px-6 pt-24 text-center sm:pt-28 lg:items-start lg:justify-center lg:px-16 lg:pt-0 lg:text-left",
        isPastHero && "hidden",
      )}
    >
    <div className="max-w-xl lg:max-w-lg">
      <motion.p
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-4 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.35em] text-text-secondary"
      >
        The board
        <br />
        never stays still
      </motion.p>

      {/*
        Deliberately NOT a `motion.h1`. framer-motion's `initial` prop is
        serialized into the SSR HTML as `style="opacity:0"`, which shipped our
        most important heading to crawlers as hidden text. The entrance is a
        CSS keyframe (`.hero-rise`) instead, so the served markup is clean.

        The qualifier line is part of the <h1> on purpose: the title tag
        promises "Play Online Free" and the heading needs to back that up,
        rather than repeating the brand name on its own.
      */}
      <h1
        className="hero-rise font-display uppercase leading-[1.02] tracking-tight"
        style={{ animationDelay: "0.1s" }}
      >
        <span className="block text-5xl font-bold sm:text-6xl md:text-7xl">
          <span className="text-text-primary">Infinite</span>
          <br />
          <span className="bg-gradient-to-r from-accent-primary via-[#C084FC] to-playerX-primary bg-clip-text text-transparent">
            Tic-Tac-Toe
          </span>
        </span>
        <span className="mt-3 block text-sm font-semibold tracking-[0.2em] text-text-secondary sm:text-base">
          Free Online Multiplayer
        </span>
      </h1>

      <motion.p
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-5 max-w-sm text-base text-text-secondary sm:text-lg"
      >
        A strategic twist on the classic game. Make your move, adapt, and
        outplay in an infinite battle.
      </motion.p>

      <motion.div
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="pointer-events-auto mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
      >
        <Link href={ROUTES.PLAY}>
          <Button
            size="lg"
            className="min-w-[180px] bg-gradient-to-r from-accent-primary to-[#7c3aed] shadow-glow-accent"
            rightIcon={<span aria-hidden="true">→</span>}
          >
            Play Now
          </Button>
        </Link>
        <Link href={ROUTES.LEADERBOARD}>
          <Button
            variant="secondary"
            size="lg"
            className="min-w-[180px] border-white/15 bg-white/10 hover:bg-white/15"
          >
            View Leaderboard
          </Button>
        </Link>
      </motion.div>

      <motion.dl
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-10 flex justify-center gap-8 lg:justify-start"
      >
        {[
          ["10K+", "Players"],
          ["50K+", "Matches"],
          ["4.8 ★", "Rating"],
        ].map(([value, label]) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="font-display text-2xl font-bold text-text-primary">{value}</dd>
          </div>
        ))}
      </motion.dl>
    </div>

    <p
      aria-hidden="true"
      className="absolute bottom-16 right-10 hidden -rotate-6 text-right font-display text-lg font-semibold uppercase leading-tight tracking-widest text-accent-primary/70 xl:block"
    >
      Adapt
      <br />
      Strategize
      <br />
      Outplay
      <br />
      Repeat
    </p>
    </motion.div>
  );
}
