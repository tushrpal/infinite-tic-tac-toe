import { apiRequest } from "./api";

export interface MatchMovePayload {
  index: number;
  player: "X" | "O";
  turn: number;
  timestamp?: number;
}

export interface MatchGamePayload {
  winner: "X" | "O" | null;
  totalMoves: number;
  boardSize: number;
  moves: MatchMovePayload[];
}

export interface MatchResultPayload {
  matchId: string;
  mode: "MODE_1" | "MODE_2";
  isRanked: boolean;
  difficulty: string;
  players: Array<{
    id: string;
    type: "human" | "bot";
    username?: string;
    displayName?: string;
    rating?: number;
  }>;
  games: MatchGamePayload[];
  winner: string | null;
  roundsPlayed: number;
  totalMoves: number;
  drawCount: number;
  createdAt: number;
}

export async function fetchMatch(matchId: string): Promise<MatchResultPayload> {
  return apiRequest<MatchResultPayload>(`/matches/${matchId}`);
}
