"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { OutplantResponse, GeneticDetails } from "../types/files";

const prisma = new PrismaClient();

export default async function getOutplants() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
      select: {
        id: true,
        email: true,
        godMode: true,
      },
    });

    if (!user) throw new Error("User not found");

    const outplantFiles = await prisma.outplantingFile.findMany({
      where: user.godMode ? {} : { email: user.email },
      include: {
        rows: true,
      },
    });

    const geneticsRows = await prisma.geneticsRow.findMany({
      where: user.godMode
        ? {}
        : {
            geneticsFile: {
              email: user.email,
            },
          },
      select: {
        localIdGenetProp: true,
        accessionNumber: true,
        additionalData: true,
        species: true,
      },
    });

    const outplants: OutplantResponse[] = outplantFiles.map((outplant) => ({
      id: outplant.id,
      coordinates: outplant.eventCenterpoint,
      contact: outplant.email,
      date: outplant.date,
      reefName: outplant.reefName,
      siteName: outplant.siteName,
      eventName: outplant.eventName,
      genetics: outplant.rows.map((row) => {
        const exactGeneticData = geneticsRows.find(
          (genet) => genet.localIdGenetProp === row.genetId
        );

        if (exactGeneticData) {
          return {
            genotype: row.genetId,
            quantity: row.quantity,
            grouping: row.grouping,
            assessionId: exactGeneticData.accessionNumber || "None",
            geneticDetails: exactGeneticData.additionalData as
              | GeneticDetails
              | undefined,
          };
        }

        const localIdMatch = row.genetId.split("-")[0];
        const matchingGeneticsByLocalId = geneticsRows.filter(
          (genet) =>
            genet.localIdGenetProp.startsWith(localIdMatch) ||
            genet.localIdGenetProp === localIdMatch
        );

        const geneticData =
          matchingGeneticsByLocalId.length > 0
            ? matchingGeneticsByLocalId[0]
            : null;

        return {
          genotype: row.genetId,
          quantity: row.quantity,
          grouping: row.grouping,
          assessionId: geneticData?.accessionNumber || "None",
          geneticDetails: geneticData?.additionalData as
            | GeneticDetails
            | undefined,
        };
      }),
    }));

    return outplants;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
