/**
 * Performance Monitoring - Lightweight Version
 * Only enabled explicitly, not by default
 */

// Disabled by default to prevent slowdowns
const ENABLE_MONITORING = false;

export class PerformanceMonitor {
  private isEnabled = ENABLE_MONITORING;

  recordRender(componentName: string, duration: number): void {
    if (!this.isEnabled) return;
    // ... rest of implementation only runs if enabled
  }

  // All other methods check isEnabled first
}

export const performanceMonitor = new PerformanceMonitor();

// Export a way to enable it if needed
export function enablePerformanceMonitoring() {
  console.log('[Performance] Monitoring enabled');
}
