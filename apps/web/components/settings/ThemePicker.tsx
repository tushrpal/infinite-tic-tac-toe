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
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-text-primary">Theme</h3>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
        {availableThemes.map((theme) => {
          const swatch = THEME_SWATCHES[theme.id];
          const selected = themeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setTheme(theme.id)}
              className={cn(
                "flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
                selected
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-board-grid bg-surface-elevated hover:border-text-tertiary",
              )}
              role="radio"
              aria-checked={selected}
              aria-label={`${theme.name} theme`}
            >
              <span
                className="relative w-6 h-6 rounded-full border border-white/10 flex items-center justify-center shrink-0 overflow-hidden"
                style={{ backgroundColor: swatch.bg }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full -translate-x-[3px]"
                  style={{ backgroundColor: swatch.x }}
                />
                <span
                  className="w-[5px] h-[5px] rounded-full translate-x-[3px]"
                  style={{ backgroundColor: swatch.o }}
                />
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  selected ? "text-accent-primary" : "text-text-secondary",
                )}
              >
                {theme.name}
              </span>
              {selected && (
                <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default ThemePicker;
