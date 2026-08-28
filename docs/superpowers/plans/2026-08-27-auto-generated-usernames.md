# Auto-Generated Usernames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform authentication so usernames are auto-generated unique identifiers while display names become the primary user-facing identity.

**Architecture:** Backend generates usernames from sanitized display names with random suffixes. Frontend collects only display name during registration. All UI components show display name prominently with username for disambiguation.

**Tech Stack:** TypeScript, Prisma ORM, Express.js, React, Next.js

**Spec:** `docs/superpowers/specs/2026-08-27-auto-generated-usernames-design.md`

## Global Constraints

- Display names: 1-30 characters, Unicode/spaces/emoji allowed, trim whitespace
- Generated usernames: `{sanitized_displayname}_{xxxx}` format, 3-30 chars, lowercase alphanumeric + underscore
- Random suffix: 4 alphanumeric characters
- Uniqueness retries: max 3 attempts before failing
- No backward compatibility needed - truncate test data
- All commits use conventional commit format: `feat:`, `fix:`, `test:`

---

## Task 1: Display Name Validation

**Files:**
- Modify: `apps/backend/src/utils/validation.ts`
- Test: `apps/backend/src/utils/validation.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `validateDisplayName(displayName: string): { valid: boolean; sanitized?: string; error?: string }`

- [ ] **Step 1: Write failing test for display name validation**

Create `apps/backend/src/utils/validation.test.ts` if it doesn't exist, or add to existing file:

```typescript
import { validateDisplayName } from './validation';

describe('validateDisplayName', () => {
  it('should accept valid display names', () => {
    const result = validateDisplayName('Cool Player');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Cool Player');
  });

  it('should trim whitespace', () => {
    const result = validateDisplayName('  Player Name  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Player Name');
  });

  it('should accept Unicode characters', () => {
    const result = validateDisplayName('José García 🎮');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('José García 🎮');
  });

  it('should reject empty string', () => {
    const result = validateDisplayName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name cannot be empty');
  });

  it('should reject whitespace-only string', () => {
    const result = validateDisplayName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name cannot be empty');
  });

  it('should reject names over 30 characters', () => {
    const result = validateDisplayName('a'.repeat(31));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name must be 30 characters or less');
  });

  it('should reject control characters', () => {
    const result = validateDisplayName('Player\x00Name');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Display name contains invalid characters');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && npm test -- validation.test.ts`
Expected: FAIL with "validateDisplayName is not a function" or similar

- [ ] **Step 3: Implement display name validation**

Add to `apps/backend/src/utils/validation.ts`:

```typescript
/**
 * Validate display name format
 * - 1-30 characters after trimming
 * - Unicode letters, numbers, spaces, special chars (emoji, punctuation) allowed
 * - Control characters not allowed
 */
export function validateDisplayName(displayName: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  // Trim whitespace
  const trimmed = displayName.trim();
  
  // Check not empty
  if (!trimmed) {
    return { valid: false, error: 'Display name cannot be empty' };
  }
  
  // Check length
  if (trimmed.length > 30) {
    return { valid: false, error: 'Display name must be 30 characters or less' };
  }
  
  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: 'Display name contains invalid characters' };
  }
  
  return { valid: true, sanitized: trimmed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && npm test -- validation.test.ts`
Expected: PASS for all display name validation tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/utils/validation.ts apps/backend/src/utils/validation.test.ts
git commit -m "feat: add display name validation with Unicode support

- Add validateDisplayName() function
- Accepts 1-30 chars, Unicode, spaces, emoji
- Trims whitespace and rejects control characters
- Add comprehensive test coverage"
```

---

## Task 2: Username Generation Algorithm

**Files:**
- Modify: `apps/backend/src/auth/authUtils.ts`
- Test: `apps/backend/src/auth/authUtils.test.ts`

**Interfaces:**
- Consumes: `getPrismaClient()` from `../storage/prismaClient`
- Produces: `generateUniqueUsername(displayName: string): Promise<string>`

- [ ] **Step 1: Write failing test for username generation**

Create `apps/backend/src/auth/authUtils.test.ts` if it doesn't exist, or add to existing:

```typescript
import { generateUniqueUsername } from './authUtils';
import { getPrismaClient } from '../storage/prismaClient';

// Mock Prisma
jest.mock('../storage/prismaClient');

describe('generateUniqueUsername', () => {
  const mockPrisma = {
    player: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  it('should generate username from ASCII display name', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null); // Username available
    
    const username = await generateUniqueUsername('Cool Player');
    
    expect(username).toMatch(/^coolplayer_[a-z0-9]{4}$/);
  });

  it('should generate username from Unicode display name', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null);
    
    const username = await generateUniqueUsername('José García');
    
    expect(username).toMatch(/^josegarcia_[a-z0-9]{4}$/);
  });

  it('should handle emoji-only display name', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null);
    
    const username = await generateUniqueUsername('🎮🎮🎮');
    
    expect(username).toMatch(/^player_[a-z0-9]{4}$/);
  });

  it('should handle single character display name', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null);
    
    const username = await generateUniqueUsername('A');
    
    expect(username).toMatch(/^a_[a-z0-9]{4}$/);
  });

  it('should truncate long base to 20 chars', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null);
    
    const username = await generateUniqueUsername('VeryLongDisplayNameThatExceedsTwentyCharacters');
    
    expect(username.length).toBeLessThanOrEqual(25); // 20 base + _ + 4 suffix
    expect(username).toMatch(/^verylongdisplaynamet_[a-z0-9]{4}$/);
  });

  it('should retry on collision', async () => {
    // First attempt collides, second succeeds
    mockPrisma.player.findUnique
      .mockResolvedValueOnce({ username: 'coolplayer_a1b2' }) // Collision
      .mockResolvedValueOnce(null); // Available
    
    const username = await generateUniqueUsername('Cool Player');
    
    expect(mockPrisma.player.findUnique).toHaveBeenCalledTimes(2);
    expect(username).toMatch(/^coolplayer_[a-z0-9]{4}$/);
  });

  it('should throw error after 3 failed retries', async () => {
    // All 3 attempts collide
    mockPrisma.player.findUnique.mockResolvedValue({ username: 'taken' });
    
    await expect(generateUniqueUsername('Cool Player')).rejects.toThrow(
      'Failed to generate unique username after 3 attempts'
    );
    
    expect(mockPrisma.player.findUnique).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && npm test -- authUtils.test.ts`
Expected: FAIL with "generateUniqueUsername is not a function"

- [ ] **Step 3: Implement username generation**

Add to `apps/backend/src/auth/authUtils.ts`:

```typescript
/**
 * Generate a unique username from display name
 * Format: {sanitized_displayname}_{xxxx}
 * - Sanitizes display name (lowercase, alphanumeric only)
 * - Adds random 4-char suffix
 * - Retries up to 3 times on collision
 */
export async function generateUniqueUsername(displayName: string): Promise<string> {
  const prisma = getPrismaClient();
  const MAX_RETRIES = 3;
  
  // Sanitize display name
  let base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
    .trim();
  
  // If empty or too short, use default
  if (base.length < 1) {
    base = 'player';
  }
  
  // Truncate to max 20 chars to leave room for suffix
  if (base.length > 20) {
    base = base.substring(0, 20);
  }
  
  // Try to generate unique username
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Generate random 4-char alphanumeric suffix
    const suffix = generateRandomSuffix();
    const username = `${base}_${suffix}`;
    
    // Check uniqueness
    const existing = await prisma.player.findUnique({
      where: { username },
      select: { username: true },
    });
    
    if (!existing) {
      return username;
    }
  }
  
  throw new Error('Failed to generate unique username after 3 attempts');
}

/**
 * Generate random 4-character alphanumeric suffix
 */
function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return suffix;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && npm test -- authUtils.test.ts`
Expected: PASS for all username generation tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/auth/authUtils.ts apps/backend/src/auth/authUtils.test.ts
git commit -m "feat: add username auto-generation from display names

- Add generateUniqueUsername() with sanitization
- Format: {sanitized_base}_{xxxx} with 4-char suffix
- Retry up to 3 times on collision
- Handle edge cases: emoji-only, Unicode, single char
- Add comprehensive test coverage"
```

---

## Task 3: Database Migration - Truncate Test Data

**Files:**
- Create: `apps/backend/prisma/migrations/20260827000000_truncate_for_username_changes/migration.sql`

**Interfaces:**
- Consumes: Existing database schema
- Produces: Empty tables ready for new username generation flow

- [ ] **Step 1: Create migration file**

Create `apps/backend/prisma/migrations/20260827000000_truncate_for_username_changes/migration.sql`:

```sql
-- Truncate all tables to start fresh with new username generation system
-- Order matters: children first, then parent tables

-- Delete all sessions
TRUNCATE TABLE "Session" CASCADE;

-- Delete all friend-related data
TRUNCATE TABLE "FriendRequest" CASCADE;
TRUNCATE TABLE "Friendship" CASCADE;

-- Delete all match-related data
TRUNCATE TABLE "MatchPlayer" CASCADE;
TRUNCATE TABLE "Match" CASCADE;

-- Delete all players
TRUNCATE TABLE "Player" CASCADE;

-- Note: This migration removes all test data
-- Production deployment would require data migration strategy
```

- [ ] **Step 2: Add index on displayName for search performance**

Append to the same migration file:

```sql
-- Add index on displayName for search performance
CREATE INDEX IF NOT EXISTS "Player_displayName_idx" ON "Player"("displayName");
```

- [ ] **Step 3: Run migration**

Run: `cd apps/backend && npx prisma migrate dev --name truncate_for_username_changes`
Expected: Migration succeeds, all tables empty

- [ ] **Step 4: Verify migration**

Run: `cd apps/backend && npx prisma studio`
Verify: All tables (Player, Session, Match, etc.) are empty

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/migrations/20260827000000_truncate_for_username_changes/
git commit -m "feat: add migration to truncate test data

- Truncate all tables for fresh start
- Add displayName index for search performance
- No backward compatibility (test data only)"
```

---

## Task 4: Update OAuth Callback Endpoint

**Files:**
- Modify: `apps/backend/src/routes/auth.ts:49-134`

**Interfaces:**
- Consumes: None (removes `generateUsernameFromEmail`, `generateUsernameSuggestions`)
- Produces: Response `{ isNewUser: true, oauthData: { provider, oauthId, email, name } }` for new users (no `suggestedUsername`)

- [ ] **Step 1: Write integration test for updated callback**

Add to `apps/backend/src/routes/auth.test.ts` (create if doesn't exist):

```typescript
import request from 'supertest';
import express from 'express';
import authRouter from './auth';
import { getPrismaClient } from '../storage/prismaClient';

jest.mock('../storage/prismaClient');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('POST /auth/oauth/callback', () => {
  const mockPrisma = {
    player: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  it('should return isNewUser without suggestedUsername for new OAuth user', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null); // New user
    
    const response = await request(app)
      .post('/auth/oauth/callback')
      .send({
        provider: 'google',
        oauthId: '123456',
        email: 'test@example.com',
        name: 'Test User',
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      isNewUser: true,
      oauthData: {
        provider: 'google',
        oauthId: '123456',
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    expect(response.body.suggestedUsername).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && npm test -- auth.test.ts`
Expected: FAIL because callback still returns `suggestedUsername`

- [ ] **Step 3: Update OAuth callback to remove suggestedUsername**

In `apps/backend/src/routes/auth.ts`, replace the "New OAuth user" section (lines ~114-129):

```typescript
    // New OAuth user - return OAuth data for frontend registration
    // Frontend will show display name selection modal
    console.log('New OAuth user detected');

    return res.status(200).json({
      isNewUser: true,
      oauthData: {
        provider,
        oauthId,
        email,
        name: name || null,
      },
    });
```

Remove these imports at the top (lines ~14-15):

```typescript
  generateUsernameFromEmail,
  generateUsernameSuggestions,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && npm test -- auth.test.ts`
Expected: PASS for OAuth callback tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/auth.ts apps/backend/src/routes/auth.test.ts
git commit -m "feat: remove suggestedUsername from OAuth callback

- New users get only oauthData, no username suggestion
- Frontend will collect display name only
- Remove unused username generation imports"
```

---

## Task 5: Update OAuth Registration Endpoint

**Files:**
- Modify: `apps/backend/src/routes/auth.ts:151-230`

**Interfaces:**
- Consumes: `validateDisplayName` from `../utils/validation`, `generateUniqueUsername` from `../auth/authUtils`
- Produces: Accepts `{ provider, oauthId, email, displayName }`, returns `{ playerId, username, displayName, rating, sessionToken }`

- [ ] **Step 1: Write integration test for updated registration**

Add to `apps/backend/src/routes/auth.test.ts`:

```typescript
describe('POST /auth/oauth/register', () => {
  const mockPrisma = {
    player: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  
  const mockCreateSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
    jest.spyOn(require('../auth/authUtils'), 'createSession').mockImplementation(mockCreateSession);
    jest.spyOn(require('../auth/authUtils'), 'generateUniqueUsername').mockResolvedValue('coolplayer_a1b2');
  });

  it('should register new user with display name only', async () => {
    mockPrisma.player.create.mockResolvedValue({
      id: 'player-123',
      username: 'coolplayer_a1b2',
      displayName: 'Cool Player',
      ratingMode1: 1200,
      ratingMode2: 1200,
    });
    mockCreateSession.mockResolvedValue('session-token-123');
    
    const response = await request(app)
      .post('/auth/oauth/register')
      .send({
        provider: 'google',
        oauthId: '123456',
        email: 'test@example.com',
        displayName: 'Cool Player',
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      playerId: 'player-123',
      username: 'coolplayer_a1b2',
      displayName: 'Cool Player',
      rating: 2400,
      sessionToken: 'session-token-123',
    });
  });

  it('should reject registration without displayName', async () => {
    const response = await request(app)
      .post('/auth/oauth/register')
      .send({
        provider: 'google',
        oauthId: '123456',
        email: 'test@example.com',
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
  });

  it('should reject invalid display name', async () => {
    const response = await request(app)
      .post('/auth/oauth/register')
      .send({
        provider: 'google',
        oauthId: '123456',
        email: 'test@example.com',
        displayName: '   ', // Whitespace only
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Display name cannot be empty');
  });

  it('should reject display name over 30 characters', async () => {
    const response = await request(app)
      .post('/auth/oauth/register')
      .send({
        provider: 'google',
        oauthId: '123456',
        email: 'test@example.com',
        displayName: 'a'.repeat(31),
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Display name must be 30 characters or less');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && npm test -- auth.test.ts`
Expected: FAIL because endpoint still requires username parameter

- [ ] **Step 3: Update OAuth registration endpoint**

Replace the `/auth/oauth/register` handler in `apps/backend/src/routes/auth.ts`:

```typescript
router.post('/oauth/register', async (req, res) => {
  try {
    const { provider, oauthId, email, displayName } = req.body as {
      provider?: string;
      oauthId?: string;
      email?: string;
      displayName?: string;
    };

    // Validate input
    if (!provider || !oauthId || !email || !displayName) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!isValidOAuthProvider(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider' });
    }

    // Validate display name
    const displayNameValidation = validateDisplayName(displayName);
    if (!displayNameValidation.valid) {
      return res.status(400).json({
        error: displayNameValidation.error,
      });
    }

    const sanitizedDisplayName = displayNameValidation.sanitized!;

    // Generate unique username from display name
    let username: string;
    try {
      username = await generateUniqueUsername(sanitizedDisplayName);
    } catch (error) {
      console.error('Failed to generate username:', error);
      return res.status(500).json({
        error: 'Failed to generate unique username. Please try again.',
      });
    }

    const prisma = getPrismaClient();

    // Create new player with OAuth identity
    const playerId = safeRandomUUID();
    const player = await prisma.player.create({
      data: {
        id: playerId,
        username,
        displayName: sanitizedDisplayName,
        oauthProvider: provider,
        oauthId,
        oauthEmail: email,
        isAnonymous: false,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        ratingMode1: true,
        ratingMode2: true,
      },
    });

    // Create session
    const sessionToken = await createSession(player.id);

    return res.status(201).json({
      playerId: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
      sessionToken,
    });
  } catch (error) {
    console.error('OAuth registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration' });
  }
});
```

Update imports at the top:

```typescript
import {
  createSession,
  validateSession,
  deleteSession,
  deleteAllPlayerSessions,
  generateUniqueUsername,
  isValidOAuthProvider,
  updateLastLogin,
  type OAuthUserData,
} from '../auth/authUtils';
import { isValidUsername, sanitizeUsername, validateDisplayName } from '../utils/validation';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && npm test -- auth.test.ts`
Expected: PASS for all OAuth registration tests

- [ ] **Step 5: Manual test with curl**

```bash
# Test new user registration with display name
curl -X POST http://localhost:3001/auth/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "oauthId": "test123",
    "email": "test@example.com",
    "displayName": "Test Player 🎮"
  }'

# Expected: 201 with generated username like "testplayer_a1b2"
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/routes/auth.ts apps/backend/src/routes/auth.test.ts
git commit -m "feat: update OAuth registration to auto-generate usernames

- Accept displayName as required field (remove username param)
- Validate display name (1-30 chars, Unicode support)
- Auto-generate username from sanitized display name
- Return both username and displayName in response
- Add comprehensive test coverage"
```

---

## Task 6: Simplify Username Registration Modal

**Files:**
- Modify: `apps/web/components/modals/UsernameRegistrationModal.tsx`

**Interfaces:**
- Consumes: None
- Produces: `onSubmit: (displayName: string) => void` (changed from `(username, displayName)`)

- [ ] **Step 1: Write component test for simplified modal**

Create `apps/web/components/modals/UsernameRegistrationModal.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UsernameRegistrationModal } from './UsernameRegistrationModal';

describe('UsernameRegistrationModal', () => {
  it('should show only display name input field', () => {
    render(
      <UsernameRegistrationModal
        isOpen={true}
        onSubmit={jest.fn()}
      />
    );
    
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
  });

  it('should call onSubmit with display name only', async () => {
    const onSubmit = jest.fn();
    render(
      <UsernameRegistrationModal
        isOpen={true}
        onSubmit={onSubmit}
      />
    );
    
    const input = screen.getByLabelText(/display name/i);
    fireEvent.change(input, { target: { value: 'Cool Player' } });
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('Cool Player');
    });
  });

  it('should trim whitespace before submitting', async () => {
    const onSubmit = jest.fn();
    render(
      <UsernameRegistrationModal
        isOpen={true}
        onSubmit={onSubmit}
      />
    );
    
    const input = screen.getByLabelText(/display name/i);
    fireEvent.change(input, { target: { value: '  Player Name  ' } });
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('Player Name');
    });
  });

  it('should validate display name length client-side', () => {
    render(
      <UsernameRegistrationModal
        isOpen={true}
        onSubmit={jest.fn()}
      />
    );
    
    const input = screen.getByLabelText(/display name/i) as HTMLInputElement;
    expect(input.maxLength).toBe(30);
  });

  it('should disable submit when display name is empty', () => {
    render(
      <UsernameRegistrationModal
        isOpen={true}
        onSubmit={jest.fn()}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    expect(submitButton).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test -- UsernameRegistrationModal.test.tsx`
Expected: FAIL because modal still has username field

- [ ] **Step 3: Simplify modal component**

Replace `apps/web/components/modals/UsernameRegistrationModal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { OAuthButtonGroup, type OAuthUserData } from "@/components/auth/OAuthButton";
import type { OAuthProvider } from "@/lib/player";

type UsernameRegistrationModalProps = {
  isOpen: boolean;
  onSubmit: (displayName: string) => void;
  onOAuthAuth?: (provider: OAuthProvider, userData: OAuthUserData) => void;
  onClose?: () => void;
  error?: string | null;
  isLoading?: boolean;
  showOAuth?: boolean;
};

export function UsernameRegistrationModal({
  isOpen,
  onSubmit,
  onOAuthAuth,
  onClose,
  error,
  isLoading = false,
  showOAuth = true,
}: UsernameRegistrationModalProps) {
  const [displayName, setDisplayName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  const canSubmit = displayName.trim().length > 0 && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-elevated border border-board-grid rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Choose Your Display Name
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          This is how other players will see you in the game.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="Enter your display name"
              className="w-full px-4 py-2 bg-surface-base border border-board-grid rounded-lg
                       text-text-primary placeholder-text-tertiary
                       focus:outline-none focus:ring-2 focus:ring-playerX-primary focus:border-transparent"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-text-tertiary mt-1">
              1-30 characters. Unicode, spaces, and emoji allowed.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2 px-4 bg-playerX-primary hover:bg-playerX-secondary
                     text-white font-medium rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Continue"}
          </button>
        </form>

        {showOAuth && onOAuthAuth && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-board-grid" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-elevated text-text-tertiary">
                  or sign in with
                </span>
              </div>
            </div>

            <OAuthButtonGroup onAuth={onOAuthAuth} />
          </>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test -- UsernameRegistrationModal.test.tsx`
Expected: PASS for all modal tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/modals/UsernameRegistrationModal.tsx apps/web/components/modals/UsernameRegistrationModal.test.tsx
git commit -m "feat: simplify registration modal to display name only

- Remove username input field and validation
- Remove checkUsernameAvailability logic
- Make display name required (not optional)
- Add client-side length validation (maxLength=30)
- Update props: onSubmit now takes only displayName
- Remove suggestedUsername prop"
```

---

## Task 7: Update Frontend Player API Client

**Files:**
- Modify: `apps/web/lib/player.ts`

**Interfaces:**
- Consumes: None
- Produces: Updated `registerWithOAuth(provider, oauthId, email, displayName)` (removed username param), removed `checkUsernameAvailability()`

- [ ] **Step 1: Remove checkUsernameAvailability function**

In `apps/web/lib/player.ts`, delete the `checkUsernameAvailability` function (lines 143-159):

```typescript
// DELETE THIS ENTIRE FUNCTION:
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean;
  username?: string;
  reason?: string;
  message?: string;
}> {
  // ... delete entire function
}
```

- [ ] **Step 2: Update registerWithOAuth function signature**

In `apps/web/lib/player.ts`, update the `registerWithOAuth` function (lines 233-250):

```typescript
/**
 * Complete OAuth registration with display name
 */
export async function registerWithOAuth(
  provider: string,
  oauthId: string,
  email: string,
  displayName: string
): Promise<PlayerProfile> {
  const response = await apiRequest<PlayerProfile & { sessionToken: string }>('/auth/oauth/register', {
    method: 'POST',
    body: JSON.stringify({ provider, oauthId, email, displayName }),
  });

  setStoredPlayerId(response.playerId);
  setStoredSessionToken(response.sessionToken);
  cachedPlayer = response;
  return response;
}
```

- [ ] **Step 3: Update OAuthCallbackResponse interface**

In `apps/web/lib/player.ts`, update the interface (lines 47-61):

```typescript
export interface OAuthCallbackResponse {
  isNewUser: boolean;
  playerId?: string;
  username?: string;
  displayName?: string;
  rating?: number;
  sessionToken?: string;
  // Remove suggestedUsername field
  oauthData?: {
    provider: string;
    oauthId: string;
    email: string;
    name?: string;
  };
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd apps/web && npm run build`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/player.ts
git commit -m "feat: update player API client for auto-generated usernames

- Remove checkUsernameAvailability() function
- Update registerWithOAuth() to accept displayName only
- Remove suggestedUsername from OAuthCallbackResponse
- Backend now generates username automatically"
```

---

## Task 8: Update Player Provider

**Files:**
- Modify: `apps/web/components/providers/PlayerProvider.tsx`

**Interfaces:**
- Consumes: Updated `registerWithOAuth` from `@/lib/player`
- Produces: Registration handler that sends only displayName

- [ ] **Step 1: Find and update registration handler**

Read the file to locate the registration logic:

Run: `cd apps/web && grep -n "registerWithOAuth" components/providers/PlayerProvider.tsx`

- [ ] **Step 2: Update the handleOAuthRegister function**

In `apps/web/components/providers/PlayerProvider.tsx`, update the registration handler to pass only displayName:

```typescript
// Before:
const handleOAuthRegister = async (username: string, displayName: string) => {
  // ... calls registerWithOAuth(provider, oauthId, email, username, displayName)
};

// After:
const handleOAuthRegister = async (displayName: string) => {
  if (!pendingOAuthData) {
    setError('No OAuth data available');
    return;
  }
  
  try {
    setIsLoading(true);
    const player = await registerWithOAuth(
      pendingOAuthData.provider,
      pendingOAuthData.oauthId,
      pendingOAuthData.email,
      displayName
    );
    
    setPlayer(player);
    setShowRegistrationModal(false);
    setPendingOAuthData(null);
    setError(null);
  } catch (err) {
    console.error('OAuth registration error:', err);
    setError(err instanceof Error ? err.message : 'Registration failed');
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd apps/web && npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/providers/PlayerProvider.tsx
git commit -m "feat: update PlayerProvider for display-name-only registration

- Update handleOAuthRegister to accept only displayName
- Pass displayName to registerWithOAuth (removed username param)
- Backend generates username automatically"
```

---

## Task 9: Update Navigation to Show Display Name + Username

**Files:**
- Modify: `apps/web/components/layout/Navigation.tsx`

**Interfaces:**
- Consumes: `player.displayName` and `player.username` from PlayerProvider
- Produces: UI showing display name prominently with username as secondary text

- [ ] **Step 1: Locate player display section in Navigation**

Read the file to find where player info is displayed:

Run: `cd apps/web && grep -n "player\\.username" components/layout/Navigation.tsx`

- [ ] **Step 2: Update Navigation to show both fields**

In `apps/web/components/layout/Navigation.tsx`, find the player display section and update it:

```typescript
{/* User section - show display name prominently with username secondary */}
{player && (
  <div className="flex items-center gap-4">
    <Link
      href={ROUTES.PROFILE}
      className="flex flex-col items-end"
    >
      <span className="text-sm font-medium text-text-primary">
        {player.displayName || player.username}
      </span>
      {player.displayName && player.username && (
        <span className="text-xs text-text-tertiary">
          @{player.username}
        </span>
      )}
    </Link>
    
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  </div>
)}
```

- [ ] **Step 3: Test display in browser**

Run: `cd apps/web && npm run dev`
Navigate to the app and verify:
- Display name shows in large text
- Username shows below as `@username` in small text
- If no display name, username shows as fallback

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/layout/Navigation.tsx
git commit -m "feat: update Navigation to show display name + username

- Display name as primary text (large)
- Username as secondary text (small, @username format)
- Fallback to username if no display name"
```

---

## Task 10: Update Friend Components

**Files:**
- Modify: `apps/web/components/friends/FriendsList.tsx`
- Modify: `apps/web/components/friends/FriendRequests.tsx`
- Modify: `apps/web/components/friends/PlayerSearchModal.tsx`

**Interfaces:**
- Consumes: Friend objects with `displayName` and `username` fields
- Produces: UI showing display name prominently with username for disambiguation

- [ ] **Step 1: Update FriendsList component**

In `apps/web/components/friends/FriendsList.tsx`, update friend display:

```typescript
{/* Friend item - show display name prominently */}
<div className="flex items-center justify-between p-3 bg-surface-base rounded-lg">
  <div className="flex items-center gap-3">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-text-primary">
        {friend.displayName || friend.username}
      </span>
      {friend.displayName && friend.username && (
        <span className="text-xs text-text-tertiary">
          @{friend.username}
        </span>
      )}
    </div>
  </div>
  {/* ... rest of friend item */}
</div>
```

- [ ] **Step 2: Update FriendRequests component**

In `apps/web/components/friends/FriendRequests.tsx`, update request display:

```typescript
{/* Friend request item */}
<div className="flex items-center justify-between p-3 bg-surface-base rounded-lg">
  <div className="flex flex-col">
    <span className="text-sm font-medium text-text-primary">
      {request.displayName || request.username}
    </span>
    {request.displayName && request.username && (
      <span className="text-xs text-text-tertiary">
        @{request.username}
      </span>
    )}
  </div>
  {/* ... accept/reject buttons */}
</div>
```

- [ ] **Step 3: Update PlayerSearchModal component**

In `apps/web/components/friends/PlayerSearchModal.tsx`, update search results:

```typescript
{/* Search result item */}
<div className="flex items-center justify-between p-3 hover:bg-surface-elevated rounded-lg">
  <div className="flex flex-col">
    <span className="text-sm font-medium text-text-primary">
      {player.displayName || player.username}
    </span>
    {player.displayName && player.username && (
      <span className="text-xs text-text-tertiary">
        @{player.username}
      </span>
    )}
  </div>
  {/* ... add friend button */}
</div>
```

- [ ] **Step 4: Test in browser**

Run: `cd apps/web && npm run dev`
Test:
1. Search for players (should show display name + username)
2. Send/receive friend requests (should show both fields)
3. View friends list (should show both fields)

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/friends/
git commit -m "feat: update friend components to show display name + username

- FriendsList: display name primary, username secondary
- FriendRequests: show both fields for disambiguation
- PlayerSearchModal: search results show both fields
- Format: DisplayName (@username)"
```

---

## Task 11: Update Profile Page

**Files:**
- Modify: `apps/web/app/profile/page.tsx`

**Interfaces:**
- Consumes: Player profile with `displayName` and `username`
- Produces: Profile page showing both fields appropriately

- [ ] **Step 1: Update profile page header**

In `apps/web/app/profile/page.tsx`, update the profile header:

```typescript
{/* Profile header */}
<div className="mb-8">
  <h1 className="text-3xl font-bold text-text-primary mb-1">
    {player.displayName || player.username}
  </h1>
  {player.displayName && player.username && (
    <p className="text-text-tertiary">@{player.username}</p>
  )}
  <p className="text-text-secondary mt-2">
    Rating: {player.rating}
  </p>
</div>
```

- [ ] **Step 2: Test profile page in browser**

Run: `cd apps/web && npm run dev`
Navigate to `/profile` and verify:
- Display name shows as main heading
- Username shows as subtitle
- Both fields are clearly visible

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/profile/page.tsx
git commit -m "feat: update profile page to show display name + username

- Display name as main heading (h1)
- Username as subtitle below
- Clear hierarchy: display name primary, username secondary"
```

---

## Task 12: Integration Testing & Documentation

**Files:**
- Create: `docs/REGISTRATION_FLOW.md`

**Interfaces:**
- Consumes: All implemented features
- Produces: Working end-to-end flow and documentation

- [ ] **Step 1: Manual end-to-end test**

Test the complete registration flow:

1. Start backend: `cd apps/backend && npm run dev`
2. Start frontend: `cd apps/web && npm run dev`
3. Click "Sign in with Google" (or Discord)
4. Complete OAuth flow
5. Verify registration modal shows only display name input
6. Enter display name: "Test Player 🎮"
7. Submit and verify:
   - Account created successfully
   - Generated username visible (e.g., "testplayer_a1b2")
   - Navigation shows display name prominently
   - Username shows as @username below

- [ ] **Step 2: Test edge cases**

1. Register with Unicode: "José García"
2. Register with emoji only: "🎮🎮🎮"
3. Register with spaces: "Cool Player"
4. Register with 30 characters exactly
5. Try to register with empty display name (should be prevented)

- [ ] **Step 3: Create documentation**

Create `docs/REGISTRATION_FLOW.md`:

```markdown
# Registration Flow - Auto-Generated Usernames

## Overview

Users register by providing only their **display name**. The system automatically generates a unique username in the format `{sanitized_displayname}_{xxxx}`.

## Display Name Rules

- **Length:** 1-30 characters
- **Allowed:** Unicode letters, numbers, spaces, special characters, emoji
- **Validation:** Trim whitespace, reject control characters
- **Uniqueness:** NOT required (duplicates allowed)

## Username Generation

**Format:** `{base}_{suffix}`

**Algorithm:**
1. Sanitize display name (lowercase, alphanumeric only)
2. If empty after sanitization, use "player" as base
3. Truncate base to 20 chars
4. Add random 4-char suffix (alphanumeric)
5. Check database for uniqueness
6. Retry up to 3 times on collision

**Examples:**
- "Cool Player" → "coolplayer_a3f9"
- "José García" → "josegarcia_k2m8"
- "🎮🎮🎮" → "player_x7n4"

## UI Display Strategy

### Navigation
```
Cool Player
@coolplayer_a3f9
```

### Friend Lists / Search Results
```
Cool Player (@coolplayer_a3f9)
```

### Profile Page
```
Cool Player          [h1 - large]
@coolplayer_a3f9    [subtitle - small]
Rating: 2400
```

## API Endpoints

### POST /auth/oauth/callback
**New user response:**
```json
{
  "isNewUser": true,
  "oauthData": {
    "provider": "google",
    "oauthId": "123...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /auth/oauth/register
**Request:**
```json
{
  "provider": "google",
  "oauthId": "123...",
  "email": "user@example.com",
  "displayName": "Cool Player"
}
```

**Response:**
```json
{
  "playerId": "uuid...",
  "username": "coolplayer_a3f9",
  "displayName": "Cool Player",
  "rating": 2400,
  "sessionToken": "token..."
}
```

## Migration Notes

- All test data was truncated (no backward compatibility)
- Added index on `displayName` for search performance
- Username field remains unique in database
```

- [ ] **Step 4: Verify all tests pass**

Run full test suite:
```bash
cd apps/backend && npm test
cd apps/web && npm test
```

Expected: All tests PASS

- [ ] **Step 5: Commit documentation**

```bash
git add docs/REGISTRATION_FLOW.md
git commit -m "docs: add registration flow documentation

- Document display name rules and username generation
- Include API endpoint specifications
- Add UI display strategy examples
- Note migration and backward compatibility"
```

---

## Execution Complete

All tasks implemented. The system now:
- ✅ Auto-generates usernames from display names
- ✅ Accepts only display name during registration
- ✅ Shows display name prominently throughout UI
- ✅ Uses username for disambiguation and stable identity
- ✅ Supports Unicode, spaces, emoji in display names
- ✅ Handles edge cases (emoji-only, single char, collisions)

**Next Steps:**
1. Deploy to staging environment
2. Test with real OAuth providers
3. Monitor username generation failures in logs
4. Gather user feedback on simplified registration flow
