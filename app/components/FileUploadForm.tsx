"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSignedUrl } from "@/app/actions/getSignedUrl";
import { FileCategory } from "@/app/types/files";
import Papa from "papaparse";

const categories: FileCategory[] = [
  "Genetics",
  "Nursery",
  "Outplanting",
  "Monitoring",
];

const requiredColumns = {
  Genetics: ["Local ID/Genet Propagation"],
  Nursery: ["Genotype", "Quantity", "Nursery"],
  Outplanting: ["Genotype", "Quantity", "Tag"],
  Monitoring: [],
};

const validateFileColumns = (
  file: File,
  category: FileCategory
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (category === "Monitoring") {
      resolve(true);
      return;
    }

    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        const headers = results.meta.fields?.map((h) => h.toLowerCase()) || [];
        const required = requiredColumns[category].map((col) =>
          col.toLowerCase()
        );

        const missingColumns = required.filter((col) => !headers.includes(col));

        if (missingColumns.length > 0) {
          reject(
            `Missing required columns: ${requiredColumns[category]
              .filter((col) => missingColumns.includes(col.toLowerCase()))
              .join(", ")}`
          );
        } else {
          resolve(true);
        }
      },
      error: (error) => {
        reject(`Failed to parse file: ${error.message}`);
      },
    });
  });
};

interface FormData {
  name: string;
  email: string;
  date: string;
  organization: string;
  reefName: string;
  eventCenterpoint: string;
  siteName: string;
  eventName: string;
  coordinates: string;
  eventId: string;
  file: File | null;
}

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  required = true,
}: {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1 text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      required={required}
    />
  </div>
);

export default function FileUploadForm() {
  const router = useRouter();
  const [category, setCategory] = useState<FileCategory | "">("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    date: "",
    organization: "",
    reefName: "",
    eventCenterpoint: "",
    siteName: "",
    eventName: "",
    coordinates: "",
    eventId: "",
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setUploadError("Please upload a CSV file");
        return;
      }

      try {
        if (category) {
          await validateFileColumns(file, category as FileCategory);
          setFormData((prev) => ({ ...prev, file }));
          setUploadError(null);
        } else {
          setUploadError("Please select a category first");
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : String(error));
        e.target.value = "";
        setFormData((prev) => ({ ...prev, file: null }));
      }
    },
    [category]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      if (!formData.file) {
        throw new Error("No file selected");
      }

      const metadata: Record<string, string> = {};

      if (formData.name) metadata.name = formData.name;
      if (formData.email) metadata.email = formData.email;
      if (formData.date) metadata.date = formData.date;

      switch (category) {
        case "Nursery":
          if (formData.organization)
            metadata.organization = formData.organization;
          break;
        case "Outplanting":
          if (formData.reefName) metadata.reefName = formData.reefName;
          if (formData.eventCenterpoint)
            metadata.eventCenterpoint = formData.eventCenterpoint;
          if (formData.siteName) metadata.siteName = formData.siteName;
          if (formData.eventName) metadata.eventName = formData.eventName;
          break;
        case "Monitoring":
          if (formData.coordinates) metadata.coordinates = formData.coordinates;
          if (formData.eventId) metadata.eventId = formData.eventId;
          break;
      }

      const signedUrl = await getSignedUrl(
        formData.file.name,
        formData.file.type,
        category,
        metadata
      );

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: formData.file,
        headers: {
          "Content-Type": formData.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setFormData({
        name: "",
        email: "",
        date: "",
        organization: "",
        reefName: "",
        eventCenterpoint: "",
        siteName: "",
        eventName: "",
        coordinates: "",
        eventId: "",
        file: null,
      });
      setCategory("");

      alert("File uploaded successfully!");

      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Upload New File</h2>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FileCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <InputField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
        />
        <InputField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <InputField
          label="Date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
        />

        {category === "Nursery" && (
          <InputField
            label="Organization"
            name="organization"
            value={formData.organization}
            onChange={handleInputChange}
          />
        )}

        {category === "Outplanting" && (
          <>
            <InputField
              label="Reef Name"
              name="reefName"
              value={formData.reefName}
              onChange={handleInputChange}
            />
            <InputField
              label="Event Centerpoint"
              name="eventCenterpoint"
              value={formData.eventCenterpoint}
              onChange={handleInputChange}
            />
            <InputField
              label="Site Name"
              name="siteName"
              value={formData.siteName}
              onChange={handleInputChange}
            />
            <InputField
              label="Event Name"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
            />
          </>
        )}

        {category === "Monitoring" && (
          <>
            <InputField
              label="Coordinates"
              name="coordinates"
              value={formData.coordinates}
              onChange={handleInputChange}
            />
            <InputField
              label="Event ID"
              name="eventId"
              value={formData.eventId}
              onChange={handleInputChange}
            />
          </>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            File Upload (CSV) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className={`w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>
      </form>
    </div>
  );
}
