-- Add playerId to support per-move player analytics/replay fidelity.
-- Backfill existing rows, then enforce explicit values on future writes.
ALTER TABLE "Move"
ADD COLUMN "playerId" TEXT;

UPDATE "Move"
SET "playerId" = 'unknown:legacy'
WHERE "playerId" IS NULL;

ALTER TABLE "Move"
ALTER COLUMN "playerId" SET NOT NULL;
