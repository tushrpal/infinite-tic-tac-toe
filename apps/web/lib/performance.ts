/**
 * Performance Monitoring Utilities
 * Tools for measuring and tracking app performance
 */

// ============================================
// Performance Metrics
// ============================================

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface ComponentMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

// ============================================
// Performance Observer
// ============================================

export class PerformanceMonitor {
  private metrics: Map<string, ComponentMetrics> = new Map();
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Mark the start of a performance measurement
   */
  markStart(label: string): void {
    if (this.isProduction) return;
    performance.mark(`${label}-start`);
  }

  /**
   * Mark the end of a performance measurement and calculate duration
   */
  markEnd(label: string): number {
    if (this.isProduction) return 0;

    performance.mark(`${label}-end`);

    try {
      const measure = performance.measure(
        label,
        `${label}-start`,
        `${label}-end`
      );

      // Clean up marks
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);

      return measure.duration;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Record a component render
   */
  recordRender(componentName: string, duration: number): void {
    if (this.isProduction) return;

    const existing = this.metrics.get(componentName);

    if (existing) {
      const totalTime = existing.averageRenderTime * existing.renderCount + duration;
      const newCount = existing.renderCount + 1;

      this.metrics.set(componentName, {
        componentName,
        renderCount: newCount,
        averageRenderTime: totalTime / newCount,
        lastRenderTime: duration,
      });
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: duration,
        lastRenderTime: duration,
      });
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): ComponentMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics for a specific component
   */
  getComponentMetrics(componentName: string): ComponentMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * Get slow components (average render time > threshold)
   */
  getSlowComponents(thresholdMs: number = 16): ComponentMetrics[] {
    return this.getMetrics().filter(
      (m) => m.averageRenderTime > thresholdMs
    );
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Log metrics to console
   */
  logMetrics(): void {
    if (this.isProduction) return;

    const metrics = this.getMetrics();
    if (metrics.length === 0) {
      console.log('[Performance] No metrics recorded');
      return;
    }

    console.group('[Performance] Component Metrics');

    // Sort by average render time
    const sorted = [...metrics].sort(
      (a, b) => b.averageRenderTime - a.averageRenderTime
    );

    sorted.forEach((metric) => {
      console.log(
        `${metric.componentName}: ${metric.renderCount} renders, ` +
        `avg ${metric.averageRenderTime.toFixed(2)}ms, ` +
        `last ${metric.lastRenderTime.toFixed(2)}ms`
      );
    });

    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// ============================================
// React Profiler Integration
// ============================================

export function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
): void {
  if (process.env.NODE_ENV === 'production') return;

  performanceMonitor.recordRender(id, actualDuration);

  // Log slow renders (> 16ms = below 60fps)
  if (actualDuration > 16) {
    console.warn(
      `[Performance] Slow ${phase} of ${id}: ${actualDuration.toFixed(2)}ms`
    );
  }
}

// ============================================
// Memory Monitoring
// ============================================

export function getMemoryUsage(): number | null {
  if (typeof window === 'undefined') return null;

  // @ts-ignore - performance.memory is non-standard but available in Chrome
  const memory = performance.memory;

  if (!memory) return null;

  return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
}

export function logMemoryUsage(): void {
  const usage = getMemoryUsage();
  if (usage) {
    console.log(`[Performance] Memory usage: ${usage}MB`);
  }
}

// ============================================
// Network Performance
// ============================================

export interface NetworkMetrics {
  type: string;
  url: string;
  duration: number;
  size: number;
}

export function observeNetworkPerformance(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'production') return;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;

        // Log slow resources (> 1s)
        if (resource.duration > 1000) {
          console.warn(
            `[Performance] Slow resource: ${resource.name} ` +
            `(${resource.duration.toFixed(0)}ms)`
          );
        }
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.error('[Performance] Failed to observe network:', error);
  }
}

// ============================================
// Bundle Size Helpers
// ============================================

export function logBundleInfo(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'production') return;

  console.group('[Performance] Bundle Info');

  // Count scripts
  const scripts = document.querySelectorAll('script[src]');
  console.log(`Scripts loaded: ${scripts.length}`);

  // Count stylesheets
  const styles = document.querySelectorAll('link[rel="stylesheet"]');
  console.log(`Stylesheets loaded: ${styles.length}`);

  console.groupEnd();
}

// ============================================
// Initialize Performance Monitoring
// ============================================

export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'production') return;

  console.log('[Performance] Monitoring initialized');

  observeNetworkPerformance();
  logBundleInfo();

  // Log metrics periodically in development
  setInterval(() => {
    performanceMonitor.logMetrics();
    logMemoryUsage();
  }, 30000); // Every 30 seconds
}
