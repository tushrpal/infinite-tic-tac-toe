-- AlterTable: Update default values for rating fields
ALTER TABLE "Player" ALTER COLUMN "ratingMode1" SET DEFAULT 200;
ALTER TABLE "Player" ALTER COLUMN "ratingMode2" SET DEFAULT 200;

-- Update existing players who still have the old default rating (1200)
-- These are likely players who haven't played in that mode yet
UPDATE "Player"
SET "ratingMode1" = 200
WHERE "ratingMode1" = 1200;

UPDATE "Player"
SET "ratingMode2" = 200
WHERE "ratingMode2" = 1200;
