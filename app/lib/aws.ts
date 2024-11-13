import {
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getAwsSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "newfish-dev-uploads";

export async function createSignedUploadUrl(
  userId: string,
  fileName: string,
  fileType: string,
  category: string
): Promise<string> {
  try {
    const timestamp = new Date().getTime();
    const key = `users/${userId}/${category}/${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getAwsSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return signedUrl;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    throw new Error("Failed to create upload URL");
  }
}

export async function listUserFiles(userId: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `users/${userId}/`,
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    return contents.filter((file) => {
      const key = file.Key || "";
      return !key.includes("/invalid/");
    });
  } catch (error) {
    console.error("Error listing files:", error);
    throw new Error("Failed to list files");
  }
}

export async function initializeBucketCors() {
  try {
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET_NAME,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
              AllowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
  } catch (error) {
    console.error("Error setting bucket CORS:", error);
    throw new Error("Failed to initialize bucket CORS");
  }
}
