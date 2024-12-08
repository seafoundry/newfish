/*
  Warnings:

  - You are about to drop the column `geneticsFileId` on the `GeneticMapping` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `GeneticMapping` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneticMapping" DROP CONSTRAINT "GeneticMapping_geneticsFileId_fkey";

-- AlterTable
ALTER TABLE "GeneticMapping" DROP COLUMN "geneticsFileId",
DROP COLUMN "updatedAt";
