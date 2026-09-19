import Image from "next/image";

type BackdropImage =
  | "playBg"
  | "queueBg"
  | "queueMatchBg"
  | "rankedMatchBg"
  | "resultBg"
  | "leaderboardBg"
  | "homeBg";

/**
 * Full-bleed art behind a screen, dimmed so foreground panels stay readable.
 * The parent must establish a stacking context (`relative isolate`).
 */
export function ScreenBackdrop({
  image,
  dim = 0.55,
}: {
  image: BackdropImage;
  /** 0–1 strength of the dark overlay. */
  dim?: number;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={`/assets/${image}.jpg`}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#070711]" style={{ opacity: dim }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070711]/70 via-transparent to-[#070711]" />
    </div>
  );
}
