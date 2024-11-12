import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { Webhook } from "svix";

const prisma = new PrismaClient();
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

type WebhookEvent = {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string;
    last_name: string;
    profile_image_url: string;
  };
  type: string;
};

export async function POST(request: Request) {
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headersList = headers();
  const svixHeaders = {
    "svix-id": headersList.get("svix-id") ?? "",
    "svix-timestamp": headersList.get("svix-timestamp") ?? "",
    "svix-signature": headersList.get("svix-signature") ?? "",
  };

  const body = await request.text();
  const svix = new Webhook(webhookSecret);

  try {
    svix.verify(body, svixHeaders);
    const user = JSON.parse(body) as WebhookEvent;

    await prisma.user.create({
      data: {
        clerkUserId: user.data.id,
        email: user.data.email_addresses[0].email_address,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return new Response("Webhook processed successfully", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
