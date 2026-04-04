export interface EloChange {
  changeA: number;
  changeB: number;
}

export type MatchOutcome = 'win' | 'loss' | 'draw';

const DEFAULT_K_FACTOR = 32;
const NEW_PLAYER_K_FACTOR = 40;
const EXPERIENCED_PLAYER_K_FACTOR = 20;
const NEW_PLAYER_MATCH_THRESHOLD = 30;
const EXPERIENCED_PLAYER_MATCH_THRESHOLD = 100;

type EloKFactorOptions = {
  kFactorA?: number;
  kFactorB?: number;
};

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function scoreForOutcome(outcome: MatchOutcome): number {
  if (outcome === 'win') return 1;
  if (outcome === 'draw') return 0.5;
  return 0;
}

export function resolveKFactorByExperience(rankedMatchesPlayed: number): number {
  if (rankedMatchesPlayed < NEW_PLAYER_MATCH_THRESHOLD) {
    return NEW_PLAYER_K_FACTOR;
  }

  if (rankedMatchesPlayed >= EXPERIENCED_PLAYER_MATCH_THRESHOLD) {
    return EXPERIENCED_PLAYER_K_FACTOR;
  }

  return DEFAULT_K_FACTOR;
}

export function calculateEloChange(
  ratingA: number,
  ratingB: number,
  outcomeForA: MatchOutcome,
  options: EloKFactorOptions = {}
): EloChange {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = expectedScore(ratingB, ratingA);
  const scoreA = scoreForOutcome(outcomeForA);
  const scoreB = 1 - scoreA;

  const kFactorA = options.kFactorA ?? DEFAULT_K_FACTOR;
  const kFactorB = options.kFactorB ?? DEFAULT_K_FACTOR;

  const changeA = Math.round(kFactorA * (scoreA - expectedA));
  const changeB = Math.round(kFactorB * (scoreB - expectedB));

  return {
    changeA,
    changeB,
  };
}
