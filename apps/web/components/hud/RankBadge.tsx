"use client";

/**
 * RankBadge Component
 * Displays player rank with color
 */

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { Tooltip } from "@/components/ui/Tooltip";

export interface RankBadgeProps {
  rank: string;
  color: string;
  rating?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export const RankBadge = memo(function RankBadge({
  rank,
  color,
  rating,
  size = "md",
  showTooltip = true,
  className,
}: RankBadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5",
        "font-semibold rounded-full",
        "border",
        sizeStyles[size],
        className,
      )}
      style={{
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color,
      }}
    >
      <RankIcon rank={rank} size={size} />
      <span>{rank}</span>
    </div>
  );

  if (showTooltip && rating !== undefined) {
    return <Tooltip content={`Rating: ${rating}`}>{badge}</Tooltip>;
  }

  return badge;
});

// ============================================
// Rank Icon
// ============================================

interface RankIconProps {
  rank: string;
  size: "sm" | "md" | "lg";
}

function RankIcon({ rank, size }: RankIconProps) {
  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Simple rank icons
  const getIcon = () => {
    switch (rank.toLowerCase()) {
      case "bronze":
        return <BronzeIcon className={iconSize[size]} />;
      case "silver":
        return <SilverIcon className={iconSize[size]} />;
      case "gold":
        return <GoldIcon className={iconSize[size]} />;
      case "platinum":
        return <PlatinumIcon className={iconSize[size]} />;
      case "diamond":
        return <DiamondIcon className={iconSize[size]} />;
      case "master":
        return <MasterIcon className={iconSize[size]} />;
      case "grandmaster":
        return <GrandmasterIcon className={iconSize[size]} />;
      default:
        return null;
    }
  };

  return getIcon();
}

// Simple SVG icons for each rank
function BronzeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function SilverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="5" fill="white" fillOpacity="0.3" />
    </svg>
  );
}

function GoldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" />
    </svg>
  );
}

function PlatinumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" />
      <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 20,10 12,22 4,10" />
    </svg>
  );
}

function MasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 3l6.5 3.25L12 11.5 5.5 8.25 12 5z" />
    </svg>
  );
}

function GrandmasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5z" />
      <path d="M5 19h14v2H5v-2z" />
    </svg>
  );
}

export default RankBadge;
