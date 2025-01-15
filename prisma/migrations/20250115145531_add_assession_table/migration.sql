-- CreateTable
CREATE TABLE "AccessionGenet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genetId" TEXT NOT NULL,
    "accessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessionGenet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessionGenet_accessionId_idx" ON "AccessionGenet"("accessionId");

-- CreateIndex
CREATE INDEX "AccessionGenet_genetId_idx" ON "AccessionGenet"("genetId");

-- AddForeignKey
ALTER TABLE "AccessionGenet" ADD CONSTRAINT "AccessionGenet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
