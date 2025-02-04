"use server";

import { currentUser } from "@clerk/nextjs/server";
import { NurseryRow, PrismaClient } from "@prisma/client";
import { getGeneticMappings } from "./getGeneticMappings";

const prisma = new PrismaClient();

export async function getNurseries() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
    });

    if (!user) throw new Error("User not found");

    const nurseryRows = await prisma.nurseryRow.findMany({
      where: {
        nurseryFile: {
          fileUpload: {
            userId: user.id,
          },
        },
      },
    });

    const geneticMappings = await getGeneticMappings();

    const groupedNurseries = nurseryRows.reduce(
      (acc: Record<string, NurseryRow[]>, row: NurseryRow) => {
        const group = row.nursery || "Unknown Nursery";
        if (!acc[group]) acc[group] = [];
        acc[group].push(row);
        return acc;
      },
      {}
    );

    const nurseriesWithMappings = Object.entries(groupedNurseries).map(
      ([nursery, rows]) => {
        const mappings = geneticMappings.filter((mapping) =>
          rows.some((row) => row.genetId === mapping.localGenetId)
        );
        return { nursery, nurseryRows: rows, geneticMappings: mappings };
      }
    );

    return nurseriesWithMappings;
  } catch (error) {
    console.error("Error fetching nursery insights:", error);
    throw error;
  }
}
