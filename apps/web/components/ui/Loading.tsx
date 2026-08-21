"use client";

/**
 * Loading State Components
 * Reusable loading indicators for various contexts
 */

import { cn } from "@/lib/helpers";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={cn(
        "rounded-full border-accent-primary border-t-transparent animate-spin",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export function LoadingScreen({ message, submessage }: LoadingScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        {message && (
          <p className="text-lg font-medium text-text-primary mb-1">{message}</p>
        )}
        {submessage && (
          <p className="text-sm text-text-secondary">{submessage}</p>
        )}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingOverlay({ isLoading, message }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-surface-base/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surface-elevated p-6 rounded-lg shadow-xl">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {message && (
          <p className="text-text-primary text-center">{message}</p>
        )}
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface-elevated rounded",
        animate && "animate-pulse",
        className
      )}
    />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
    </div>
  );
}
