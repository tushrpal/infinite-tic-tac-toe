"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { MathUtils, type PointLight } from "three";

/**
 * Ambient lighting, fog, and starfield for the home hero scene.
 * Colors are fixed to the cinematic dark/purple/cyan palette regardless of
 * the active site theme (the hero is a permanent "game intro" look).
 */
export function Environment({
  reducedMotion,
  progressRef,
  isMobile = false,
  castShadows = true,
}: {
  reducedMotion: boolean;
  progressRef?: MutableRefObject<number>;
  isMobile?: boolean;
  /** Shadow maps are expensive on mobile GPUs; keep lighting, drop maps. */
  castShadows?: boolean;
}) {
  const focusLightRef = useRef<PointLight>(null);

  useFrame((_, delta) => {
    if (!focusLightRef.current) return;
    const progress = reducedMotion ? 0 : (progressRef?.current ?? 0);
    // Board "becomes the focus" as you scroll — a gentle glow-up, not a flash.
    const target = 0.4 + progress * 0.5;
    focusLightRef.current.intensity = MathUtils.damp(
      focusLightRef.current.intensity,
      target,
      3,
      delta,
    );
  });

  return (
    <>
      {/* No background color here — the canvas is transparent so the CSS
          HomeBackdrop (homeBg.jpg) shows through behind the scene. */}
      <fog attach="fog" args={["#0d0b18", 6, 17]} />

      <ambientLight intensity={0.26} color="#9d8cff" />
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.1}
        color="#c084fc"
        castShadow={castShadows}
        shadow-mapSize={castShadows ? [512, 512] : [256, 256]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={14}
        shadow-bias={-0.0015}
      />
      <directionalLight position={[-4, -2, 3]} intensity={0.4} color="#22d3ee" />
      <pointLight ref={focusLightRef} position={[0, -1, 2]} intensity={0.4} color="#a855f7" />

      <Stars
        radius={45}
        depth={30}
        count={reducedMotion ? 250 : isMobile ? 280 : 800}
        factor={2}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.4}
      />
    </>
  );
}
