/*
  Warnings:

  - You are about to drop the column `coordinates` on the `MonitoringRow` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `MonitoringRow` table. All the data in the column will be lost.
  - Added the required column `coordinates` to the `MonitoringFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `MonitoringFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MonitoringFile" ADD COLUMN     "coordinates" TEXT NOT NULL,
ADD COLUMN     "eventId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MonitoringRow" DROP COLUMN "coordinates",
DROP COLUMN "eventId";
