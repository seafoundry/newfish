/*
  Warnings:

  - Added the required column `rawData` to the `GeneticsFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawData` to the `MonitoringFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawData` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawData` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneticsFile" ADD COLUMN     "localIdGenetProp" TEXT[],
ADD COLUMN     "rawData" JSONB NOT NULL,
ADD COLUMN     "species" TEXT[];

-- AlterTable
ALTER TABLE "MonitoringFile" ADD COLUMN     "rawData" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "NurseryFile" ADD COLUMN     "genetIds" TEXT[],
ADD COLUMN     "nurseries" TEXT[],
ADD COLUMN     "quantities" INTEGER[],
ADD COLUMN     "rawData" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "OutplantingFile" ADD COLUMN     "genetIds" TEXT[],
ADD COLUMN     "groupings" TEXT[],
ADD COLUMN     "quantities" INTEGER[],
ADD COLUMN     "rawData" JSONB NOT NULL;
