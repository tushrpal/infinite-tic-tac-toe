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
Cool Player
@coolplayer_a3f9 • 2400 rating
```

### Profile Page
```
Cool Player          [h1 - large, bold]
@coolplayer_a3f9    [subtitle - text-tertiary]
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

## Manual Testing Checklist

### Registration Flow
- [ ] Click "Sign in with Google" (or Discord)
- [ ] Complete OAuth flow
- [ ] Registration modal shows only display name input
- [ ] Enter display name: "Test Player 🎮"
- [ ] Verify account created successfully
- [ ] Generated username visible (e.g., "testplayer_a1b2")
- [ ] Navigation shows display name prominently
- [ ] Username shows as @username below

### Edge Cases
- [ ] Register with Unicode: "José García"
- [ ] Register with emoji only: "🎮🎮🎮"
- [ ] Register with spaces: "Cool Player"
- [ ] Register with 30 characters exactly
- [ ] Try to register with empty display name (should be prevented)

### UI Display Verification
- [ ] Navigation: display name primary, username secondary
- [ ] Profile page: display name as h1, username as subtitle
- [ ] Friend list: both fields visible with proper hierarchy
- [ ] Friend requests: display name + username shown
- [ ] Player search: results show both fields

## Implementation Summary

**Completed Tasks:**
1. ✅ Display name validation (1-30 chars, Unicode support)
2. ✅ Username generation algorithm with collision handling
3. ✅ Database migration (truncate test data)
4. ✅ OAuth callback endpoint updated
5. ✅ OAuth registration endpoint updated
6. ✅ Frontend registration modal simplified
7. ✅ Frontend API client updated
8. ✅ PlayerProvider updated
9. ✅ Navigation component updated
10. ✅ Friend components updated
11. ✅ Profile page updated
12. ✅ Documentation created

**Tech Stack:**
- Backend: TypeScript, Express.js, Prisma ORM
- Frontend: TypeScript, Next.js, React
- Database: PostgreSQL (via Prisma)

**Key Files Modified:**
- `apps/backend/src/utils/validation.ts` - Display name validation
- `apps/backend/src/auth/authUtils.ts` - Username generation
- `apps/backend/src/routes/auth.ts` - OAuth endpoints
- `apps/web/components/modals/UsernameRegistrationModal.tsx` - Simplified modal
- `apps/web/lib/player.ts` - API client updates
- `apps/web/components/providers/PlayerProvider.tsx` - Registration handler
- `apps/web/components/layout/Navigation.tsx` - Display updates
- `apps/web/components/friends/*` - Friend component updates
- `apps/web/app/profile/page.tsx` - Profile display updates
