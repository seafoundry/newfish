/*
  Warnings:

  - Added the required column `category` to the `FileUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadDate` to the `FileUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaderEmail` to the `FileUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaderName` to the `FileUpload` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('Genetics', 'Nursery', 'Outplanting', 'Monitoring');

-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "category" "FileCategory" NOT NULL,
ADD COLUMN     "uploadDate" TEXT NOT NULL,
ADD COLUMN     "uploaderEmail" TEXT NOT NULL,
ADD COLUMN     "uploaderName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GeneticsFile" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,

    CONSTRAINT "GeneticsFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryFile" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,

    CONSTRAINT "NurseryFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutplantingFile" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "reefName" TEXT NOT NULL,
    "eventCenterpoint" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,

    CONSTRAINT "OutplantingFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringFile" (
    "id" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "coordinates" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "MonitoringFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneticsFile_fileUploadId_key" ON "GeneticsFile"("fileUploadId");

-- CreateIndex
CREATE INDEX "GeneticsFile_fileUploadId_idx" ON "GeneticsFile"("fileUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "NurseryFile_fileUploadId_key" ON "NurseryFile"("fileUploadId");

-- CreateIndex
CREATE INDEX "NurseryFile_fileUploadId_idx" ON "NurseryFile"("fileUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "OutplantingFile_fileUploadId_key" ON "OutplantingFile"("fileUploadId");

-- CreateIndex
CREATE INDEX "OutplantingFile_fileUploadId_idx" ON "OutplantingFile"("fileUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringFile_fileUploadId_key" ON "MonitoringFile"("fileUploadId");

-- CreateIndex
CREATE INDEX "MonitoringFile_fileUploadId_idx" ON "MonitoringFile"("fileUploadId");

-- CreateIndex
CREATE INDEX "FileUpload_category_idx" ON "FileUpload"("category");

-- AddForeignKey
ALTER TABLE "GeneticsFile" ADD CONSTRAINT "GeneticsFile_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryFile" ADD CONSTRAINT "NurseryFile_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutplantingFile" ADD CONSTRAINT "OutplantingFile_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFile" ADD CONSTRAINT "MonitoringFile_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
