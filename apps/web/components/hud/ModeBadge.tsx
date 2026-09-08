"use client";

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { getOnlineModeInfo } from "@/lib/gameModes";
import type { GameMode } from "@/ws/types";

export interface ModeBadgeProps {
  mode: GameMode;
  className?: string;
}

export const ModeBadge = memo(function ModeBadge({
  mode,
  className,
}: ModeBadgeProps) {
  const info = getOnlineModeInfo(mode);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "text-xs font-medium",
        "bg-surface-elevated border border-board-grid",
        mode === "MODE_1" ? "text-playerX-primary" : "text-playerO-primary",
        className,
      )}
      title={info.longDescription}
    >
      <span aria-hidden="true">{info.icon}</span>
      {info.label} Mode
    </span>
  );
});

export default ModeBadge;
