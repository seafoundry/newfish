"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { createSignedDownloadUrl } from "../lib/aws";

const prisma = new PrismaClient();

export async function getFileSignedUrls() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  // Include monitoring and all other file types
  const files = await prisma.fileUpload.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20, // Limit to recent files for better performance
  });

  const signedUrls = await Promise.all(
    files.map(async (file) => {
      const key = `users/${clerkUser.id}/${file.category}/${file.fileName}`;
      const url = await createSignedDownloadUrl(key);
      return {
        fileId: file.id,
        name: file.fileName,
        url,
      };
    })
  );

  return signedUrls;
}
