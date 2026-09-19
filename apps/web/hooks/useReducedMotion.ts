"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` OS setting so animated
 * components (e.g. the home page 3D scene) can scale back or disable motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}
