"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, useTexture } from "@react-three/drei";
import type { Group, Texture } from "three";

type DepthLayer = "fore" | "mid" | "back";
type RockTexture = "rock1" | "rock2";

interface RockConfig {
  texture: RockTexture;
  position: [number, number, number];
  size: number;
  layer: DepthLayer;
  phase: number;
  spin: number;
}

// Positioned to frame the corners/edges like the reference art, leaving the
// board and text areas clear. Values are hand-tuned world units.
const ROCKS: RockConfig[] = [
  // Foreground — larger, closest to camera, moves most
  { texture: "rock1", position: [-4.4, -2.6, 3.4], size: 1.7, layer: "fore", phase: 0, spin: 0.05 },
  { texture: "rock2", position: [4.9, 2.8, 2.8], size: 1.35, layer: "fore", phase: 1.4, spin: -0.04 },
  { texture: "rock2", position: [-5.1, 2.9, 2.1], size: 1.1, layer: "fore", phase: 2.7, spin: 0.06 },

  // Midground
  { texture: "rock1", position: [3.9, -3, -1.2], size: 0.95, layer: "mid", phase: 0.8, spin: -0.05 },
  { texture: "rock2", position: [-3.4, -1.4, -2.2], size: 0.78, layer: "mid", phase: 2.0, spin: 0.04 },
  { texture: "rock1", position: [2.8, 3.1, -1.8], size: 0.85, layer: "mid", phase: 3.2, spin: -0.03 },

  // Background — small, far, subtle drift only
  { texture: "rock2", position: [-2.1, 3.5, -6.5], size: 0.55, layer: "back", phase: 0.5, spin: 0.02 },
  { texture: "rock1", position: [5.2, 0.6, -7.5], size: 0.5, layer: "back", phase: 1.7, spin: -0.02 },
  { texture: "rock2", position: [-5.6, -3.1, -7], size: 0.45, layer: "back", phase: 2.3, spin: 0.03 },
  { texture: "rock1", position: [1.1, -3.8, -8.2], size: 0.4, layer: "back", phase: 3.6, spin: -0.02 },
];

const PARALLAX_BY_LAYER: Record<DepthLayer, number> = {
  fore: 0.4,
  mid: 0.2,
  back: 0.07,
};

const FLOAT_BY_LAYER: Record<DepthLayer, number> = {
  fore: 0.14,
  mid: 0.09,
  back: 0.05,
};

// How far each layer drifts downward as the user scrolls through the hero —
// closer rocks sweep past faster, distant ones barely move.
const SCROLL_DRIFT_BY_LAYER: Record<DepthLayer, number> = {
  fore: 3.2,
  mid: 1.6,
  back: 0.5,
};

function Rock({
  config,
  texture,
  reducedMotion,
  progressRef,
}: {
  config: RockConfig;
  texture: Texture;
  reducedMotion: boolean;
  progressRef?: MutableRefObject<number>;
}) {
  const ref = useRef<Group>(null);
  const { pointer } = useThree();
  const [baseX, baseY, baseZ] = config.position;

  useFrame((state) => {
    if (!ref.current) return;

    if (reducedMotion) {
      ref.current.position.set(baseX, baseY, baseZ);
      return;
    }

    const progress = progressRef?.current ?? 0;
    const scrollDrift = progress * SCROLL_DRIFT_BY_LAYER[config.layer];

    const t = state.clock.elapsedTime + config.phase;
    const parallax = PARALLAX_BY_LAYER[config.layer];
    const floatAmp = FLOAT_BY_LAYER[config.layer];

    ref.current.position.x = baseX + pointer.x * parallax;
    ref.current.position.y =
      baseY +
      Math.sin(t * 0.3) * floatAmp +
      pointer.y * parallax * 0.6 -
      scrollDrift;
    ref.current.rotation.z = Math.sin(t * 0.2) * config.spin;
  });

  return (
    <group ref={ref} position={config.position}>
      <Billboard>
        <mesh scale={config.size}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.3}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

export function FloatingRocks({
  reducedMotion,
  reducedCount,
  progressRef,
}: {
  reducedMotion: boolean;
  reducedCount: boolean;
  progressRef?: MutableRefObject<number>;
}) {
  const [rock1, rock2] = useTexture(["/assets/rock1.png", "/assets/rock2.png"]);
  const rocks = reducedCount ? ROCKS.filter((_, i) => i % 2 === 0) : ROCKS;

  return (
    <>
      {rocks.map((config, i) => (
        <Rock
          key={i}
          config={config}
          texture={config.texture === "rock1" ? rock1 : rock2}
          reducedMotion={reducedMotion}
          progressRef={progressRef}
        />
      ))}
    </>
  );
}
