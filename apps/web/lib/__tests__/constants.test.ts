import { describe, it, expect } from 'vitest';
import { ROUTES } from '../constants';

describe('Routes', () => {
  it('should define PLAY_ROOMS route', () => {
    expect(ROUTES.PLAY_ROOMS).toBe('/play/rooms');
  });
});
