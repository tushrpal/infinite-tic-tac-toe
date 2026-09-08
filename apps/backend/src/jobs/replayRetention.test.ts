import { describe, expect, it } from 'vitest';
import {
  canStripReplayForParticipants,
  isReplayAvailable,
  isReplayStrippedPayload,
} from './replayRetention';

describe('replayRetention', () => {
  describe('isReplayStrippedPayload', () => {
    it('detects stripped payload marker', () => {
      expect(isReplayStrippedPayload({ replayStripped: true, matchId: 'm1' })).toBe(true);
      expect(isReplayStrippedPayload({ matchId: 'm1', games: [] })).toBe(false);
      expect(isReplayStrippedPayload(null)).toBe(false);
    });
  });

  describe('isReplayAvailable', () => {
    it('returns false for stripped payloads', () => {
      expect(isReplayAvailable({ replayStripped: true }, 0)).toBe(false);
      expect(isReplayAvailable({ replayStripped: true }, 5)).toBe(false);
      expect(isReplayAvailable(null, 5, true)).toBe(false);
    });

    it('returns true when moves or games payload exist', () => {
      expect(isReplayAvailable({ games: [{ moves: [] }] }, 0)).toBe(true);
      expect(isReplayAvailable({}, 3)).toBe(true);
    });
  });

  describe('canStripReplayForParticipants', () => {
    it('requires every participant to have enough newer matches', () => {
      expect(
        canStripReplayForParticipants({ a: 3, b: 3 }),
      ).toBe(true);

      expect(
        canStripReplayForParticipants({ a: 3, b: 2 }),
      ).toBe(false);

      expect(
        canStripReplayForParticipants({ a: 5 }),
      ).toBe(true);

      expect(
        canStripReplayForParticipants({}),
      ).toBe(false);
    });
  });
});
