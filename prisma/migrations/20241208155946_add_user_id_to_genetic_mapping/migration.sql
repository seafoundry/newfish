/*
  Warnings:

  - Added the required column `userId` to the `GeneticMapping` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneticMapping" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "GeneticMapping" ADD CONSTRAINT "GeneticMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
