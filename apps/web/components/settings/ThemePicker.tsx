"use client";

/**
 * ThemePicker — select from available visual themes
 */

import { memo } from "react";
import { cn } from "@/lib/helpers";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeId } from "@/theme/themes";

const THEME_SWATCHES: Record<ThemeId, { x: string; o: string; bg: string }> = {
  dark: { x: "#00d4ff", o: "#ff6b9d", bg: "#0f0f14" },
  light: { x: "#0284c7", o: "#db2777", bg: "#ffffff" },
  neon: { x: "#39ff14", o: "#ff10f0", bg: "#0a0a0a" },
  retro: { x: "#ffd700", o: "#ff4444", bg: "#1a1a2e" },
};

export const ThemePicker = memo(function ThemePicker({
  className,
}: {
  className?: string;
}) {
  const { themeId, setTheme, availableThemes } = useTheme();

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-text-primary">Theme</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {availableThemes.map((theme) => {
          const swatch = THEME_SWATCHES[theme.id];
          const selected = themeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setTheme(theme.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                "hover:border-accent-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
                selected
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-board-grid bg-surface-elevated",
              )}
              aria-pressed={selected}
              aria-label={`${theme.name} theme${selected ? ", selected" : ""}`}
            >
              <div
                className="w-full h-8 rounded-lg flex items-center justify-center gap-1.5 border border-board-grid"
                style={{ backgroundColor: swatch.bg }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: swatch.x }}
                />
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: swatch.o }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  selected ? "text-accent-primary" : "text-text-secondary",
                )}
              >
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default ThemePicker;
