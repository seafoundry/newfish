"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createSignedUploadUrl } from "@/app/lib/aws";

export async function getSignedUrl(
  fileName: string,
  fileType: string,
  category: string
): Promise<string> {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized: You must be logged in to upload files");
  }

  try {
    const signedUrl = await createSignedUploadUrl(
      user.id,
      fileName,
      fileType,
      category
    );

    return signedUrl;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}
