/**
 * Centralized game mode labels and descriptions.
 * Online MODE_1 = Sliding, MODE_2 = Expanding Board (per game-engine).
 */

import type { GameMode } from '@/ws/types';
import type { GameMode as ChallengeGameMode } from '@/types/challenges';

export type LocalGameMode = 'MODE_1' | 'MODE_2' | 'MODE_3';
export type RoomGameMode = 1 | 2;

export interface GameModeInfo {
  id: string;
  label: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  canDraw: boolean;
}

const SLIDING: GameModeInfo = {
  id: 'sliding',
  label: 'Sliding',
  shortDescription: 'Marks slide after 3 placed',
  longDescription:
    'Fixed 3×3 board. After placing 3 marks, your oldest mark disappears on your next move. No draws possible.',
  icon: '⚡',
  canDraw: false,
};

const EXPANDING: GameModeInfo = {
  id: 'expanding',
  label: 'Expanding',
  shortDescription: 'Board grows each round',
  longDescription:
    'Round-based play. Board expands after each round (3×3 → 4×4 → 5×5). Win N-in-a-row on an N×N board.',
  icon: '🎯',
  canDraw: false,
};

const LOCAL_CLASSIC: GameModeInfo = {
  id: 'classic',
  label: 'Classic',
  shortDescription: 'Standard 3-in-a-row',
  longDescription: 'Traditional Tic-Tac-Toe on a 3×3 board. First to 3 in a row wins.',
  icon: '🎯',
  canDraw: true,
};

/** Online / backend game modes (MODE_1, MODE_2) */
export function getOnlineModeInfo(mode: GameMode): GameModeInfo {
  return mode === 'MODE_1' ? SLIDING : EXPANDING;
}

/** Challenge API modes (mode1, mode2) */
export function getChallengeModeInfo(mode: ChallengeGameMode | string): GameModeInfo {
  return mode === 'mode2' ? EXPANDING : SLIDING;
}

/** Room numeric modes (1, 2) */
export function getRoomModeInfo(mode: RoomGameMode): GameModeInfo {
  return mode === 1 ? SLIDING : EXPANDING;
}

/** Local-only modes including classic TTT and expanding rounds */
export function getLocalModeInfo(mode: LocalGameMode): GameModeInfo {
  switch (mode) {
    case 'MODE_1':
      return SLIDING;
    case 'MODE_2':
      return LOCAL_CLASSIC;
    case 'MODE_3':
      return {
        ...EXPANDING,
        label: 'Expanding Rounds',
        shortDescription: 'Best of 5, board grows',
        longDescription:
          'Round-based! Board grows each round (3×3 → 4×4 → 5×5). Need N-in-a-row on N×N board. Best of 5!',
      };
    default:
      return SLIDING;
  }
}

export function getOnlineModeLabel(mode: GameMode): string {
  return getOnlineModeInfo(mode).label;
}

export function getOnlineModeShortDescription(mode: GameMode): string {
  return getOnlineModeInfo(mode).shortDescription;
}

export function getChallengeModeLabel(mode: ChallengeGameMode | string): string {
  return getChallengeModeInfo(mode).label;
}

export function getRoomModeLabel(mode: RoomGameMode): string {
  return getRoomModeInfo(mode).label;
}

export function canModeDraw(mode: GameMode | LocalGameMode): boolean {
  if (mode === 'MODE_2' || mode === 'MODE_3') {
    // Local MODE_2 (classic) can draw; online MODE_2 is expanding (no draw in engine v1)
    return mode === 'MODE_2';
  }
  return getOnlineModeInfo(mode as GameMode).canDraw;
}

/** Count marks per player on the board */
export function countMarksOnBoard(
  cells: { value: 'X' | 'O' | null }[][],
): { X: number; O: number } {
  let X = 0;
  let O = 0;
  for (const row of cells) {
    for (const cell of row) {
      if (cell.value === 'X') X++;
      else if (cell.value === 'O') O++;
    }
  }
  return { X, O };
}

export const ONLINE_MODES: GameMode[] = ['MODE_1', 'MODE_2'];
