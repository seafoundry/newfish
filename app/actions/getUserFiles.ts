"use server";

import { currentUser } from "@clerk/nextjs/server";
import { listUserFiles } from "../lib/aws";
import { FileData } from "../types/files";

export async function getUserFiles(): Promise<FileData[]> {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const s3Files = await listUserFiles(user.id);

    return s3Files.map((file) => ({
      id: file.Key || "",
      fileName: file.Key?.split("/").pop() || "",
      category: file.Key?.split("/")[2] || "Uncategorized",
      uploadDate: file.LastModified?.toISOString().split("T")[0] || "",
      fileUrl: file.Key || "",
      size: file.Size,
    }));
  } catch (error) {
    console.error("Error fetching user files:", error);
    throw new Error("Failed to fetch files");
  }
}
