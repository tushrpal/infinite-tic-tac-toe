-- AlterTable
ALTER TABLE "Room" ADD COLUMN "joinCode" TEXT;

-- Generate unique 6-character codes for existing rooms
UPDATE "Room"
SET "joinCode" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id) FROM 1 FOR 6))
WHERE "joinCode" IS NULL;

-- Make joinCode required and unique
ALTER TABLE "Room" ALTER COLUMN "joinCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_joinCode_key" ON "Room"("joinCode");

-- CreateIndex (already declared in schema but ensuring it's created)
CREATE INDEX IF NOT EXISTS "Room_joinCode_idx" ON "Room"("joinCode");
