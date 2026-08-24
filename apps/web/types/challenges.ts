/**
 * Challenge System Types
 */

export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
export type GameMode = 'mode1' | 'mode2';

export interface Challenge {
  challengeId: string;
  challengerId: string;
  challengerUsername: string;
  challengerDisplayName?: string;
  challengerRating: number;
  challengedId: string;
  challengedUsername: string;
  challengedDisplayName?: string;
  challengedRating: number;
  mode: GameMode;
  status: ChallengeStatus;
  expiresAt: string;
  createdAt: string;
}

export interface SendChallengePayload {
  challengedId: string;
  mode: GameMode;
}

export interface RespondToChallengePayload {
  challengeId: string;
  accept: boolean;
}

/**
 * Private Match Types
 */

export type PrivateMatchStatus = 'WAITING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface PrivateMatch {
  matchId: string;
  code: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName?: string;
  creatorRating: number;
  mode: GameMode;
  status: PrivateMatchStatus;
  expiresAt: string;
  createdAt: string;
  joinUrl: string;
}

export interface CreatePrivateMatchPayload {
  mode: GameMode;
}

export interface JoinPrivateMatchPayload {
  code: string;
}
