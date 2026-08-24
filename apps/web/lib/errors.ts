/**
 * Centralized Error Handling System
 * Provides user-friendly error messages and categorization
 */

// ============================================
// Error Types & Categories
// ============================================

export enum ErrorCategory {
  NETWORK = 'network',
  WEBSOCKET = 'websocket',
  API = 'api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  GAME_STATE = 'game_state',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',       // Non-blocking, informational
  MEDIUM = 'medium', // May affect functionality
  HIGH = 'high',     // Blocks core functionality
  CRITICAL = 'critical', // Complete failure
}

// ============================================
// User-Friendly Error Messages
// ============================================

interface ErrorMessageConfig {
  title: string;
  message: string;
  action?: string; // Suggested user action
  canRetry?: boolean;
}

const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
  // Network Errors
  'network.offline': {
    title: 'No Internet Connection',
    message: 'Please check your network connection and try again.',
    action: 'Check your internet connection',
    canRetry: true,
  },
  'network.timeout': {
    title: 'Connection Timeout',
    message: 'The server is taking too long to respond.',
    action: 'Try again in a moment',
    canRetry: true,
  },
  'network.failed': {
    title: 'Connection Failed',
    message: 'Unable to reach the server.',
    action: 'Check your connection and retry',
    canRetry: true,
  },

  // WebSocket Errors
  'websocket.disconnected': {
    title: 'Connection Lost',
    message: 'Lost connection to game server. Attempting to reconnect...',
    action: 'Please wait while we reconnect',
    canRetry: false,
  },
  'websocket.failed': {
    title: 'Connection Failed',
    message: 'Unable to connect to game server.',
    action: 'Refresh the page to try again',
    canRetry: true,
  },
  'websocket.max_reconnect': {
    title: 'Reconnection Failed',
    message: 'Could not reconnect after multiple attempts.',
    action: 'Refresh the page to reconnect',
    canRetry: true,
  },

  // API Errors
  'api.not_found': {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    action: 'Go back and try again',
    canRetry: false,
  },
  'api.unauthorized': {
    title: 'Authentication Required',
    message: 'You need to be signed in to access this.',
    action: 'Sign in to continue',
    canRetry: false,
  },
  'api.forbidden': {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    action: 'Contact support if you believe this is an error',
    canRetry: false,
  },
  'api.server_error': {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    action: 'Try again in a moment',
    canRetry: true,
  },
  'api.rate_limit': {
    title: 'Too Many Requests',
    message: 'You are making requests too quickly.',
    action: 'Please wait a moment before trying again',
    canRetry: true,
  },

  // Game State Errors
  'game.invalid_move': {
    title: 'Invalid Move',
    message: 'That move is not allowed.',
    action: 'Try a different cell',
    canRetry: false,
  },
  'game.not_your_turn': {
    title: 'Not Your Turn',
    message: 'Please wait for your opponent to move.',
    action: 'Wait for your turn',
    canRetry: false,
  },
  'game.match_ended': {
    title: 'Match Ended',
    message: 'This match has already concluded.',
    action: 'Start a new match',
    canRetry: false,
  },
  'game.opponent_disconnected': {
    title: 'Opponent Disconnected',
    message: 'Your opponent has lost connection.',
    action: 'Waiting for them to reconnect',
    canRetry: false,
  },

  // Validation Errors
  'validation.required': {
    title: 'Required Field',
    message: 'This field is required.',
    action: 'Please fill in this field',
    canRetry: false,
  },
  'validation.invalid_format': {
    title: 'Invalid Format',
    message: 'The format of your input is incorrect.',
    action: 'Check your input and try again',
    canRetry: false,
  },
  'validation.username_taken': {
    title: 'Username Taken',
    message: 'This username is already in use.',
    action: 'Try a different username',
    canRetry: false,
  },

  // Unknown
  'unknown': {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    action: 'Try again or refresh the page',
    canRetry: true,
  },
};

// ============================================
// Error Classification
// ============================================

export function classifyError(error: unknown): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  originalError: unknown;
} {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      code: 'network.failed',
      originalError: error,
    };
  }

  // API errors with status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;

    if (status === 0) {
      return {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        code: 'network.offline',
        originalError: error,
      };
    }

    if (status === 401) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.MEDIUM,
        code: 'api.unauthorized',
        originalError: error,
      };
    }

    if (status === 403) {
      return {
        category: ErrorCategory.API,
        severity: ErrorSeverity.MEDIUM,
        code: 'api.forbidden',
        originalError: error,
      };
    }

    if (status === 404) {
      return {
        category: ErrorCategory.API,
        severity: ErrorSeverity.LOW,
        code: 'api.not_found',
        originalError: error,
      };
    }

    if (status === 429) {
      return {
        category: ErrorCategory.API,
        severity: ErrorSeverity.MEDIUM,
        code: 'api.rate_limit',
        originalError: error,
      };
    }

    if (status >= 500) {
      return {
        category: ErrorCategory.API,
        severity: ErrorSeverity.HIGH,
        code: 'api.server_error',
        originalError: error,
      };
    }
  }

  // Timeout errors
  if (error instanceof Error && (
    error.message.includes('timeout') ||
    error.message.includes('timed out')
  )) {
    return {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      code: 'network.timeout',
      originalError: error,
    };
  }

  // WebSocket errors
  if (error && typeof error === 'object' && 'type' in error) {
    const type = (error as any).type;
    if (type === 'websocket' || type === 'close') {
      return {
        category: ErrorCategory.WEBSOCKET,
        severity: ErrorSeverity.HIGH,
        code: 'websocket.failed',
        originalError: error,
      };
    }
  }

  // Default unknown
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    code: 'unknown',
    originalError: error,
  };
}

// ============================================
// Get User-Friendly Error Message
// ============================================

export function getUserFriendlyError(
  error: unknown,
  fallbackMessage?: string
): ErrorMessageConfig {
  const classified = classifyError(error);
  const config = ERROR_MESSAGES[classified.code];

  if (config) {
    return config;
  }

  // Extract message from error object if available
  let extractedMessage = fallbackMessage || 'An unexpected error occurred.';
  if (error instanceof Error) {
    extractedMessage = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    extractedMessage = String((error as any).message);
  }

  return {
    title: 'Error',
    message: extractedMessage,
    action: 'Try again',
    canRetry: true,
  };
}

// ============================================
// Error Handler Hook Helper
// ============================================

export interface ErrorHandler {
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
}

export function createErrorMessage(
  error: unknown,
  context?: string
): {
  type: 'error' | 'warning';
  title: string;
  message: string;
} {
  const { severity } = classifyError(error);
  const friendly = getUserFriendlyError(error);

  const type = severity === ErrorSeverity.LOW ? 'warning' : 'error';

  return {
    type,
    title: context ? `${context}: ${friendly.title}` : friendly.title,
    message: friendly.action
      ? `${friendly.message} ${friendly.action}`
      : friendly.message,
  };
}

// ============================================
// Retry Logic
// ============================================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error) => {
      const { code } = classifyError(error);
      const config = ERROR_MESSAGES[code];
      return config?.canRetry ?? false;
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxAttempts - 1 && shouldRetry(error, attempt)) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

// ============================================
// Log Error for Debugging
// ============================================

export function logError(
  error: unknown,
  context?: string,
  additionalData?: Record<string, any>
): void {
  const classified = classifyError(error);
  const friendly = getUserFriendlyError(error);

  console.error('[Error Handler]', {
    context,
    category: classified.category,
    severity: classified.severity,
    code: classified.code,
    userMessage: friendly.message,
    originalError: classified.originalError,
    additionalData,
    timestamp: new Date().toISOString(),
  });
}
