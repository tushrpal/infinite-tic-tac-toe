-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "ratingMode1" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "ratingMode2" INTEGER NOT NULL DEFAULT 1200;

-- CreateIndex
CREATE INDEX "Player_ratingMode1_idx" ON "Player"("ratingMode1");

-- CreateIndex
CREATE INDEX "Player_ratingMode2_idx" ON "Player"("ratingMode2");
