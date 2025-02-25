"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getGeneticMappings() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  const geneticMappings = await prisma.geneticMapping.findMany({
    where: {
      userId: user.id,
    },
  });

  return geneticMappings;
}

export async function getUniqueSpecies() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  const geneticsRows = await prisma.geneticsRow.findMany({
    where: {
      geneticsFile: {
        fileUpload: {
          userId: user.id,
        },
      },
      species: {
        not: null,
      },
    },
    select: {
      species: true,
    },
    distinct: ["species"],
  });

  const uniqueSpecies = new Set<string>();

  geneticsRows.forEach((row) => {
    if (row.species && row.species.trim() !== "") {
      uniqueSpecies.add(row.species.trim());
    }
  });

  return Array.from(uniqueSpecies).sort();
}
