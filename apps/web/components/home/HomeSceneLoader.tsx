"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type MutableRefObject } from "react";
import type { MotionValue } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HomeStaticScene } from "./HomeStaticScene";

// The 3D scene touches WebGL/canvas APIs that don't exist during SSR, so it
// must be loaded client-side only.
const HomeScene = dynamic(() => import("./HomeScene").then((mod) => mod.HomeScene), {
  ssr: false,
  loading: () => null,
});

/**
 * Set NEXT_PUBLIC_DISABLE_3D_BOARD=true to always show the static poster and
 * never download or start the Three.js scene. Inlined at build time, so restart
 * `next dev` (or rebuild) after changing it.
 */
const DISABLE_3D_BOARD = ["true", "1"].includes(
  (process.env.NEXT_PUBLIC_DISABLE_3D_BOARD ?? "").toLowerCase(),
);

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Cheap up-front check for devices where the 3D hero isn't worth attempting. */
function supportsRich3D(): boolean {
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return false;
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return false;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // Release the probe context right away; browsers cap live GL contexts.
    (gl.getExtension("WEBGL_lose_context") as WEBGL_lose_context | null)?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Paints the static poster immediately, then — only if the device looks
 * capable and the browser is idle — mounts the 3D scene on top and fades the
 * poster out once real frames are drawing. If the scene can't hold its frame
 * rate even at reduced quality it hands back to the poster.
 */
export function HomeSceneLoader({
  progressRef,
  scrollProgress,
  isActive,
}: {
  progressRef: MutableRefObject<number>;
  /** Same progress as `progressRef`, as a motion value for the static poster. */
  scrollProgress: MotionValue<number>;
  isActive: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [wants3D, setWants3D] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (DISABLE_3D_BOARD || reducedMotion || !supportsRich3D()) return;

    const start = () => setWants3D(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 400);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  const show3D = wants3D && !gaveUp && !reducedMotion;
  const posterFaded = show3D && sceneReady;
  // While WebGL is booting, freeze the poster's idle float so we aren't
  // running CSS animation + Three init on the same frame budget. Scroll
  // scrub stays on so the hero still feels alive if load is slow.
  const sceneBooting = show3D && !sceneReady;

  // Once the poster has faded out, remove it instead of keeping a full-size
  // composited layer alive underneath the canvas.
  const [posterRemoved, setPosterRemoved] = useState(false);
  useEffect(() => {
    if (!posterFaded) {
      setPosterRemoved(false);
      return;
    }
    const id = window.setTimeout(() => setPosterRemoved(true), 400);
    return () => window.clearTimeout(id);
  }, [posterFaded]);

  return (
    <>
      {!posterRemoved && (
        <HomeStaticScene
          scrollProgress={scrollProgress}
          animateOnScroll={!reducedMotion}
          float={!reducedMotion && !sceneBooting}
          hidden={posterFaded}
        />
      )}
      {show3D && (
        <HomeScene
          progressRef={progressRef}
          isActive={isActive}
          onReady={() => setSceneReady(true)}
          onGiveUp={() => {
            setGaveUp(true);
            setSceneReady(false);
          }}
        />
      )}
    </>
  );
}
