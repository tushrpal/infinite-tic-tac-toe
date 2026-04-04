-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "ratingChange" INTEGER;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1200;
