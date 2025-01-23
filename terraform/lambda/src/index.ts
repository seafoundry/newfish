import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GeneticsRow, NurseryRow, PrismaClient } from "@prisma/client";
import { Context, S3Event } from "aws-lambda";
import { randomUUID } from "crypto";
import { parse } from "csv-parse/sync";

const s3Client = new S3Client({});

let prisma: PrismaClient;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Failed to initialize Prisma:", error);
  prisma = new PrismaClient();
}

// const REQUIRED_COLUMNS = {
//   Genetics: process.env.REQUIRED_COLUMNS_GENETICS?.split(",") || [],
//   Nursery: process.env.REQUIRED_COLUMNS_NURSERY?.split(",") || [],
//   Outplanting: process.env.REQUIRED_COLUMNS_OUTPLANTING?.split(",") || [],
//   Monitoring: [],
// };

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

    const fullFileName = pathParts[pathParts.length - 1];
    const fileName = fullFileName.split("-").slice(1).join("-");

    const user = await prisma.user.findFirst({ where: { clerkUserId } });
    if (!user) {
      throw new Error(`User not found for clerkUserId: ${clerkUserId}`);
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
      case "GeneticsMapping":
        await prisma.$transaction(async (tx) => {
          await tx.geneticMapping.createMany({
            data: records.map((record: Record<string, string>) => {
              const columns = Object.values(record);
              return {
                id: randomUUID(),
                userId: user.id,
                localGenetId: columns[0],
                externalGenetId: columns[1],
              };
            }),
          });
        });
        break;
      case "Genetics":
        await prisma.$transaction(async (tx) => {
          const file = await tx.geneticsFile.findUnique({
            where: { fileUploadId: fileUpload.id },
          });

          if (!file) {
            console.log(
              `Can't find genetics file for fileUploadId: ${fileUpload.id}`
            );
            throw new Error("Genetics file not found");
          }

          // ONLY ONE SOURCE OF TRUTH FOR GENETICS AND NURSERY
          await tx.geneticsRow.deleteMany({
            where: {
              GeneticsFile: {
                FileUpload: {
                  userId: user.id,
                },
              },
            },
          });

          await tx.geneticsRow.createMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: records.map((record: any) => {
              const localIdGenetProp = record["Local ID/Genet Propagation"];
              const accessionNumber = record["AccessionNumber"] || "None"; // this might not be included

              const additionalData = { ...record };
              delete additionalData["Local ID/Genet Propagation"];
              delete additionalData["Species"];
              delete additionalData["AccessionNumber"];

              return {
                id: randomUUID(),
                fileUploadId: file.id,
                localIdGenetProp,
                accessionNumber,
                additionalData,
              } as GeneticsRow;
            }),
          });
        });
        break;
      case "Nursery":
        await prisma.$transaction(async (tx) => {
          const file = await tx.nurseryFile.findUnique({
            where: { fileUploadId: fileUpload.id },
          });

          if (!file) {
            console.log(
              `Can't find nursery file for fileUploadId: ${fileUpload.id}`
            );
            throw new Error("Nursery file not found");
          }

          // ONLY ONE SOURCE OF TRUTH FOR GENETICS AND NURSERY
          await tx.nurseryRow.deleteMany({
            where: {
              NurseryFile: {
                FileUpload: {
                  userId: user.id,
                },
              },
            },
          });

          await tx.nurseryRow.createMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: records.map((record: any) => {
              const localIdGenetProp = record["Genotype"];
              const quantity = parseInt(record["Quantity"]);
              const nursery = record["Nursery"];

              const additionalData = { ...record };

              delete additionalData["Genotype"];
              delete additionalData["Quantity"];
              delete additionalData["Nursery"];

              return {
                id: randomUUID(),
                fileUploadId: file.id,
                genetId: localIdGenetProp,
                quantity,
                nursery,
                additionalData,
              } as NurseryRow;
            }),
          });
        });
        break;
      case "Outplanting":
        await prisma.$transaction(async (tx) => {
          const file = await tx.outplantingFile.findUnique({
            where: { fileUploadId: fileUpload.id },
          });

          if (!file) {
            console.log(
              `Can't find outplanting file for fileUploadId: ${fileUpload.id}`
            );
            throw new Error("Outplanting file not found");
          }

          await tx.outplantingRow.createMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: records.map((record: any) => {
              const genetId = record["Genotype"];
              const quantity = parseInt(record["Quantity"]);
              const grouping = record["Tag"];

              const additionalData = { ...record };

              delete additionalData["Genotype"];
              delete additionalData["Quantity"];
              delete additionalData["Tag"];

              return {
                id: randomUUID(),
                fileUploadId: file.id,
                genetId,
                quantity,
                grouping,
                additionalData,
              };
            }),
          });
        });
        break;
      case "Monitoring":
        await prisma.$transaction(async (tx) => {
          const file = await tx.monitoringFile.findUnique({
            where: { fileUploadId: fileUpload.id },
          });

          if (!file) {
            console.log(
              `Can't find monitoring file for fileUploadId: ${fileUpload.id}`
            );
            throw new Error("Monitoring file not found");
          }

          await tx.monitoringRow.createMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: records.map((record: any) => {
              const { ...rest } = record;
              return {
                id: randomUUID(),
                fileUploadId: file.id,
                additionalData: rest,
              };
            }),
          });
        });
    }

    await prisma.fileUpload.update({
      where: { id: fileUpload.id },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        updatedAt: new Date(),
        fileName: fullFileName,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
