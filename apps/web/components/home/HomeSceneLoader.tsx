"use client";

import dynamic from "next/dynamic";
import type { MutableRefObject } from "react";

// The 3D scene touches WebGL/canvas APIs that don't exist during SSR, so it
// must be loaded client-side only.
const HomeScene = dynamic(() => import("./HomeScene").then((mod) => mod.HomeScene), {
  ssr: false,
  loading: () => null,
});

export function HomeSceneLoader({
  progressRef,
  isActive,
}: {
  progressRef: MutableRefObject<number>;
  isActive: boolean;
}) {
  return <HomeScene progressRef={progressRef} isActive={isActive} />;
}
