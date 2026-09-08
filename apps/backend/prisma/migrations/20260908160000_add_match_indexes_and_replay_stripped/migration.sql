-- Add replayStripped flag and indexes for common Match query patterns
ALTER TABLE "Match" ADD COLUMN "replayStripped" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing stripped payload markers
UPDATE "Match"
SET "replayStripped" = true
WHERE payload->>'replayStripped' = 'true';

CREATE INDEX "Match_createdAtMs_idx" ON "Match"("createdAtMs");
CREATE INDEX "Match_mode_isRanked_idx" ON "Match"("mode", "isRanked");
CREATE INDEX "Match_replayStripped_idx" ON "Match"("replayStripped");
