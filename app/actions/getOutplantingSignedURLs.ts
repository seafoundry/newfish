"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { createSignedDownloadUrl, listUserFilesInSubFolder } from "../lib/aws";

const prisma = new PrismaClient();

export async function getOutplantingSignedURLs() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  const files = await listUserFilesInSubFolder(clerkUser.id, "Outplanting");
  const signedUrls = [];

  for (const file of files) {
    if (!file.Key) continue;
    const fileName = file.Key.split("/").pop();
    if (!fileName) continue;

    const url = await createSignedDownloadUrl(file.Key);
    signedUrls.push({
      name: fileName,
      url,
    });
  }

  return signedUrls;
}
