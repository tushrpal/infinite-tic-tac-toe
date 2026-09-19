"use client";

import { useRef } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useIntersectionObserver } from "@/hooks/usePerformance";
import { HomeBackdrop } from "./HomeBackdrop";
import { HomeSceneLoader } from "./HomeSceneLoader";
import { HomeOverlay } from "./HomeOverlay";

/**
 * The scroll-driven cinematic hero. Taller than one viewport so there's
 * scroll distance to scrub through — the inner content pins via `sticky`
 * while `useScrollProgress` reports 0-1 progress across that extra height,
 * which drives the camera/board/rocks/UI choreography. Once progress hits 1
 * the sticky content releases and the page continues normally into the
 * feature cards section.
 */
export function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress, progressRef } = useScrollProgress(sectionRef);
  // Once the user has scrolled well past the hero, stop driving the R3F
  // render loop entirely rather than animating an invisible canvas forever.
  const isNearViewport = useIntersectionObserver(sectionRef, {
    rootMargin: "50% 0px 50% 0px",
  });

  return (
    <section
      ref={sectionRef}
      className="home-hero-scope relative isolate h-[200svh] lg:h-[240svh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <HomeBackdrop scrollProgress={scrollYProgress} />
        <HomeSceneLoader
          progressRef={progressRef}
          scrollProgress={scrollYProgress}
          isActive={isNearViewport}
        />
        <HomeOverlay scrollProgress={scrollYProgress} />
        {/* Soft fade at the bottom edge so the sticky frame's release into
            the next section reads as a dissolve rather than a hard clip. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#070711] lg:h-32" />
      </div>
      {/* Long, eased dissolve over the very bottom of the section. It only comes
          into view when the pinned frame releases, so the board fades into the
          next section's background instead of being cut off by a hard edge. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#070711]/70 to-[#070711] lg:h-80" />
    </section>
  );
}
