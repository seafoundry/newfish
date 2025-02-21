import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { getUserFiles } from "../actions/getUserFiles";
import FileUploadForm from "../components/FileUploadForm";
import LoadingUser from "../components/LoadingUser";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const clerkUser = await currentUser();
  const user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser?.id },
  });

  if (!user) {
    return <LoadingUser />;
  }

  const files = await getUserFiles();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6"></div>
        <FileUploadForm files={files} />
      </div>
    </div>
  );
}
