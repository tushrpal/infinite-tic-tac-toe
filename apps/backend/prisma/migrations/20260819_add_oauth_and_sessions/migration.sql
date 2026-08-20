-- Step 1: Add new columns as nullable first
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "oauthProvider" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "oauthId" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "oauthEmail" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Step 2: Update existing NULL usernames with generated values
UPDATE "Player"
SET "username" = 'player_' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))
WHERE "username" IS NULL;

-- Step 3: Make username required (NOT NULL)
ALTER TABLE "Player" ALTER COLUMN "username" SET NOT NULL;

-- Step 4: Create Session table
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create unique constraint for OAuth
CREATE UNIQUE INDEX "Player_oauthProvider_oauthId_key" ON "Player"("oauthProvider", "oauthId");

-- Step 6: Create unique constraint for session token
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- Step 7: Create indexes for performance
CREATE INDEX "Player_oauthProvider_oauthId_idx" ON "Player"("oauthProvider", "oauthId");
CREATE INDEX "Session_playerId_idx" ON "Session"("playerId");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- Step 8: Add foreign key constraint
ALTER TABLE "Session" ADD CONSTRAINT "Session_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
