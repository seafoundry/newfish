"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoadingUser() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">
        Setting up your account...
      </h2>
      <p className="mt-2 text-gray-500">This will only take a moment</p>
    </div>
  );
}
