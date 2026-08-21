"use client";

/**
 * useErrorHandler Hook
 * Provides centralized error handling with toast notifications
 */

import { useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  classifyError,
  getUserFriendlyError,
  logError,
  ErrorSeverity,
  createErrorMessage,
} from "@/lib/errors";

interface UseErrorHandlerOptions {
  context?: string;
  onError?: (error: unknown) => void;
  showToast?: boolean;
}

interface UseErrorHandlerReturn {
  handleError: (error: unknown, customContext?: string) => void;
  handleApiError: (error: unknown, customContext?: string) => void;
  handleWebSocketError: (error: unknown, customContext?: string) => void;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const { context, onError, showToast = true } = options;
  const { addToast } = useToast();

  const handleError = useCallback(
    (error: unknown, customContext?: string) => {
      const errorContext = customContext || context;
      const classified = classifyError(error);
      const friendly = getUserFriendlyError(error);

      // Log the error
      logError(error, errorContext);

      // Show toast notification if enabled
      if (showToast) {
        const toastType =
          classified.severity === ErrorSeverity.LOW ? "warning" : "error";

        addToast({
          type: toastType,
          title: friendly.title,
          message: friendly.message,
          duration: classified.severity === ErrorSeverity.CRITICAL ? 0 : 5000,
        });
      }

      // Call custom error handler if provided
      onError?.(error);
    },
    [context, onError, showToast, addToast]
  );

  const handleApiError = useCallback(
    (error: unknown, customContext?: string) => {
      const errorContext = customContext || context || "API Request";
      handleError(error, errorContext);
    },
    [context, handleError]
  );

  const handleWebSocketError = useCallback(
    (error: unknown, customContext?: string) => {
      const errorContext = customContext || context || "WebSocket";
      handleError(error, errorContext);
    },
    [context, handleError]
  );

  return {
    handleError,
    handleApiError,
    handleWebSocketError,
  };
}

/**
 * useAsyncError Hook
 * Wraps async functions with error handling
 */
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  const wrapAsync = useCallback(
    <T, Args extends any[]>(
      fn: (...args: Args) => Promise<T>,
      context?: string
    ) => {
      return async (...args: Args): Promise<T | undefined> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, context);
          return undefined;
        }
      };
    },
    [handleError]
  );

  return { wrapAsync };
}
