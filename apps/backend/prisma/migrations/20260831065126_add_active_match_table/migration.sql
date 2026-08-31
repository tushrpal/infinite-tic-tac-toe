/*
  Warnings:

  - Made the column `username` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "username" SET NOT NULL;

-- CreateTable
CREATE TABLE "ActiveMatch" (
    "id" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "mode" TEXT NOT NULL,
    "isRanked" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActiveMatch_status_mode_isRanked_idx" ON "ActiveMatch"("status", "mode", "isRanked");

-- CreateIndex
CREATE INDEX "ActiveMatch_expiresAt_idx" ON "ActiveMatch"("expiresAt");

-- CreateIndex
CREATE INDEX "ActiveMatch_updatedAt_idx" ON "ActiveMatch"("updatedAt");
