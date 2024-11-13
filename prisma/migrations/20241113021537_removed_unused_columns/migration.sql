/*
  Warnings:

  - You are about to drop the column `uploadDate` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `uploaderEmail` on the `FileUpload` table. All the data in the column will be lost.
  - You are about to drop the column `uploaderName` on the `FileUpload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FileUpload" DROP COLUMN "uploadDate",
DROP COLUMN "uploaderEmail",
DROP COLUMN "uploaderName";
