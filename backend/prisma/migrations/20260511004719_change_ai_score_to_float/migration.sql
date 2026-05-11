/*
  Warnings:

  - You are about to alter the column `aiScore` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "aiScore" SET DATA TYPE DOUBLE PRECISION;
