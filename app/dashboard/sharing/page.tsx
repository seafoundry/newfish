"use client";

import SharingManager from "@/app/components/SharingManager";

export default function SharingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h1 className="text-2xl font-bold mb-2">Data Sharing</h1>
            <p className="text-gray-600">
              Share your data with other users by adding their email address. 
              They will be able to see your uploaded data in their dashboard.
            </p>
          </div>
          
          <SharingManager />
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">How sharing works</h3>
            <ul className="list-disc pl-5 text-blue-700 space-y-1">
              <li>When you add a user's email, they can see your data in their dashboard</li>
              <li>They will be able to view your outplants, monitoring data, and genetics</li>
              <li>They cannot modify or delete your data</li>
              <li>You can stop sharing at any time by removing their email</li>
              <li>The user must have an account in the system for sharing to work</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}