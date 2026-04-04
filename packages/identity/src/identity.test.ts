/**
 * Tests for player identity system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPlayerIdentity } from './PlayerIdentity';
import type { PlayerIdentity } from './PlayerIdentity';
import { IdentityManager } from './identityManager';
import type { IdentityStore } from './IdentityStore';

describe('PlayerIdentity', () => {
  it('should create an identity with all required fields', () => {
    const identity = createPlayerIdentity('TestPlayer');

    expect(identity.playerId).toBeDefined();
    expect(typeof identity.playerId).toBe('string');
    expect(identity.playerId.length).toBeGreaterThan(0);
    expect(identity.displayName).toBe('TestPlayer');
    expect(identity.createdAt).toBeDefined();
    expect(typeof identity.createdAt).toBe('number');
  });

  it('should generate unique IDs for different identities', () => {
    const id1 = createPlayerIdentity('Player1');
    const id2 = createPlayerIdentity('Player2');

    expect(id1.playerId).not.toBe(id2.playerId);
  });
});

describe('IdentityManager', () => {
  let mockStore: IdentityStore;
  let savedIdentity: PlayerIdentity | null;

  beforeEach(() => {
    savedIdentity = null;
    mockStore = {
      load: vi.fn(async () => savedIdentity),
      save: vi.fn(async (identity: PlayerIdentity) => {
        savedIdentity = identity;
      }),
    };
  });

  it('should create a new identity when none exists', async () => {
    const manager = new IdentityManager(mockStore);
    const promptFn = vi.fn(async () => 'NewPlayer');

    const identity = await manager.initialize(promptFn);

    expect(promptFn).toHaveBeenCalledOnce();
    expect(identity.displayName).toBe('NewPlayer');
    expect(identity.playerId).toBeDefined();
    expect(mockStore.save).toHaveBeenCalledWith(identity);
  });

  it('should load existing identity without prompting', async () => {
    const existing: PlayerIdentity = {
      playerId: 'existing-id-123',
      displayName: 'ExistingPlayer',
      createdAt: Date.now() - 10000,
    };
    savedIdentity = existing;

    const manager = new IdentityManager(mockStore);
    const promptFn = vi.fn(async () => 'ShouldNotBeUsed');

    const identity = await manager.initialize(promptFn);

    expect(promptFn).not.toHaveBeenCalled();
    expect(identity.playerId).toBe('existing-id-123');
    expect(identity.displayName).toBe('ExistingPlayer');
  });

  it('should allow renaming while preserving playerId', async () => {
    const manager = new IdentityManager(mockStore);
    await manager.initialize(async () => 'OriginalName');

    const originalId = manager.getCurrentPlayer().playerId;
    await manager.renamePlayer('RenamedPlayer');

    expect(manager.getCurrentPlayer().displayName).toBe('RenamedPlayer');
    expect(manager.getCurrentPlayer().playerId).toBe(originalId);
  });

  it('should throw when getCurrentPlayer called before initialize', () => {
    const manager = new IdentityManager(mockStore);

    expect(() => manager.getCurrentPlayer()).toThrow('Identity not initialized');
  });

  it('should return null for getCurrentPlayerOrNull before initialize', () => {
    const manager = new IdentityManager(mockStore);

    expect(manager.getCurrentPlayerOrNull()).toBeNull();
  });
});
