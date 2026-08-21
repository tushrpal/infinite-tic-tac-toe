"use client";

/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import React, { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { logError, getUserFriendlyError } from "@/lib/errors";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error
    logError(error, "React Error Boundary", {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      const friendly = getUserFriendlyError(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-surface-base">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-accent-error/20">
              <svg
                className="w-10 h-10 text-accent-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-text-primary">
              {friendly.title}
            </h2>

            <p className="text-text-secondary mb-6">
              {friendly.message}
            </p>

            {friendly.action && (
              <p className="text-sm text-text-muted mb-6">
                {friendly.action}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.href = "/"}
              >
                Go Home
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-text-muted cursor-pointer hover:text-text-secondary">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-surface-elevated rounded text-xs overflow-auto max-h-40 text-text-secondary">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simplified Error Display Component
 * For inline error states
 */
interface ErrorDisplayProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps) {
  const friendly = getUserFriendlyError(error);

  return (
    <div className={className}>
      <div className="p-6 rounded-lg bg-accent-error/10 border border-accent-error/30">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-accent-error flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">
              {friendly.title}
            </h3>
            <p className="text-sm text-text-secondary mb-2">
              {friendly.message}
            </p>
            {friendly.action && (
              <p className="text-xs text-text-muted">
                {friendly.action}
              </p>
            )}
          </div>
        </div>
        {friendly.canRetry && onRetry && (
          <div className="mt-4">
            <Button size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
