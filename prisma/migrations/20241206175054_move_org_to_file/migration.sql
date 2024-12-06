/*
  Warnings:

  - You are about to drop the column `organization` on the `NurseryRow` table. All the data in the column will be lost.
  - Added the required column `organization` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NurseryFile" ADD COLUMN     "organization" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "NurseryRow" DROP COLUMN "organization";
