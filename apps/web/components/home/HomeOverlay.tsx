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
      <motion.span
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-4 py-1.5 text-xs font-medium tracking-widest text-accent-secondary"
      >
        THE BOARD NEVER STAYS STILL
      </motion.span>

      <motion.h1
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl"
      >
        <span className="bg-gradient-to-r from-accent-primary via-[#C084FC] to-accent-secondary bg-clip-text text-transparent">
          Infinite
        </span>
        <br />
        <span className="text-text-primary">Tic-Tac-Toe</span>
      </motion.h1>

      <motion.p
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-5 max-w-lg text-lg text-text-secondary"
      >
        A strategic twist on the classic game. Make your move, adapt, and
        outplay in an infinite battle.
      </motion.p>

      <motion.div
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="pointer-events-auto mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
      >
        <Link href={ROUTES.PLAY}>
          <Button size="lg" className="min-w-[200px] shadow-glow-accent">
            Play Now
          </Button>
        </Link>
        <Link href={ROUTES.LEADERBOARD}>
          <Button variant="secondary" size="lg" className="min-w-[200px]">
            View Leaderboard
          </Button>
        </Link>
      </motion.div>
    </div>
    </motion.div>
  );
}
