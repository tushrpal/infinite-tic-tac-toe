"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/helpers";
import { useIsDesktop } from "@/hooks/useResponsive";

/**
 * Lightweight stand-in for the 3D hero: the tilted board and a few floating
 * rocks, using only static assets. Shown first (so the hero paints instantly),
 * and kept for users/devices where the WebGL scene is a bad fit — reduced
 * motion, no WebGL, low-end hardware, data saver.
 *
 * It reacts to scroll with transform-only motion (scale / tilt / drift), which
 * the browser composites on the GPU, echoing the 3D camera push-in. Positioning
 * lives on plain wrapper elements and the scroll motion on inner `motion.div`s,
 * because framer-motion's inline `transform` would override Tailwind's
 * translate-based centering if they shared an element.
 */
export function HomeStaticScene({
  scrollProgress,
  animateOnScroll = true,
  hidden = false,
}: {
  scrollProgress: MotionValue<number>;
  /** Off for reduced-motion users: the poster then stays still. */
  animateOnScroll?: boolean;
  hidden?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const on = animateOnScroll;

  // Board: pushes in, straightens a little and drifts as the hero scrolls. The
  // hero stays pinned for roughly the first 60% of the progress range, so the
  // motion completes by then and is fully seen before the hero scrolls away.
  const PIN_END = 0.6;
  const boardScale = useTransform(scrollProgress, [0, PIN_END], [1, on ? (isDesktop ? 1.35 : 1.4) : 1]);
  const boardRotate = useTransform(scrollProgress, [0, PIN_END], [0, on ? -9 : 0]);
  const boardX = useTransform(scrollProgress, [0, PIN_END], [0, on && isDesktop ? -60 : 0]);
  const boardY = useTransform(scrollProgress, [0, PIN_END], [0, on ? (isDesktop ? 20 : -300) : 0]);

  // Rocks drift at different speeds for parallax depth.
  const rockOneY = useTransform(scrollProgress, [0, 1], [0, on ? -170 : 0]);
  const rockOneRotate = useTransform(scrollProgress, [0, 1], [0, on ? 50 : 0]);
  const rockTwoY = useTransform(scrollProgress, [0, 1], [0, on ? -90 : 0]);
  const rockTwoRotate = useTransform(scrollProgress, [0, 1], [0, on ? -35 : 0]);

  // Glow behind the board builds as it gets closer.
  const glowOpacity = useTransform(scrollProgress, [0, PIN_END], [0.5, on ? 1 : 0.5]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-300",
        hidden && "opacity-0",
      )}
    >
      <div className="absolute left-1/2 top-[76%] w-[64vw] max-w-[360px] -translate-x-1/2 lg:left-auto lg:right-[7%] lg:top-1/2 lg:w-[38vw] lg:max-w-[600px] lg:-translate-y-1/2 lg:translate-x-0">
        <motion.div
          style={{ scale: boardScale, rotate: boardRotate, x: boardX, y: boardY }}
          className="relative will-change-transform"
        >
          <motion.div
            style={{ opacity: glowOpacity }}
            className="absolute inset-[-14%] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.6)_0%,rgba(168,85,247,0)_65%)]"
          />
          <Image
            src="/assets/board.png"
            alt=""
            width={600}
            height={600}
            priority
            sizes="(min-width: 1024px) 600px, 360px"
            className="relative h-auto w-full motion-safe:animate-float"
          />
        </motion.div>
      </div>

      <motion.div
        style={{ y: rockOneY, rotate: rockOneRotate }}
        className="absolute right-[6%] top-[16%] w-12 will-change-transform lg:right-[3%] lg:w-16"
      >
        <Image
          src="/assets/rock1.png"
          alt=""
          width={100}
          height={100}
          className="h-auto w-full opacity-80 motion-safe:animate-float [animation-delay:-2s]"
        />
      </motion.div>
      <motion.div
        style={{ y: rockTwoY, rotate: rockTwoRotate }}
        className="absolute bottom-[14%] left-[6%] w-10 will-change-transform lg:left-[46%] lg:w-14"
      >
        <Image
          src="/assets/rock2.png"
          alt=""
          width={100}
          height={100}
          className="h-auto w-full opacity-70 motion-safe:animate-float [animation-delay:-4s]"
        />
      </motion.div>
    </div>
  );
}
