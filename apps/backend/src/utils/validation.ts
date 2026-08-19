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
