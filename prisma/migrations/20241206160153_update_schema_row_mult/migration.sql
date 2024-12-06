/*
  Warnings:

  - You are about to drop the column `localIdGenetProp` on the `GeneticsFile` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `GeneticsFile` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `GeneticsFile` table. All the data in the column will be lost.
  - You are about to drop the column `coordinates` on the `MonitoringFile` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `MonitoringFile` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `MonitoringFile` table. All the data in the column will be lost.
  - You are about to drop the column `genetId` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `nursery` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `organization` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `eventCenterpoint` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `eventName` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `genetId` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `grouping` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `reefName` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `OutplantingFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GeneticsFile" DROP COLUMN "localIdGenetProp",
DROP COLUMN "rawData",
DROP COLUMN "species";

-- AlterTable
ALTER TABLE "MonitoringFile" DROP COLUMN "coordinates",
DROP COLUMN "eventId",
DROP COLUMN "rawData";

-- AlterTable
ALTER TABLE "NurseryFile" DROP COLUMN "genetId",
DROP COLUMN "nursery",
DROP COLUMN "organization",
DROP COLUMN "quantity",
DROP COLUMN "rawData";

-- AlterTable
ALTER TABLE "OutplantingFile" DROP COLUMN "eventCenterpoint",
DROP COLUMN "eventName",
DROP COLUMN "genetId",
DROP COLUMN "grouping",
DROP COLUMN "quantity",
DROP COLUMN "rawData",
DROP COLUMN "reefName",
DROP COLUMN "siteName";

-- CreateTable
CREATE TABLE "GeneticsRow" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "localIdGenetProp" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "additionalData" JSONB NOT NULL,

    CONSTRAINT "GeneticsRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryRow" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "genetId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "nursery" TEXT NOT NULL,
    "additionalData" JSONB NOT NULL,

    CONSTRAINT "NurseryRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutplantingRow" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "reefName" TEXT NOT NULL,
    "eventCenterpoint" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "genetId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "grouping" TEXT NOT NULL,
    "additionalData" JSONB NOT NULL,

    CONSTRAINT "OutplantingRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringRow" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "coordinates" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "additionalData" JSONB NOT NULL,

    CONSTRAINT "MonitoringRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneticsRow_fileUploadId_idx" ON "GeneticsRow"("fileUploadId");

-- CreateIndex
CREATE INDEX "NurseryRow_fileUploadId_idx" ON "NurseryRow"("fileUploadId");

-- CreateIndex
CREATE INDEX "OutplantingRow_fileUploadId_idx" ON "OutplantingRow"("fileUploadId");

-- CreateIndex
CREATE INDEX "MonitoringRow_fileUploadId_idx" ON "MonitoringRow"("fileUploadId");

-- AddForeignKey
ALTER TABLE "GeneticsRow" ADD CONSTRAINT "GeneticsRow_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "GeneticsFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryRow" ADD CONSTRAINT "NurseryRow_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "NurseryFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutplantingRow" ADD CONSTRAINT "OutplantingRow_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "OutplantingFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringRow" ADD CONSTRAINT "MonitoringRow_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "MonitoringFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
