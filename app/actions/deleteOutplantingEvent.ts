"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function deleteOutplantingEvent(outplantFileId: string) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      throw new Error("Authentication required");
    }

    const outplantFile = await prisma.outplantingFile.findUnique({
      where: { id: outplantFileId, fileUpload: { userId: user.id } },
      include: {
        fileUpload: true,
      },
    });

    if (!outplantFile) {
      throw new Error("Outplanting event not found");
    }

    const dbUser = await prisma.user.findFirst({
      where: { clerkUserId: userId },
    });

    if (!dbUser || dbUser.id !== outplantFile.fileUpload.userId) {
      throw new Error("Not authorized to delete this outplanting event");
    }

    const monitoringRecords = await prisma.monitoringFile.findMany({
      where: {
        fileUploadId: outplantFileId,
        fileUpload: {
          userId: user.id,
        },
      },
    });

    if (monitoringRecords.length > 0) {
      await prisma.monitoringRow.deleteMany({
        where: {
          fileUploadId: {
            in: monitoringRecords.map((record) => record.id),
          },
        },
      });

      await prisma.monitoringFile.deleteMany({
        where: {
          id: {
            in: monitoringRecords.map((record) => record.id),
          },
        },
      });

      await prisma.fileUpload.deleteMany({
        where: {
          id: {
            in: monitoringRecords.map((record) => record.fileUploadId),
          },
        },
      });
    }

    await prisma.$transaction([
      prisma.outplantingRow.deleteMany({
        where: {
          fileUploadId: outplantFileId,
        },
      }),
      prisma.outplantingFile.delete({
        where: {
          id: outplantFileId,
        },
      }),
      prisma.fileUpload.delete({
        where: {
          id: outplantFile.fileUploadId,
        },
      }),
    ]);

    return { success: true, message: "Outplanting event deleted successfully" };
  } catch (error) {
    console.error("Error deleting outplanting event:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete outplanting event",
    };
  }
}
