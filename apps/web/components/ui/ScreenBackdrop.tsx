import Image from "next/image";
import { AnchoredBackdropImage } from "./AnchoredBackdropImage";

type BackdropImage =
  | "playBg"
  | "queueBg"
  | "queueMatchBg"
  | "rankedMatchBg"
  | "resultBg"
  | "leaderboardBg"
  | "homeBg";

/**
 * Backdrops with a painted focal point that foreground content can line up
 * with (see `alignToAnchor`). Fractions are of the image's width / height.
 */
const FOCAL_POINTS: Partial<
  Record<BackdropImage, { width: number; height: number; x: number; y: number }>
> = {
  // Centre of the glowing orbit rings.
  queueBg: { width: 1338, height: 753, x: 0.495, y: 0.376 },
};

/**
 * Full-bleed art behind a screen, dimmed so foreground panels stay readable.
 * The parent must establish a stacking context (`relative isolate`).
 */
export function ScreenBackdrop({
  image,
  dim = 0.55,
  alignToAnchor = false,
  fixed = false,
}: {
  image: BackdropImage;
  /** 0–1 strength of the dark overlay. */
  dim?: number;
  /**
   * Pin the art to the viewport instead of the page. Use on long, scrolling
   * pages, where covering the whole page would zoom the art far past its focal area.
   */
  fixed?: boolean;
  /**
   * Move the art so its focal point sits under the element marked
   * `data-backdrop-anchor` on the page (only for images with a focal point).
   */
  alignToAnchor?: boolean;
}) {
  const focal = alignToAnchor ? FOCAL_POINTS[image] : undefined;
  const src = `/assets/${image}.jpg`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none inset-0 -z-10 overflow-hidden ${fixed ? "fixed" : "absolute"}`}
    >
      {focal ? (
        <AnchoredBackdropImage
          src={src}
          width={focal.width}
          height={focal.height}
          focalX={focal.x}
          focalY={focal.y}
        />
      ) : (
        <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-[#070711]" style={{ opacity: dim }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070711]/70 via-transparent to-[#070711]" />
    </div>
  );
}
