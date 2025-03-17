"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getGeneticMappings() {
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
          id: true,
        },
      });

  const sharedUserIds = sharingUsers.map((u) => u.id);

  const geneticMappings = await prisma.geneticMapping.findMany({
    where: user.godMode
      ? {}
      : {
          OR: [{ userId: user.id }, { userId: { in: sharedUserIds } }],
        },
  });

  return geneticMappings;
}

export async function getUniqueSpecies() {
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
          id: true,
        },
      });

  const sharedUserIds = sharingUsers.map((u) => u.id);

  const geneticsRows = await prisma.geneticsRow.findMany({
    where: {
      geneticsFile: {
        fileUpload: {
          OR: [{ userId: user.id }, { userId: { in: sharedUserIds } }],
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
