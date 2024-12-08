-- DropForeignKey
ALTER TABLE "GeneticMapping" DROP CONSTRAINT "GeneticMapping_geneticsFileId_fkey";

-- DropIndex
DROP INDEX "GeneticMapping_geneticsFileId_idx";

-- AlterTable
ALTER TABLE "GeneticMapping" ALTER COLUMN "geneticsFileId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GeneticMapping" ADD CONSTRAINT "GeneticMapping_geneticsFileId_fkey" FOREIGN KEY ("geneticsFileId") REFERENCES "GeneticsFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
