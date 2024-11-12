/*
  Warnings:

  - You are about to drop the column `fileSize` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `storageUrl` on the `FileUpload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FileUpload" DROP COLUMN "fileSize",
DROP COLUMN "storageUrl";
