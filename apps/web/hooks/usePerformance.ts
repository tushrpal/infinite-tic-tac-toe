/**
 * React Performance Optimization Hooks
 * Utilities for optimizing component rendering
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { performanceMonitor } from '@/lib/performance';

// ============================================
// useRenderCount Hook
// ============================================

export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${componentName}] Render #${renderCount.current}`);
    }
  });

  return renderCount.current;
}

// ============================================
// useWhyDidYouUpdate Hook
// ============================================

export function useWhyDidYouUpdate(name: string, props: Record<string, any>): void {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[useWhyDidYouUpdate]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// ============================================
// usePerformance Hook
// ============================================

export function usePerformance(componentName: string): void {
  const startTimeRef = useRef<number>(0);

  // Mark start before render
  startTimeRef.current = performance.now();

  useEffect(() => {
    // Calculate render duration after commit
    const duration = performance.now() - startTimeRef.current;
    performanceMonitor.recordRender(componentName, duration);

    if (duration > 16 && process.env.NODE_ENV !== 'production') {
      console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
    }
  });
}

// ============================================
// useDebounce Hook
// ============================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// useThrottle Hook
// ============================================

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// ============================================
// useMemoCompare Hook
// ============================================

export function useMemoCompare<T>(
  next: T,
  compare: (previous: T | undefined, next: T) => boolean
): T {
  const previousRef = useRef<T>();
  const previous = previousRef.current;

  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  });

  return isEqual && previous !== undefined ? previous : next;
}

// ============================================
// useEventCallback Hook
// ============================================

export function useEventCallback<T extends (...args: any[]) => any>(
  fn: T
): T {
  const ref = useRef<T>(fn);

  useEffect(() => {
    ref.current = fn;
  });

  return useCallback(
    ((...args) => ref.current(...args)) as T,
    []
  );
}

// ============================================
// useIntersectionObserver Hook
// ============================================

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIntersecting] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// ============================================
// React Import Fix
// ============================================

import React from 'react';
