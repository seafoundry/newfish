/*
  Warnings:

  - You are about to drop the column `eventCenterpoint` on the `OutplantingRow` table. All the data in the column will be lost.
  - You are about to drop the column `eventName` on the `OutplantingRow` table. All the data in the column will be lost.
  - You are about to drop the column `reefName` on the `OutplantingRow` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `OutplantingRow` table. All the data in the column will be lost.
  - Added the required column `eventCenterpoint` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventName` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reefName` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteName` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OutplantingFile" ADD COLUMN     "eventCenterpoint" TEXT NOT NULL,
ADD COLUMN     "eventName" TEXT NOT NULL,
ADD COLUMN     "reefName" TEXT NOT NULL,
ADD COLUMN     "siteName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OutplantingRow" DROP COLUMN "eventCenterpoint",
DROP COLUMN "eventName",
DROP COLUMN "reefName",
DROP COLUMN "siteName";
