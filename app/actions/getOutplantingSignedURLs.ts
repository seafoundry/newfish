"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { createSignedDownloadUrl } from "../lib/aws";

const prisma = new PrismaClient();

export async function getOutplantingSignedURLs() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  const outplantingFiles = await prisma.outplantingFile.findMany({
    where: {
      fileUpload: {
        userId: user.id,
        category: "Outplanting",
      },
    },
    include: {
      fileUpload: true,
    },
  });

  const signedUrls = await Promise.all(
    outplantingFiles.map(async (file) => {
      const key = `users/${clerkUser.id}/Outplanting/${file.fileUpload.fileName}`;
      const url = await createSignedDownloadUrl(key);
      return {
        fileId: file.id,
        name: file.fileUpload.fileName.split("-").slice(1).join("-"),
        url,
      };
    })
  );

  return signedUrls;
}
