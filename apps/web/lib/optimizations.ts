/**
 * Performance Optimization Patterns
 * Reusable patterns for optimizing React components
 */

import React, { Suspense, lazy as reactLazy } from 'react';
import type { ComponentType } from 'react';

// ============================================
// Lazy Loading with Error Boundary
// ============================================

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): T {
  const { fallback = null, onError } = options;

  const LazyComponent = reactLazy(factory);

  const WrappedComponent = (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return WrappedComponent as unknown as T;
}

// ============================================
// Preload Helper
// ============================================

export function preloadComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): void {
  factory();
}

// ============================================
// Optimized List Item Pattern
// ============================================

export interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  estimatedItemHeight?: number;
  className?: string;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
}: OptimizedListProps<T>) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================
// Memoization Helpers
// ============================================

/**
 * Deep comparison memo
 * Use sparingly - expensive comparison
 */
export function deepMemo<P extends object>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}

/**
 * Shallow comparison memo (default React.memo behavior)
 * Preferred for most use cases
 */
export function shallowMemo<P extends object>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component);
}

/**
 * Custom comparison memo
 */
export function customMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, areEqual);
}

// ============================================
// Image Optimization Helpers
// ============================================

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  className,
  onLoad,
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
      onLoad={onLoad}
    />
  );
}

// ============================================
// Code Splitting Routes
// ============================================

export const LAZY_ROUTES = {
  // Lazy load heavy pages
  HowToPlay: lazyLoad(() => import('@/app/how-to-play/page'), {
    fallback: <div>Loading...</div>,
  }),
  Profile: lazyLoad(() => import('@/app/profile/page'), {
    fallback: <div>Loading...</div>,
  }),
  Leaderboard: lazyLoad(() => import('@/app/leaderboard/page'), {
    fallback: <div>Loading...</div>,
  }),
} as const;

// ============================================
// Performance Best Practices
// ============================================

/**
 * BEST PRACTICES FOR PERFORMANCE:
 *
 * 1. Use React.memo for components that:
 *    - Receive the same props frequently
 *    - Are expensive to render
 *    - Are in a list or rendered multiple times
 *
 * 2. Use useMemo for:
 *    - Expensive calculations
 *    - Creating complex objects/arrays in render
 *    - Avoiding unnecessary re-renders of child components
 *
 * 3. Use useCallback for:
 *    - Functions passed to memoized child components
 *    - Functions used in dependency arrays
 *    - Event handlers passed to many child components
 *
 * 4. Avoid:
 *    - Creating objects/arrays inline in JSX
 *    - Anonymous functions in JSX (when passing to memoized components)
 *    - Unnecessary state updates
 *    - Large bundle sizes - use code splitting
 *
 * 5. Lazy Load:
 *    - Heavy components not needed immediately
 *    - Routes/pages
 *    - Modals and overlays
 *    - Third-party libraries
 *
 * 6. Images:
 *    - Use lazy loading
 *    - Optimize file sizes
 *    - Use appropriate formats (WebP, AVIF)
 *    - Provide width/height to prevent layout shift
 */
