/**
 * PlayerIdentity represents a stable player identity without authentication.
 * This is intentionally minimal - identity ≠ authentication at this stage.
 */
export interface PlayerIdentity {
  /** Stable UUID identifying this player */
  playerId: string;
  
  /** User-chosen display name (e.g., "Tushar") */
  displayName: string;
  
  /** Timestamp when this identity was created */
  createdAt: number;
}

/**
 * Creates a new player identity with a generated UUID.
 */
export function createPlayerIdentity(displayName: string): PlayerIdentity {
  return {
    playerId: generateUUID(),
    displayName,
    createdAt: Date.now(),
  };
}

/**
 * Simple UUID v4 generator (crypto-based).
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for Node.js < 16 or environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
