import { S3Event, Context } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { parse } from "csv-parse/sync";

const s3Client = new S3Client({});

const REQUIRED_COLUMNS = {
  Genetics: process.env.REQUIRED_COLUMNS_GENETICS?.split(",") || [],
  Nursery: process.env.REQUIRED_COLUMNS_NURSERY?.split(",") || [],
  Outplanting: process.env.REQUIRED_COLUMNS_OUTPLANTING?.split(",") || [],
  Monitoring: [],
};

function validateCSV(data: Buffer, category: string): boolean {
  const records = parse(data, {
    columns: true,
    skip_empty_lines: true,
  });

  const headers = Object.keys(records[0] || {});

  const requiredColumns =
    REQUIRED_COLUMNS[category as keyof typeof REQUIRED_COLUMNS];

  if (!requiredColumns) {
    throw new Error(`Invalid category: ${category}`);
  }

  const missingColumns = requiredColumns.filter(
    (col) => !headers.includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handler(event: S3Event, context: Context) {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key);

  if (key.includes("/invalid/")) {
    console.log("Skipping validation for file in invalid folder:", key);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Skipped validation for invalid file" }),
    };
  }

  try {
    const pathParts = key.split("/");
    const category = pathParts[2]; // Original category position

    if (
      !category ||
      !REQUIRED_COLUMNS[category as keyof typeof REQUIRED_COLUMNS]
    ) {
      throw new Error(`Invalid category in path: ${key}`);
    }

    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const fileContent = await response.Body?.transformToByteArray();
    if (!fileContent) {
      throw new Error("Failed to read file content");
    }

    validateCSV(Buffer.from(fileContent), category);

    console.log(`File ${key} is valid`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File validation successful" }),
    };
  } catch (error) {
    console.error(`Validation error for ${key}:`, error);

    try {
      const pathParts = key.split("/");
      pathParts.splice(2, 0, "invalid");
      const newKey = pathParts.join("/");

      await s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: newKey,
        })
      );

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      console.log(`Moved invalid file from ${key} to ${newKey}`);
    } catch (moveError) {
      console.error("Error moving invalid file:", moveError);
    }

    throw error;
  }
}
