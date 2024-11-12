"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createSignedUploadUrl } from "@/app/lib/aws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSignedUrl(
  fileName: string,
  fileType: string,
  category: string
): Promise<string> {
  if (fileType !== "text/csv") {
    throw new Error("Only CSV files are allowed");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized: You must be logged in to upload files");
  }

  try {
    const [dbUser, signedUrl] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId: user.id },
        select: { id: true },
      }),
      createSignedUploadUrl(user.id, fileName, fileType, category),
    ]);

    if (!dbUser) {
      throw new Error("User not found in database");
    }

    await prisma.fileUpload.create({
      data: {
        userId: dbUser.id,
        fileName,
        mimeType: fileType,
      },
    });

    return signedUrl;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate upload URL";
    throw new Error(errorMessage);
  }
}
