import Image from "next/image";
import { cn } from "@/lib/helpers";

const EMBLEMS: Record<string, string> = {
  bronze: "/assets/bronze.png",
  silver: "/assets/silver-200px.png",
  gold: "/assets/gold-200px.png",
  platinum: "/assets/platinum-200px.png",
  diamond: "/assets/diamong-200px.png",
  master: "/assets/goat-200px.png",
  grandmaster: "/assets/goat-200px.png",
};

/** Illustrated rank badge. Falls back to nothing for unknown ranks. */
export function RankEmblem({
  rank,
  size = 48,
  className,
  dimmed = false,
}: {
  rank: string;
  size?: number;
  className?: string;
  dimmed?: boolean;
}) {
  const src = EMBLEMS[rank.toLowerCase()];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={`${rank} rank`}
      width={size}
      height={size}
      className={cn(
        "object-contain",
        // A CSS filter is a separate paint pass per image; skip it for the tiny
        // emblems repeated in list rows where the glow isn't visible anyway.
        size >= 40 && "drop-shadow-[0_0_10px_rgba(168,85,247,0.35)]",
        dimmed && "opacity-40 grayscale",
        className,
      )}
    />
  );
}
