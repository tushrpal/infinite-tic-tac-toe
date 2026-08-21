/**
 * Enhanced WebSocket Reconnection Manager
 * Provides intelligent reconnection strategies and connection monitoring
 */

export interface ReconnectionStrategy {
  name: string;
  maxAttempts: number;
  getDelay: (attempt: number) => number;
  shouldRetry: (attempt: number, error?: unknown) => boolean;
}

// ============================================
// Reconnection Strategies
// ============================================

/**
 * Exponential backoff with jitter
 * Reduces server load and collision probability
 */
export const exponentialBackoffStrategy: ReconnectionStrategy = {
  name: 'exponential-backoff',
  maxAttempts: 10,
  getDelay: (attempt: number) => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (0-30% random variation)
    const jitter = exponential * 0.3 * Math.random();
    return Math.floor(exponential + jitter);
  },
  shouldRetry: (attempt: number) => attempt < 10,
};

/**
 * Fast retry for temporary network blips
 * Tries quickly first, then backs off
 */
export const fastRetryStrategy: ReconnectionStrategy = {
  name: 'fast-retry',
  maxAttempts: 15,
  getDelay: (attempt: number) => {
    if (attempt < 3) return 500; // Fast retries for quick recovery
    if (attempt < 6) return 2000;
    if (attempt < 10) return 5000;
    return 10000;
  },
  shouldRetry: (attempt: number) => attempt < 15,
};

/**
 * Persistent connection for critical scenarios
 * Never gives up, but increasingly slower
 */
export const persistentStrategy: ReconnectionStrategy = {
  name: 'persistent',
  maxAttempts: Infinity,
  getDelay: (attempt: number) => {
    const baseDelay = 1000;
    const maxDelay = 60000; // Cap at 1 minute
    return Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
  },
  shouldRetry: () => true,
};

// ============================================
// Connection Health Monitor
// ============================================

export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'poor' | 'critical';
  metrics: {
    latency: number;
    packetLoss: number;
    reconnections: number;
    uptime: number;
  };
  issues: string[];
}

export class ConnectionHealthMonitor {
  private pingHistory: number[] = [];
  private maxHistorySize = 10;
  private reconnectionCount = 0;
  private connectionStartTime: number | null = null;
  private lastDisconnectTime: number | null = null;

  recordPing(latency: number): void {
    this.pingHistory.push(latency);
    if (this.pingHistory.length > this.maxHistorySize) {
      this.pingHistory.shift();
    }
  }

  recordConnection(): void {
    this.connectionStartTime = Date.now();
  }

  recordDisconnection(): void {
    this.lastDisconnectTime = Date.now();
    this.reconnectionCount++;
  }

  getAverageLatency(): number {
    if (this.pingHistory.length === 0) return 0;
    const sum = this.pingHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.pingHistory.length);
  }

  getUptime(): number {
    if (!this.connectionStartTime) return 0;
    return Date.now() - this.connectionStartTime;
  }

  assessHealth(): ConnectionHealth {
    const avgLatency = this.getAverageLatency();
    const uptime = this.getUptime();
    const issues: string[] = [];

    let status: ConnectionHealth['status'] = 'healthy';

    // Check latency
    if (avgLatency > 500) {
      issues.push('High latency detected');
      status = 'critical';
    } else if (avgLatency > 300) {
      issues.push('Elevated latency');
      status = status === 'healthy' ? 'poor' : status;
    } else if (avgLatency > 150) {
      issues.push('Moderate latency');
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check reconnection frequency
    if (this.reconnectionCount > 5) {
      issues.push('Frequent reconnections');
      status = 'poor';
    } else if (this.reconnectionCount > 2) {
      issues.push('Multiple reconnections');
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check connection stability
    if (uptime < 30000 && this.reconnectionCount > 0) {
      issues.push('Unstable connection');
      status = status === 'healthy' ? 'degraded' : status;
    }

    return {
      status,
      metrics: {
        latency: avgLatency,
        packetLoss: 0, // TODO: Implement packet loss tracking
        reconnections: this.reconnectionCount,
        uptime,
      },
      issues,
    };
  }

  reset(): void {
    this.pingHistory = [];
    this.reconnectionCount = 0;
    this.connectionStartTime = null;
    this.lastDisconnectTime = null;
  }
}

// ============================================
// Session Recovery Manager
// ============================================

export interface SessionData {
  playerId: string;
  matchId: string | null;
  queueState: 'in_queue' | 'not_in_queue';
  lastActivity: number;
}

export class SessionRecoveryManager {
  private storageKey = 'ws_session_data';

  saveSession(data: SessionData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[SessionRecovery] Failed to save session:', error);
    }
  }

  loadSession(): SessionData | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const session = JSON.parse(data) as SessionData;

      // Check if session is still valid (within last 5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - session.lastActivity > fiveMinutes) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('[SessionRecovery] Failed to load session:', error);
      return null;
    }
  }

  clearSession(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('[SessionRecovery] Failed to clear session:', error);
    }
  }

  updateActivity(): void {
    const session = this.loadSession();
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session);
    }
  }
}

// ============================================
// Network Condition Detector
// ============================================

export interface NetworkCondition {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData: boolean;
}

export function detectNetworkCondition(): NetworkCondition {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return {
      type: 'unknown',
      effectiveType: 'unknown',
      saveData: false,
    };
  }

  const conn = (navigator as any).connection;

  return {
    type: conn.type || 'unknown',
    effectiveType: conn.effectiveType || 'unknown',
    downlink: conn.downlink,
    rtt: conn.rtt,
    saveData: conn.saveData || false,
  };
}

export function shouldUseConservativeMode(): boolean {
  const network = detectNetworkCondition();

  // Use conservative mode for slow connections
  if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
    return true;
  }

  // Use conservative mode if save data is enabled
  if (network.saveData) {
    return true;
  }

  // Use conservative mode for high RTT
  if (network.rtt && network.rtt > 500) {
    return true;
  }

  return false;
}
