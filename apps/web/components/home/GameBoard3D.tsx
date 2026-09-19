"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Torus } from "@react-three/drei";
import { MathUtils, type Group } from "three";

const FRAME_COLOR = "#0a0a14";
const CELL_EMPTY_COLOR = "#4C3B8A";
const X_COLOR = "#ff21c8";
const X_CORE = "#ffd9f7";
const O_COLOR = "#22D3EE";
const O_CORE = "#d4faff";

// Rainbow-edge rail colors, one per side of the frame — the "energy rail"
// look from the reference, cheap to fake with unlit bars instead of a
// per-pixel fresnel shader. Kept a shade darker than pure neon so they read
// as a lit trim rather than a glare.
const RAIL_TOP = "#4fd7e0";
const RAIL_RIGHT = "#8B5CF6";
const RAIL_BOTTOM = "#c93fa0";
const RAIL_LEFT = "#6d28d9";

// Purely decorative arrangement for the hero — not a live game state.
const DECORATIVE_MARKS: Record<string, "x" | "o"> = {
  "0-0": "x",
  "1-1": "o",
  "2-2": "x",
  "0-2": "o",
};

const FRAME_SIZE = 3.7;
const FRAME_PADDING = 0.22;
const GRID_SIZE = FRAME_SIZE - FRAME_PADDING * 2;
const CELL_GAP = 0.1;
const CELL_SIZE = (GRID_SIZE - CELL_GAP * 2) / 3;
const CELL_SPACING = CELL_SIZE + CELL_GAP;
const BORDER_THICKNESS = 0.06;

// The chassis is a thin backing slab plus a raised outer rim built from 4
// bars around an actual open square — not a solid block — so the recessed
// cells sitting in that opening are visible instead of being buried inside
// solid geometry.
const BASE_DEPTH = 0.22;
const RIM_DEPTH = 0.36;
const RIM_Z = 0.08;
const RAIL_Z = RIM_Z + RIM_DEPTH / 2 + 0.02;
const CELL_WELL_Z = 0.17;

function cellCenter(row: number, col: number): [number, number] {
  return [(col - 1) * CELL_SPACING, (1 - row) * CELL_SPACING];
}

function XMark({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[Math.PI / 4, -Math.PI / 4].map((rotation) => (
        <group key={rotation} rotation={[0, 0, rotation]}>
          <RoundedBox args={[0.6, 0.11, 0.09]} radius={0.045} smoothness={4} castShadow>
            <meshStandardMaterial
              color={X_COLOR}
              emissive={X_COLOR}
              emissiveIntensity={1.1}
              roughness={0.3}
              metalness={0.3}
            />
          </RoundedBox>
          {/* Soft warm core so the glow reads as a lit tube, not flat paint */}
          <RoundedBox args={[0.48, 0.04, 0.1]} radius={0.018} smoothness={4} position={[0, 0, 0.005]}>
            <meshBasicMaterial color={X_CORE} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function OMark({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Torus args={[0.2, 0.062, 24, 48]} castShadow>
        <meshStandardMaterial
          color={O_COLOR}
          emissive={O_COLOR}
          emissiveIntensity={1.1}
          roughness={0.3}
          metalness={0.3}
        />
      </Torus>
      <Torus args={[0.2, 0.024, 16, 48]} position={[0, 0, 0.005]}>
        <meshBasicMaterial color={O_CORE} />
      </Torus>
    </group>
  );
}

// A single recessed tile: a raised glowing-border ring sits at the well's
// rim, with a darker face set back inside it — the rim occludes light from
// the recessed face, giving a real (shadowed) sense of depth rather than
// relying on emissive brightness alone.
function CellTile({
  row,
  col,
  mark,
}: {
  row: number;
  col: number;
  mark?: "x" | "o";
}) {
  const [x, y] = cellCenter(row, col);
  const borderColor = mark === "x" ? X_COLOR : mark === "o" ? O_COLOR : CELL_EMPTY_COLOR;
  const borderIntensity = mark ? 1.0 : 0.28;
  const innerSize = CELL_SIZE - BORDER_THICKNESS * 2;

  return (
    <group position={[x, y, CELL_WELL_Z]}>
      {/* Border sits further back — it only remains visible in the margin
          where the smaller, more-forward inner face doesn't cover it. */}
      <RoundedBox
        args={[CELL_SIZE, CELL_SIZE, 0.12]}
        radius={0.07}
        smoothness={3}
        position={[0, 0, -0.02]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={borderColor}
          emissive={borderColor}
          emissiveIntensity={borderIntensity}
          roughness={0.4}
        />
      </RoundedBox>
      <RoundedBox
        args={[innerSize, innerSize, 0.07]}
        radius={0.05}
        smoothness={3}
        position={[0, 0, 0.02]}
        receiveShadow
      >
        <meshPhysicalMaterial color="#050409" roughness={0.5} metalness={0.35} clearcoat={0.5} />
      </RoundedBox>
      {mark === "x" && <XMark position={[0, 0, 0.08]} />}
      {mark === "o" && <OMark position={[0, 0, 0.08]} />}
    </group>
  );
}

function EnergyRails() {
  const half = FRAME_SIZE / 2 - 0.07;
  return (
    <group position={[0, 0, RAIL_Z]}>
      <RoundedBox args={[FRAME_SIZE - 0.3, 0.03, 0.045]} radius={0.013} smoothness={3} position={[0, half, 0]}>
        <meshBasicMaterial color={RAIL_TOP} />
      </RoundedBox>
      <RoundedBox args={[0.03, FRAME_SIZE - 0.3, 0.045]} radius={0.013} smoothness={3} position={[half, 0, 0]}>
        <meshBasicMaterial color={RAIL_RIGHT} />
      </RoundedBox>
      <RoundedBox args={[FRAME_SIZE - 0.3, 0.03, 0.045]} radius={0.013} smoothness={3} position={[0, -half, 0]}>
        <meshBasicMaterial color={RAIL_BOTTOM} />
      </RoundedBox>
      <RoundedBox args={[0.03, FRAME_SIZE - 0.3, 0.045]} radius={0.013} smoothness={3} position={[-half, 0, 0]}>
        <meshBasicMaterial color={RAIL_LEFT} />
      </RoundedBox>
    </group>
  );
}

// Colored trim glued to the frame's actual outer SIDE surface (not the front
// face) — without this the extruded depth of the rim is invisible whenever
// the board tilts, since the side faces were the same dark color as
// everything else and blended into the backdrop.
function EdgeGlow() {
  const rimSpan = FRAME_SIZE / 2 - FRAME_PADDING / 2;
  const outerEdge = rimSpan + FRAME_PADDING / 2;
  const stripThickness = 0.045;
  const stripDepth = RIM_DEPTH - 0.04;
  const inset = outerEdge - stripThickness / 2;

  return (
    <group position={[0, 0, RIM_Z]}>
      <RoundedBox args={[FRAME_SIZE, stripThickness, stripDepth]} radius={0.015} smoothness={3} position={[0, inset, 0]}>
        <meshBasicMaterial color={RAIL_TOP} toneMapped={false} />
      </RoundedBox>
      <RoundedBox args={[stripThickness, FRAME_SIZE, stripDepth]} radius={0.015} smoothness={3} position={[inset, 0, 0]}>
        <meshBasicMaterial color={RAIL_RIGHT} toneMapped={false} />
      </RoundedBox>
      <RoundedBox args={[FRAME_SIZE, stripThickness, stripDepth]} radius={0.015} smoothness={3} position={[0, -inset, 0]}>
        <meshBasicMaterial color={RAIL_BOTTOM} toneMapped={false} />
      </RoundedBox>
      <RoundedBox args={[stripThickness, FRAME_SIZE, stripDepth]} radius={0.015} smoothness={3} position={[-inset, 0, 0]}>
        <meshBasicMaterial color={RAIL_LEFT} toneMapped={false} />
      </RoundedBox>
    </group>
  );
}

// The chassis: a thin backing slab (visible through the gaps between cells)
// plus a raised rim built from 4 bars around a real GRID_SIZE opening — a
// solid block here would simply bury the recessed cells behind its face.
function FrameChassis() {
  const rimSpan = FRAME_SIZE / 2 - FRAME_PADDING / 2;
  const rimMaterial = (
    <meshPhysicalMaterial
      color={FRAME_COLOR}
      roughness={0.35}
      metalness={0.7}
      clearcoat={0.9}
      clearcoatRoughness={0.15}
    />
  );

  return (
    <>
      <RoundedBox args={[FRAME_SIZE, FRAME_SIZE, BASE_DEPTH]} radius={0.2} smoothness={4} receiveShadow>
        {rimMaterial}
      </RoundedBox>

      <group position={[0, 0, RIM_Z]}>
        <RoundedBox
          args={[FRAME_SIZE, FRAME_PADDING, RIM_DEPTH]}
          radius={0.1}
          smoothness={4}
          position={[0, rimSpan, 0]}
          castShadow
          receiveShadow
        >
          {rimMaterial}
        </RoundedBox>
        <RoundedBox
          args={[FRAME_SIZE, FRAME_PADDING, RIM_DEPTH]}
          radius={0.1}
          smoothness={4}
          position={[0, -rimSpan, 0]}
          castShadow
          receiveShadow
        >
          {rimMaterial}
        </RoundedBox>
        <RoundedBox
          args={[FRAME_PADDING, FRAME_SIZE, RIM_DEPTH]}
          radius={0.1}
          smoothness={4}
          position={[rimSpan, 0, 0]}
          castShadow
          receiveShadow
        >
          {rimMaterial}
        </RoundedBox>
        <RoundedBox
          args={[FRAME_PADDING, FRAME_SIZE, RIM_DEPTH]}
          radius={0.1}
          smoothness={4}
          position={[-rimSpan, 0, 0]}
          castShadow
          receiveShadow
        >
          {rimMaterial}
        </RoundedBox>
      </group>
    </>
  );
}

interface GameBoard3DProps {
  reducedMotion: boolean;
  basePosition?: [number, number, number];
  scale?: number;
  progressRef?: MutableRefObject<number>;
}

export function GameBoard3D({
  reducedMotion,
  basePosition = [0, 0, 0],
  scale = 1,
  progressRef,
}: GameBoard3DProps) {
  const groupRef = useRef<Group>(null);
  const phase = useRef(Math.random() * 100);
  const [baseX, baseY, baseZ] = basePosition;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const progress = reducedMotion ? 0 : (progressRef?.current ?? 0);
    const t = state.clock.elapsedTime + phase.current;

    // As the user scrolls, the board drifts from its split-layout offset
    // toward center (once the overlay text has faded) and grows slightly,
    // like the camera is closing in on it.
    const centerAmount = MathUtils.clamp((progress - 0.25) / 0.75, 0, 1);
    const targetX = MathUtils.lerp(baseX, 0, centerAmount);
    const targetScale = scale * (1 + progress * 0.1);

    const idleY = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.08;
    const idleRotY = reducedMotion ? 0 : Math.sin(t * 0.15) * 0.06;
    const idleRotX = reducedMotion ? 0 : Math.cos(t * 0.18) * 0.03;

    groupRef.current.position.x = MathUtils.damp(
      groupRef.current.position.x,
      targetX,
      4,
      delta,
    );
    groupRef.current.position.y = baseY + idleY;
    groupRef.current.position.z = baseZ;
    groupRef.current.rotation.x = idleRotX - 0.08;
    groupRef.current.rotation.y = idleRotY + progress * 0.5;

    const dampedScale = MathUtils.damp(
      groupRef.current.scale.x,
      targetScale,
      4,
      delta,
    );
    groupRef.current.scale.setScalar(dampedScale);
  });

  const cells = useMemo(() => {
    const list: Array<{ row: number; col: number; mark?: "x" | "o" }> = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        list.push({ row, col, mark: DECORATIVE_MARKS[`${row}-${col}`] });
      }
    }
    return list;
  }, []);

  return (
    <group ref={groupRef} position={basePosition} scale={scale} rotation={[-0.08, 0, 0]}>
      <FrameChassis />
      <EnergyRails />
      <EdgeGlow />

      {cells.map((cell) => (
        <CellTile key={`${cell.row}-${cell.col}`} row={cell.row} col={cell.col} mark={cell.mark} />
      ))}
    </group>
  );
}
