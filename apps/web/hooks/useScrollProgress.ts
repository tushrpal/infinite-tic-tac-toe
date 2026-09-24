"use client";

import { useRef, type MutableRefObject, type RefObject } from "react";
import {
  useMotionValueEvent,
  useScroll,
  useSpring,
  type MotionValue,
} from "framer-motion";

export interface ScrollProgress {
  /** Smoothed 0-1 motion value, for driving HTML/framer-motion styles. */
  scrollYProgress: MotionValue<number>;
  /**
   * Same value mirrored into a plain ref, so the Three.js render loop
   * (useFrame) can read it every frame without triggering React re-renders.
   */
  progressRef: MutableRefObject<number>;
}

/**
 * Tracks scroll progress across `target`'s height (from the moment its top
 * hits the viewport top, to the moment its bottom does). Used to drive the
 * scroll-scrubbed camera/board/rocks choreography in the home hero.
 */
export function useScrollProgress(
  target: RefObject<HTMLElement>,
): ScrollProgress {
  const progressRef = useRef(0);
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end start"],
  });
  // Snappier than the default: tracks the finger closely and settles quickly
  // after lift so the hero doesn't keep "swimming" on mid-range GPUs.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 32,
    mass: 0.35,
  });

  useMotionValueEvent(smoothProgress, "change", (value) => {
    progressRef.current = value;
  });

  return { scrollYProgress: smoothProgress, progressRef };
}
