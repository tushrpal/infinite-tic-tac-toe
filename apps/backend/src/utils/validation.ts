/**
 * Validation utilities for user input
 */

/**
 * Validate username format
 * - 3-20 characters
 * - Alphanumeric + underscore only
 * - Cannot start or end with underscore
 */
export function isValidUsername(username: string): boolean {
  if (typeof username !== 'string') {
    return false;
  }

  // Length check
  if (username.length < 3 || username.length > 20) {
    return false;
  }

  // Pattern check: alphanumeric + underscore, cannot start/end with underscore
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

  return pattern.test(username);
}

/**
 * Validate display name format
 * - 1-50 characters
 * - Can contain any printable characters
 */
export function isValidDisplayName(displayName: string): boolean {
  if (typeof displayName !== 'string') {
    return false;
  }

  const trimmed = displayName.trim();

  if (trimmed.length < 1 || trimmed.length > 50) {
    return false;
  }

  return true;
}

/**
 * Sanitize username (lowercase, trim)
 */
export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Validate display name format
 * - 1-30 characters after trimming
 * - Unicode letters, numbers, spaces, special chars (emoji, punctuation) allowed
 * - Control characters not allowed
 */
export function validateDisplayName(displayName: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  // Trim whitespace
  const trimmed = displayName.trim();

  // Check not empty
  if (!trimmed) {
    return { valid: false, error: 'Display name cannot be empty' };
  }

  // Check length
  if (trimmed.length > 30) {
    return { valid: false, error: 'Display name must be 30 characters or less' };
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: 'Display name contains invalid characters' };
  }

  return { valid: true, sanitized: trimmed };
}
