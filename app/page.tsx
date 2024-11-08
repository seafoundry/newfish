import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Coral Data Hub</div>
        <div className="space-x-4">
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <button className="text-blue-600 hover:text-blue-800">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create Account
            </button>
          </SignUpButton>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Coral Growth Data Analysis Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Share, analyze, and gain insights from coral growth data across
            agencies. Make data-driven decisions to protect our marine
            ecosystems.
          </p>
          <SignUpButton mode="modal">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">
              Get Started
            </button>
          </SignUpButton>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Data Sharing</h3>
            <p className="text-gray-600">
              Securely share coral growth data with other agencies and
              researchers.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Analysis Tools</h3>
            <p className="text-gray-600">
              Powerful query tools to analyze trends and patterns in coral
              growth.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Collaboration</h3>
            <p className="text-gray-600">
              Work together with other agencies to protect coral ecosystems.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
