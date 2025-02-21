"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { FileCategory, FileData } from "../types/files";

const prisma = new PrismaClient();

export async function getUserFiles(): Promise<FileData[]> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: clerkUser.id,
    },
    include: {
      fileUploads: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.fileUploads.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    category: file.category as FileCategory,
    uploadDate: file.createdAt.toISOString().split("T")[0],
    status: file.status,
  }));
}
