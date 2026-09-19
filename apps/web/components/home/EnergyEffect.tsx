"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, MathUtils } from "three";
import type { Mesh, MeshBasicMaterial } from "three";

// A soft radial gradient, stretched by the plane's aspect ratio into an
// elongated "beam" shape with naturally soft, rounded edges — no shader code
// needed for a glow this subtle.
function createBeamTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

const SWEEP_SECONDS = 26;

/**
 * A slow, low-intensity energy streak drifting diagonally behind the board —
 * atmosphere, not a focal point. Fades in/out at the ends of its path so the
 * loop never pops, and is skipped entirely under reduced motion.
 */
export function EnergyEffect({ reducedMotion }: { reducedMotion: boolean }) {
  const texture = useMemo(() => createBeamTexture(), []);
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const progress = (state.clock.elapsedTime % SWEEP_SECONDS) / SWEEP_SECONDS;

    meshRef.current.position.x = MathUtils.lerp(-9, 9, progress);
    meshRef.current.position.y = MathUtils.lerp(-4.5, 4, progress);

    // Envelope: 0 at the start/end of the sweep, peaking at the midpoint.
    const envelope = Math.sin(progress * Math.PI);
    materialRef.current.opacity = envelope * 0.35;
  });

  if (reducedMotion) return null;

  return (
    <mesh ref={meshRef} position={[-9, -4.5, -5]} rotation={[0, 0, Math.PI / 5]}>
      <planeGeometry args={[9, 1.4]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        color="#22D3EE"
        transparent
        opacity={0}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
