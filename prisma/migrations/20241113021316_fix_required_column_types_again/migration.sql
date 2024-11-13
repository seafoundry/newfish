/*
  Warnings:

  - You are about to drop the column `genetIds` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `nurseries` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `quantities` on the `NurseryFile` table. All the data in the column will be lost.
  - You are about to drop the column `genetIds` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `groupings` on the `OutplantingFile` table. All the data in the column will be lost.
  - You are about to drop the column `quantities` on the `OutplantingFile` table. All the data in the column will be lost.
  - Added the required column `date` to the `GeneticsFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `GeneticsFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `GeneticsFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `MonitoringFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `MonitoringFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `MonitoringFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genetId` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nursery` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `NurseryFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genetId` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grouping` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `OutplantingFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneticsFile" ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "localIdGenetProp" SET NOT NULL,
ALTER COLUMN "localIdGenetProp" SET DATA TYPE TEXT,
ALTER COLUMN "species" SET NOT NULL,
ALTER COLUMN "species" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "MonitoringFile" ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "NurseryFile" DROP COLUMN "genetIds",
DROP COLUMN "nurseries",
DROP COLUMN "quantities",
ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "genetId" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nursery" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OutplantingFile" DROP COLUMN "genetIds",
DROP COLUMN "groupings",
DROP COLUMN "quantities",
ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "genetId" TEXT NOT NULL,
ADD COLUMN     "grouping" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;
