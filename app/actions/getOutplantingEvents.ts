"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getOutplantingEvents() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  const outplantingEvents = await prisma.fileUpload.findMany({
    where: {
      userId: user.id,
      category: "Outplanting",
    },
    include: {
      outplantingFile: true,
    },
  });

  return outplantingEvents.map((event) => {
    return {
      id: event.id,
      outplantingFileId: event.outplantingFile
        ? event.outplantingFile.id
        : null,
      createdAt: event.createdAt,
      status: event.status,
      metadata: {
        reefName: event.outplantingFile?.reefName || "Unnamed Reef",
        siteName: event.outplantingFile?.siteName || "Unnamed Site",
        eventName: event.outplantingFile?.eventName || "Unnamed Event",
      },
    };
  });
}
