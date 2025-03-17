"use client";

import { useState, useEffect } from "react";
import { getSharingList, addSharing, removeSharing } from "../actions/share";

export default function SharingManager() {
  const [sharingList, setSharingList] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchSharingList = async () => {
      try {
        const list = await getSharingList();
        setSharingList(list);
      } catch (error) {
        console.error("Error fetching sharing list:", error);
        setMessage({
          text: "Failed to load sharing list",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharingList();
  }, []);

  const handleAddSharing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    try {
      const result = await addSharing(newEmail.trim());

      if (result.success) {
        setSharingList([...sharingList, newEmail.trim()]);
        setNewEmail("");
        setMessage({ text: result.message, type: "success" });
      } else {
        setMessage({ text: result.message, type: "error" });
      }
    } catch (error) {
      console.error("Error adding sharing:", error);
      setMessage({
        text: "An error occurred while adding sharing",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSharing = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await removeSharing(email);

      if (result.success) {
        setSharingList(sharingList.filter((e) => e !== email));
        setMessage({ text: result.message, type: "success" });
      } else {
        setMessage({ text: result.message, type: "error" });
      }
    } catch (error) {
      console.error("Error removing sharing:", error);
      setMessage({
        text: "An error occurred while removing sharing",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Data Sharing</h2>

      {/* Status message */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add new sharing form */}
      <form onSubmit={handleAddSharing} className="mb-6">
        <div className="flex items-center space-x-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email to share with"
            className="flex-1 border rounded-md p-2 text-sm"
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Share"}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Add emails of colleagues you want to share your data with
        </p>
      </form>

      {/* Current sharing list */}
      <div>
        <h3 className="font-medium mb-2 text-sm text-gray-700">
          Currently sharing with:
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : sharingList.length === 0 ? (
          <p className="text-sm text-gray-500">
            You are not sharing data with anyone yet
          </p>
        ) : (
          <ul className="space-y-2">
            {sharingList.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
              >
                <span>{email}</span>
                <button
                  onClick={() => handleRemoveSharing(email)}
                  className="text-red-600 hover:text-red-800"
                  disabled={isLoading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
