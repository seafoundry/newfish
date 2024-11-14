import InsightsContent from "@/app/components/InsightsContent";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function InsightsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  return <InsightsContent />;
}
