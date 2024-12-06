-- CreateTable
CREATE TABLE "GeneticMapping" (
    "id" TEXT NOT NULL,
    "geneticsFileId" TEXT NOT NULL,
    "localGenetId" TEXT NOT NULL,
    "externalGenetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneticMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneticMapping_geneticsFileId_idx" ON "GeneticMapping"("geneticsFileId");

-- CreateIndex
CREATE INDEX "GeneticMapping_localGenetId_idx" ON "GeneticMapping"("localGenetId");

-- CreateIndex
CREATE INDEX "GeneticMapping_externalGenetId_idx" ON "GeneticMapping"("externalGenetId");

-- AddForeignKey
ALTER TABLE "GeneticMapping" ADD CONSTRAINT "GeneticMapping_geneticsFileId_fkey" FOREIGN KEY ("geneticsFileId") REFERENCES "GeneticsFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
