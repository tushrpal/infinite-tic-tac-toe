-- Step 1: Add new columns as nullable first
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "oauthProvider" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "oauthId" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "oauthEmail" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Step 2: Create Session table
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique constraint for OAuth
CREATE UNIQUE INDEX IF NOT EXISTS "Player_oauthProvider_oauthId_key" ON "Player"("oauthProvider", "oauthId");

-- Step 4: Create unique constraint for session token
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS "Player_oauthProvider_oauthId_idx" ON "Player"("oauthProvider", "oauthId");
CREATE INDEX IF NOT EXISTS "Session_playerId_idx" ON "Session"("playerId");
CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

-- Step 6: Add foreign key constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Session_playerId_fkey'
    ) THEN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_playerId_fkey"
        FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
