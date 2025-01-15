"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { OutplantResponse } from "../types/files";

const prisma = new PrismaClient();

export default async function getOutplants() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
    });

    if (!user) throw new Error("User not found");

    const outplantFiles = await prisma.outplantingFile.findMany({});

    const outplants: OutplantResponse[] = [];
    const assessionGenets = await prisma.accessionGenet.findMany({
      where: {
        userId: user.id,
      },
    });

    for (const outplant of outplantFiles) {
      const responseData = {
        id: outplant.id,
        coordinates: outplant.eventCenterpoint,
        contact: outplant.email,
        date: outplant.date,
        reefName: outplant.reefName,
        siteName: outplant.siteName,
        genetics: [],
      } as OutplantResponse;

      const rows = await prisma.outplantingRow.findMany({
        where: {
          fileUploadId: outplant.id,
        },
      });

      const genetics = [];

      for (const row of rows) {
        genetics.push({
          genotype: row.genetId,
          quantity: row.quantity,
          assessionId:
            assessionGenets.find((genet) => genet.genetId === row.genetId)
              ?.accessionId || "None",
        });
      }

      responseData.genetics = genetics;
      outplants.push(responseData);
    }

    return outplants;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
