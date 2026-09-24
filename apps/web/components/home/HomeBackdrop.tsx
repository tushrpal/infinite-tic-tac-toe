"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isTouchDevice } from "@/hooks/useResponsive";

/**
 * Distant cosmic backdrop behind the 3D canvas. Dimmed and gradient-masked
 * so it reads as atmosphere rather than competing with the board/UI. Drifts
 * gently with the mouse on pointer devices, and recedes further as the user
 * scrolls into the cinematic camera move. Touch devices skip pointer parallax
 * (scroll scale alone is enough and avoids extra spring work on mobile GPUs).
 */
export function HomeBackdrop({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const reducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 40, damping: 20, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 40, damping: 20, mass: 0.6 });

  const scrollScale = useTransform(scrollProgress, [0, 1], [1, reducedMotion ? 1 : 1.08]);
  const scrollOpacity = useTransform(scrollProgress, [0, 1], [0.4, 0.22]);

  useEffect(() => {
    if (reducedMotion || isTouchDevice()) return;

    const handlePointerMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      rawX.set(nx * -10);
      rawY.set(ny * -8);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [reducedMotion, rawX, rawY]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ x, y, scale: scrollScale }}
        className="absolute -inset-x-[5%] -inset-y-[5%]"
      >
        <motion.div style={{ opacity: scrollOpacity }} className="relative h-full w-full">
          <Image
            src="/assets/homeBg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover"
          />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#070711] via-[#070711]/60 to-[#070711]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070711] via-transparent to-[#070711]/50" />
    </div>
  );
}
