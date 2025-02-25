"use server";

import { createSignedUploadUrl } from "@/app/lib/aws";
import { currentUser } from "@clerk/nextjs/server";
import {
  FileCategory,
  MonitoringFile,
  NurseryFile,
  OutplantingFile,
  PrismaClient,
} from "@prisma/client";

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
    const timestamp = new Date().getTime();
    const fileNameWithTimestamp = `${timestamp}-${fileName}`;

    const [dbUser, signedUrl] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId: user.id },
        select: { id: true },
      }),
      createSignedUploadUrl(user.id, fileNameWithTimestamp, fileType, category),
    ]);

    if (!dbUser) {
      throw new Error("User not found in database");
    }

    const fileUploadId = crypto.randomUUID();

    const fu = await prisma.$transaction(async (tx) => {
      const fileUpload = await tx.fileUpload.create({
        data: {
          id: fileUploadId,
          userId: dbUser.id,
          fileName: fileName,
          fileS3Name: fileNameWithTimestamp,
          mimeType: fileType,
          category: category as FileCategory,
          updatedAt: new Date(),
        },
      });

      const baseData: {
        id: string;
        fileUploadId: string;
        name: string;
        email: string;
        date: string;

        // Nursery-specific field
        organization?: string;

        // Outplanting-specific fields
        reefName?: string;
        eventCenterpoint?: string;
        siteName?: string;
        eventName?: string;

        // Monitoring-specific fields
        coordinates?: string;
        eventId?: string;
      } = {
        id: crypto.randomUUID(),
        fileUploadId: fileUpload.id,
        name: metadata.name,
        email: metadata.email,
        date: metadata.date,
      };

      switch (category) {
        case "GeneticsMapping":
          break;
        case "Genetics":
          console.log("inside of switch, baseData:", baseData);
          await tx.geneticsFile.create({ data: baseData });
          break;
        case "Nursery":
          baseData.organization = metadata.organization;

          await tx.nurseryFile.create({ data: baseData as NurseryFile });
          break;
        case "Outplanting":
          baseData.reefName = metadata.reefName;
          baseData.eventCenterpoint = metadata.eventCenterpoint;
          baseData.siteName = metadata.siteName;
          baseData.eventName = metadata.eventName;

          await tx.outplantingFile.create({
            data: baseData as OutplantingFile,
          });
          break;
        case "Monitoring":
          baseData.coordinates = metadata.coordinates;
          baseData.eventId = metadata.eventId;

          await tx.monitoringFile.create({ data: baseData as MonitoringFile });
          break;
        default:
          throw new Error(`Invalid category: ${category}`);
      }

      return fileUpload;
    });

    console.log("Created FileUpload record:", fu);

    return signedUrl;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate upload URL";
    throw new Error(errorMessage);
  }
}
