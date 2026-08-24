"use client";

/**
 * Connection Status Component
 * Shows real-time WebSocket connection status with visual feedback
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/helpers";
import type { ConnectionState } from "@/ws/types";

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  className?: string;
  compact?: boolean;
}

export function ConnectionStatus({
  connectionState,
  className,
  compact = false,
}: ConnectionStatusProps) {
  const { status, latency, reconnectAttempts, error } = connectionState;

  const [isVisible, setIsVisible] = useState(status !== "connected");

  // Auto-hide when connected after 2 seconds
  useEffect(() => {
    if (status === "connected") {
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [status]);

  if (!isVisible) return null;

  const statusConfig = {
    connecting: {
      bg: "bg-accent-primary/10",
      border: "border-accent-primary",
      text: "text-accent-primary",
      icon: "🔄",
      label: "Connecting...",
      description: "Establishing connection to server",
    },
    connected: {
      bg: "bg-accent-success/10",
      border: "border-accent-success",
      text: "text-accent-success",
      icon: "✓",
      label: "Connected",
      description: latency ? `Latency: ${latency}ms` : "Connection established",
    },
    reconnecting: {
      bg: "bg-accent-warning/10",
      border: "border-accent-warning",
      text: "text-accent-warning",
      icon: "⚠",
      label: "Reconnecting...",
      description: reconnectAttempts
        ? `Attempt ${reconnectAttempts} - Please wait`
        : "Connection lost - attempting to reconnect",
    },
    disconnected: {
      bg: "bg-surface-elevated",
      border: "border-border-subtle",
      text: "text-text-muted",
      icon: "○",
      label: "Disconnected",
      description: "Not connected to server",
    },
    error: {
      bg: "bg-accent-error/10",
      border: "border-accent-error",
      text: "text-accent-error",
      icon: "✕",
      label: "Connection Error",
      description: error || "Unable to connect to server",
    },
  };

  const config = statusConfig[status];

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          config.bg,
          config.border,
          "border",
          className
        )}
      >
        <span className={cn("text-base", config.text)}>{config.icon}</span>
        <span className={cn("font-medium", config.text)}>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg flex items-center gap-3",
        config.bg,
        config.border,
        "border",
        "animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          config.text,
          status === "connecting" || status === "reconnecting"
            ? "animate-pulse"
            : ""
        )}
      >
        <span className="text-xl">{config.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm", config.text)}>
          {config.label}
        </div>
        <div className="text-xs text-text-muted mt-0.5">
          {config.description}
        </div>
      </div>

      {(status === "reconnecting" || status === "error") && (
        <button
          onClick={() => window.location.reload()}
          className={cn(
            "flex-shrink-0 px-3 py-1 rounded text-xs font-medium",
            "bg-surface-elevated hover:bg-surface-base",
            "border border-border-subtle",
            "transition-colors duration-150"
          )}
        >
          Refresh
        </button>
      )}
    </div>
  );
}

/**
 * Latency Indicator
 * Shows connection quality based on latency
 */
interface LatencyIndicatorProps {
  latency: number;
  className?: string;
}

export function LatencyIndicator({
  latency,
  className,
}: LatencyIndicatorProps) {
  const getQuality = (ms: number) => {
    if (ms < 50) return { label: "Excellent", color: "text-accent-success" };
    if (ms < 100) return { label: "Good", color: "text-accent-primary" };
    if (ms < 200) return { label: "Fair", color: "text-accent-warning" };
    return { label: "Poor", color: "text-accent-error" };
  };

  const quality = getQuality(latency);

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-text-muted">Latency:</span>
      <span className={cn("font-medium", quality.color)}>
        {latency}ms
      </span>
      <span className="text-text-muted text-xs">({quality.label})</span>
    </div>
  );
}

/**
 * Offline Banner
 * Shows when user is offline
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[500] p-3 bg-accent-error text-white text-center font-medium animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        <span>No Internet Connection</span>
      </div>
      <p className="text-sm mt-1 opacity-90">
        Please check your network and try again
      </p>
    </div>
  );
}
