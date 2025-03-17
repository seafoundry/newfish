"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSharingList(): Promise<string[]> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
      select: {
        sharingWith: true,
      },
    });

    if (!user) throw new Error("User not found");

    return user.sharingWith;
  } catch (error) {
    console.error("Error fetching sharing list:", error);
    return [];
  }
}

export async function addSharing(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email) {
      return { success: false, message: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" };
    }

    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.sharingWith.includes(email)) {
      return { success: false, message: "Already sharing with this email" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sharingWith: {
          push: email,
        },
      },
    });

    return { success: true, message: `Now sharing data with ${email}` };
  } catch (error) {
    console.error("Error adding sharing:", error);
    return { success: false, message: "Failed to add sharing" };
  }
}

export async function removeSharing(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email) {
      return { success: false, message: "Email is required" };
    }

    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.sharingWith.includes(email)) {
      return { success: false, message: "Not sharing with this email" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sharingWith: {
          set: user.sharingWith.filter((e) => e !== email),
        },
      },
    });

    return { success: true, message: `Stopped sharing data with ${email}` };
  } catch (error) {
    console.error("Error removing sharing:", error);
    return { success: false, message: "Failed to remove sharing" };
  }
}
