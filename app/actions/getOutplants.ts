"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { parseCoralId } from "../lib/coral";
import { GeneticDetails, OutplantResponse } from "../types/files";

const makeUniqueGenotype = (genotype: string, grouping: string) => {
  return genotype.includes(`__group_${grouping}`)
    ? genotype
    : `${genotype}__group_${grouping}`;
};

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

    const sharingUsers = user.godMode
      ? []
      : await prisma.user.findMany({
          where: {
            sharingWith: {
              has: user.email,
            },
          },
          select: {
            email: true,
          },
        });

    const sharedEmails = sharingUsers.map((u) => u.email);

    const outplantFiles = await prisma.outplantingFile.findMany({
      where: user.godMode
        ? {}
        : {
            OR: [{ email: user.email }, { email: { in: sharedEmails } }],
          },
      include: {
        rows: true,
      },
    });

    const geneticsRows = await prisma.geneticsRow.findMany({
      where: user.godMode
        ? {}
        : {
            geneticsFile: {
              OR: [{ email: user.email }, { email: { in: sharedEmails } }],
            },
          },
      select: {
        localIdGenetProp: true,
        accessionNumber: true,
        additionalData: true,
        species: true,
      },
    });

    const outplants: OutplantResponse[] = outplantFiles.map((outplant) => {
      const rowsByLocalId = new Map<string, typeof outplant.rows>();

      outplant.rows.forEach((row) => {
        const localId = row.genetId.split("-")[0];
        if (!rowsByLocalId.has(localId)) {
          rowsByLocalId.set(localId, []);
        }
        rowsByLocalId.get(localId)!.push(row);
      });

      const processedGenetics = outplant.rows.map((row) => {
        const exactGeneticData = geneticsRows.find(
          (genet) => genet.localIdGenetProp === row.genetId
        );

        const parsedId = parseCoralId(row.genetId);
        const localId = parsedId.localId || row.genetId.split("-")[0];
        const uniqueGenotype = makeUniqueGenotype(row.genetId, row.grouping);

        if (exactGeneticData) {
          return {
            genotype: row.genetId,
            uniqueGenotype: uniqueGenotype,
            quantity: row.quantity,
            grouping: row.grouping,
            localId: localId,
            species: exactGeneticData.species || parsedId.speciesName,
            assessionId: exactGeneticData.accessionNumber || "None",
            accessionNumber: exactGeneticData.accessionNumber || "None",
            geneticDetails: exactGeneticData.additionalData as
              | GeneticDetails
              | undefined,
          };
        }

        const matchingGeneticsByLocalId = geneticsRows.filter(
          (genet) =>
            genet.localIdGenetProp.startsWith(localId) ||
            genet.localIdGenetProp === localId
        );

        const geneticData =
          matchingGeneticsByLocalId.length > 0
            ? matchingGeneticsByLocalId[0]
            : null;

        return {
          genotype: row.genetId,
          uniqueGenotype: uniqueGenotype,
          quantity: row.quantity,
          grouping: row.grouping,
          localId: localId,
          species: geneticData?.species || parsedId.speciesName,
          assessionId: geneticData?.accessionNumber || "None",
          accessionNumber: geneticData?.accessionNumber || "None",
          geneticDetails: geneticData?.additionalData as
            | GeneticDetails
            | undefined,
        };
      });

      return {
        id: outplant.id,
        coordinates: outplant.eventCenterpoint,
        contact: outplant.email,
        date: outplant.date,
        reefName: outplant.reefName,
        siteName: outplant.siteName,
        eventName: outplant.eventName,
        genetics: processedGenetics,
      };
    });

    return outplants;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
