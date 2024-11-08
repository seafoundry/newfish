import {
  CreateBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getAwsSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_BASE_NAME = "babelfish-user-assets";

const getUserBucketName = (userId: string): string => {
  // bucket names must be lowercase and can't contain special chars
  return `${BUCKET_BASE_NAME}-${userId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")}`;
};

export async function checkUserBucket(userId: string): Promise<boolean> {
  const bucketName = getUserBucketName(userId);

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if ((error as Error).name === "NotFound") {
      return false;
    }
    throw error;
  }
}

export async function createUserBucket(userId: string): Promise<void> {
  const bucketName = getUserBucketName(userId);

  try {
    const bucketExists = await checkUserBucket(userId);
    if (bucketExists) {
      return;
    }

    await s3Client.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      })
    );

    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
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

    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error) {
    console.error("Error creating bucket:", error);
    throw new Error("Failed to create storage bucket");
  }
}

export async function createSignedUploadUrl(
  userId: string,
  fileName: string,
  fileType: string,
  category: string
): Promise<string> {
  const bucketName = getUserBucketName(userId);

  try {
    const bucketExists = await checkUserBucket(userId);
    if (!bucketExists) {
      await createUserBucket(userId);
    }

    const timestamp = new Date().getTime();
    const key = `${category}/${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
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
  const bucketName = getUserBucketName(userId);

  try {
    const bucketExists = await checkUserBucket(userId);
    if (!bucketExists) {
      return [];
    }

    const command = {
      Bucket: bucketName,
    };

    const response = await s3Client.send(new ListObjectsV2Command(command));
    return response.Contents || [];
  } catch (error) {
    console.error("Error listing files:", error);
    throw new Error("Failed to list files");
  }
}
