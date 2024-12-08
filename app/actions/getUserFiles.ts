"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { FileData } from "../types/files";

const prisma = new PrismaClient();

export async function getUserFiles(): Promise<FileData[]> {
  const clerkUser = await currentUser();

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: clerkUser?.id,
    },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  const fileUploads = await prisma.fileUpload.findMany({
    where: {
      userId: user.id,
    },
  });

  return fileUploads.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    category: file.category,
    uploadDate: file.createdAt.toISOString().split("T")[0],
    status: file.status,
  }));
}
