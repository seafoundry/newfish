"use server";

import { createSignedUploadUrl } from "@/app/lib/aws";
import { currentUser } from "@clerk/nextjs/server";
import { FileCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSignedUrl(
  fileName: string,
  fileType: string,
  category: string,
  metadata: Record<string, string>
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

    console.log("Creating FileUpload record with fileName:", fileName);
    const fileUploadId = crypto.randomUUID();

    await prisma.fileUpload.create({
      data: {
        id: fileUploadId,
        userId: dbUser.id,
        fileName,
        mimeType: fileType,
        category: category as FileCategory,
        updatedAt: new Date(),
        ...(() => {
          const baseData = {
            name: metadata.name,
            email: metadata.email,
            date: metadata.date,
            rawData: {},
          };

          switch (category) {
            case "Genetics":
              return {
                geneticsFile: {
                  create: {
                    ...baseData,
                    localIdGenetProp: metadata.localIdGenetProp || "",
                    species: metadata.species || "",
                  },
                },
              };
            case "Nursery":
              return {
                nurseryFile: {
                  create: {
                    ...baseData,
                    organization: metadata.organization || "",
                    genetId: metadata.genetId || "",
                    quantity: parseInt(metadata.quantity || "0"),
                    nursery: metadata.nursery || "",
                  },
                },
              };
            case "Outplanting":
              return {
                outplantingFile: {
                  create: {
                    ...baseData,
                    reefName: metadata.reefName || "",
                    eventCenterpoint: metadata.eventCenterpoint || "",
                    siteName: metadata.siteName || "",
                    eventName: metadata.eventName || "",
                    genetId: metadata.genetId || "",
                    quantity: parseInt(metadata.quantity || "0"),
                    grouping: metadata.grouping || "",
                  },
                },
              };
            case "Monitoring":
              return {
                monitoringFile: {
                  create: {
                    ...baseData,
                    coordinates: metadata.coordinates || "",
                    eventId: metadata.eventId || "",
                  },
                },
              };
            default:
              throw new Error(`Invalid category: ${category}`);
          }
        })(),
      },
    });

    return signedUrl;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate upload URL";
    throw new Error(errorMessage);
  }
}
