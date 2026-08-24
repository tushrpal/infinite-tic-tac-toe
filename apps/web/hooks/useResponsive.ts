/**
 * Mobile and Responsive Utilities
 * Hooks and helpers for responsive design
 */

import { useState, useEffect } from 'react';

// ============================================
// Breakpoints (matching Tailwind defaults)
// ============================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ============================================
// useMediaQuery Hook
// ============================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    // Legacy browsers
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

// ============================================
// useBreakpoint Hook
// ============================================

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

// ============================================
// useIsMobile Hook
// ============================================

export function useIsMobile(): boolean {
  return !useBreakpoint('md');
}

// ============================================
// useIsTablet Hook
// ============================================

export function useIsTablet(): boolean {
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  return isMd && !isLg;
}

// ============================================
// useIsDesktop Hook
// ============================================

export function useIsDesktop(): boolean {
  return useBreakpoint('lg');
}

// ============================================
// useViewportSize Hook
// ============================================

export interface ViewportSize {
  width: number;
  height: number;
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// ============================================
// useOrientation Hook
// ============================================

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
      ? 'portrait'
      : 'landscape'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}

// ============================================
// Touch Detection
// ============================================

let cachedIsTouchDevice: boolean | null = null;

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Return cached value if available
  if (cachedIsTouchDevice !== null) {
    return cachedIsTouchDevice;
  }

  // Compute once and cache
  cachedIsTouchDevice = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );

  return cachedIsTouchDevice;
}

export function useTouchDevice(): boolean {
  // Use cached detection - no need to recalculate on every mount
  return isTouchDevice();
}

// ============================================
// Safe Area Insets (for mobile notches)
// ============================================

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}

// ============================================
// Responsive Value Helper
// ============================================

export function getResponsiveValue<T>(
  values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  },
  viewport: 'mobile' | 'tablet' | 'desktop'
): T {
  return values[viewport] ?? values.default;
}
