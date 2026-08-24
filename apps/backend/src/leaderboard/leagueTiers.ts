/**
 * League tier utilities for determining player ranks
 */

export type LeagueTier = {
  name: string;
  minRating: number;
  maxRating: number;
  color: string;
};

// These tiers match the frontend constants
const LEAGUE_TIERS: LeagueTier[] = [
  { name: 'Bronze', minRating: 400, maxRating: 799, color: '#cd7f32' },
  { name: 'Silver', minRating: 800, maxRating: 999, color: '#c0c0c0' },
  { name: 'Gold', minRating: 1000, maxRating: 1399, color: '#ffd700' },
  { name: 'Platinum', minRating: 1400, maxRating: 1799, color: '#e5e4e2' },
  { name: 'Diamond', minRating: 1800, maxRating: 2199, color: '#b9f2ff' },
  { name: 'Master', minRating: 2200, maxRating: 2999, color: '#9966cc' },
  { name: 'Grandmaster', minRating: 3000, maxRating: Infinity, color: '#ff4444' },
];

/**
 * Get the league tier for a given rating
 */
export function getLeagueTier(rating: number): LeagueTier {
  // Find the tier where rating >= minRating and rating < maxRating
  const tier = LEAGUE_TIERS.find(
    (t) => rating >= t.minRating && rating <= t.maxRating
  );

  // Default to Bronze if rating is below all tiers
  return tier ?? LEAGUE_TIERS[0];
}

/**
 * Get league tier by name
 */
export function getLeagueTierByName(name: string): LeagueTier | null {
  return LEAGUE_TIERS.find((t) => t.name.toLowerCase() === name.toLowerCase()) ?? null;
}

/**
 * Get all league tiers
 */
export function getAllLeagueTiers(): LeagueTier[] {
  return LEAGUE_TIERS;
}
