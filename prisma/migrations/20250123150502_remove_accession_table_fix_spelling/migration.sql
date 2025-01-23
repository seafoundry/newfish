/*
  Warnings:

  - You are about to drop the column `assessionNumber` on the `GeneticsRow` table. All the data in the column will be lost.
  - You are about to drop the `AccessionGenet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccessionGenet" DROP CONSTRAINT "AccessionGenet_userId_fkey";

-- AlterTable
ALTER TABLE "GeneticsRow" DROP COLUMN "assessionNumber",
ADD COLUMN     "accessionNumber" TEXT;

-- DropTable
DROP TABLE "AccessionGenet";
