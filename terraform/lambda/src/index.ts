import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Context, S3Event } from "aws-lambda";
import { parse } from "csv-parse/sync";

const s3Client = new S3Client({});

let prisma: PrismaClient;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Failed to initialize Prisma:", error);
  prisma = new PrismaClient();
}

const REQUIRED_COLUMNS = {
  Genetics: process.env.REQUIRED_COLUMNS_GENETICS?.split(",") || [],
  Nursery: process.env.REQUIRED_COLUMNS_NURSERY?.split(",") || [],
  Outplanting: process.env.REQUIRED_COLUMNS_OUTPLANTING?.split(",") || [],
  Monitoring: [],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handler(event: S3Event, context: Context) {
  try {
    await prisma.$connect();

    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);

    console.log("record:", record);
    console.log("bucket:", bucket);
    console.log("key:", key);

    if (key.includes("/invalid/")) {
      console.log("Skipping validation for file in invalid folder:", key);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Skipped validation for invalid file",
        }),
      };
    }

    const pathParts = key.split("/");
    const clerkUserId = pathParts[1];

    const user = await prisma.user.findFirst({ where: { clerkUserId } });
    if (!user) {
      throw new Error(`User not found for clerkUserId: ${clerkUserId}`);
    }

    const fileName = pathParts[pathParts.length - 1].split("-").pop();
    if (!fileName) {
      throw new Error("Could not extract filename from key: " + key);
    }
    console.log("fileName:", fileName);

    const fileUploads = await prisma.fileUpload.findMany({
      where: { fileName: fileName, userId: user.id, status: "PENDING" },
    });

    if (fileUploads.length === 0) {
      console.log("No pending FileUpload records found for:", key);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No pending FileUpload records found",
        }),
      };
    }

    const fileUpload = fileUploads[0];
    const category = fileUpload.category;

    if (!category) {
      throw new Error("FileUpload record is missing category");
    }

    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const fileContent = await response.Body?.transformToByteArray();
    if (!fileContent) {
      throw new Error("Failed to read file content");
    }

    const records = parse(Buffer.from(fileContent), {
      columns: true,
      skip_empty_lines: true,
    });

    switch (category) {
      case "Monitoring":
        await prisma.monitoringFile.update({
          where: { fileUploadId: fileUpload.id },
          data: {
            rawData: records,
          },
        });

        await prisma.fileUpload.update({
          where: { id: fileUpload.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;
      case "Nursery":
        await prisma.nurseryFile.update({
          where: { fileUploadId: fileUpload.id },
          data: {
            rawData: records,
          },
        });

        await prisma.fileUpload.update({
          where: { id: fileUpload.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;
      case "Outplanting":
        await prisma.outplantingFile.update({
          where: { fileUploadId: fileUpload.id },
          data: {
            rawData: records,
          },
        });

        await prisma.fileUpload.update({
          where: { id: fileUpload.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;
      case "Genetics":
        await prisma.geneticsFile.update({
          where: { fileUploadId: fileUpload.id },
          data: {
            rawData: records,
          },
        });

        await prisma.fileUpload.update({
          where: { id: fileUpload.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;
    }
  } finally {
    await prisma.$disconnect();
  }
}
