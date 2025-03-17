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
    select: {
      id: true,
      email: true,
      godMode: true,
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
          email: true,
          fileUploads: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

  const allFiles = [...user.fileUploads];

  sharingUsers.forEach((sharingUser) => {
    sharingUser.fileUploads.forEach((file) => {
      allFiles.push({
        ...file,
        fileName: `${file.fileName} (shared by ${sharingUser.email})`,
      });
    });
  });

  allFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return allFiles.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    category: file.category as FileCategory,
    uploadDate: file.createdAt.toISOString().split("T")[0],
    status: file.status,
  }));
}
