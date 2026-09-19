"use client";

import { Suspense, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { MathUtils, PCFShadowMap } from "three";
import { Environment } from "./Environment";
import { GameBoard3D } from "./GameBoard3D";
import { FloatingRocks } from "./FloatingRocks";
import { EnergyEffect } from "./EnergyEffect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsDesktop, useIsMobile } from "@/hooks/useResponsive";

/**
 * Moves the camera slowly toward the board as the user scrolls through the
 * hero. Reads scroll progress from a plain ref (rather than React state) so
 * this runs entirely inside the render loop with no re-renders. The zoom
 * range is tightened on mobile — a 4.8-unit push feels dramatic on a small,
 * already-tight viewport.
 */
function ScrollCameraRig({
  progressRef,
  reducedMotion,
  isMobile,
}: {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
  isMobile: boolean;
}) {
  useFrame(({ camera }, delta) => {
    const progress = reducedMotion ? 0 : progressRef.current;
    const targetZ = MathUtils.lerp(7, isMobile ? 5.7 : 4.8, progress);
    const targetY = MathUtils.lerp(0, isMobile ? 0.15 : 0.35, progress);

    camera.position.z = MathUtils.damp(camera.position.z, targetZ, 3, delta);
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 3, delta);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/**
 * Signals the parent once the scene has actually drawn a few frames, so the
 * static poster underneath can fade out without a blank flash.
 */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current < 3 && ++frames.current === 3) onReady?.();
  });
  return null;
}

/**
 * The Three.js scene for the home hero. Kept separate from HomeSceneLoader
 * so the WebGL/canvas machinery only ever loads on the client.
 *
 * Layout: on desktop the board sits in the right half of the frame next to
 * the left-aligned overlay text (matching the reference composition); on
 * smaller screens it drops below the text, scaled down, since there isn't
 * room for a side-by-side split.
 */
export function HomeScene({
  progressRef,
  isActive,
  onReady,
  onGiveUp,
}: {
  progressRef: MutableRefObject<number>;
  isActive: boolean;
  /** Called once the first frames have rendered. */
  onReady?: () => void;
  /** Called when the device still can't keep up after quality was reduced. */
  onGiveUp?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  // Sustained low fps first drops render quality; if it is still low after
  // that, hand the hero back to the static poster.
  const [degraded, setDegraded] = useState(false);
  const handleDecline = () => {
    if (degraded) onGiveUp?.();
    else setDegraded(true);
  };

  const boardPosition: [number, number, number] = isDesktop
    ? [1.9, 0, 0]
    : [0, -1.9, 0];
  const boardScale = isDesktop ? 0.85 : 0.58;

  return (
    <Canvas
      dpr={degraded ? 1 : isMobile ? [1, 1.25] : [1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      className="!absolute inset-0"
      shadows={{ type: PCFShadowMap }}
      // Stop driving the render loop entirely once the hero has scrolled
      // well out of view instead of animating an invisible canvas forever.
      frameloop={isActive ? "always" : "never"}
    >
      <PerformanceMonitor onDecline={handleDecline} />
      <Suspense fallback={null}>
        <ScrollCameraRig
          progressRef={progressRef}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
        />
        <Environment
          reducedMotion={reducedMotion}
          progressRef={progressRef}
          isMobile={isMobile}
        />
        <EnergyEffect reducedMotion={reducedMotion} />
        <GameBoard3D
          reducedMotion={reducedMotion}
          basePosition={boardPosition}
          scale={boardScale}
          progressRef={progressRef}
        />
        <FloatingRocks
          reducedMotion={reducedMotion}
          reducedCount={isMobile}
          progressRef={progressRef}
        />
        {/* Bloom picks up only the board's bright emissive/unlit surfaces
            (marks, rails, cell borders) — the threshold keeps the dimmer
            starfield and rocks from blooming too. */}
        <EffectComposer multisampling={isMobile || degraded ? 0 : 2}>
          <Bloom
            mipmapBlur
            intensity={isMobile ? 0.35 : 0.5}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.3}
            radius={0.4}
          />
        </EffectComposer>
        <ReadySignal onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
