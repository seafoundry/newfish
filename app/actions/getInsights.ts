"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

type NurseryInventory = {
  nurseries: {
    name: string;
    totalCorals: number;
    genotypes: {
      id: string;
      quantity: number;
    }[];
  }[];
  genotypeDistribution: {
    id: string;
    totalQuantity: number;
    nurseryPresence: string[];
  }[];
};

const prisma = new PrismaClient();

export async function getInsights(): Promise<NurseryInventory> {
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
            id: true,
          },
        });

    const sharedUserIds = sharingUsers.map((u) => u.id);

    const nurseryRows = await prisma.nurseryRow.findMany({
      where: {
        nurseryFile: {
          fileUpload: {
            OR: [{ userId: user.id }, { userId: { in: sharedUserIds } }],
          },
        },
      },
    });

    const nurseryMap = new Map<string, Map<string, number>>();
    nurseryRows.forEach((row) => {
      if (!nurseryMap.has(row.nursery)) {
        nurseryMap.set(row.nursery, new Map());
      }
      const nursery = nurseryMap.get(row.nursery)!;
      nursery.set(row.genetId, (nursery.get(row.genetId) || 0) + row.quantity);
    });

    const genotypeMap = new Map<
      string,
      { total: number; nurseries: Set<string> }
    >();
    nurseryRows.forEach((row) => {
      if (!genotypeMap.has(row.genetId)) {
        genotypeMap.set(row.genetId, { total: 0, nurseries: new Set() });
      }
      const genotype = genotypeMap.get(row.genetId)!;
      genotype.total += row.quantity;
      genotype.nurseries.add(row.nursery);
    });

    return {
      nurseries: Array.from(nurseryMap.entries()).map(([name, genotypes]) => ({
        name,
        totalCorals: Array.from(genotypes.values()).reduce(
          (sum, q) => sum + q,
          0
        ),
        genotypes: Array.from(genotypes.entries()).map(([id, quantity]) => ({
          id,
          quantity,
        })),
      })),
      genotypeDistribution: Array.from(genotypeMap.entries()).map(
        ([id, data]) => ({
          id,
          totalQuantity: data.total,
          nurseryPresence: Array.from(data.nurseries),
        })
      ),
    };
  } catch (error) {
    console.error("Error fetching nursery insights:", error);
    throw error;
  }
}
