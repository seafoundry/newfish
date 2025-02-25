"use client";

import { getFileSignedUrls } from "@/app/actions/getFileSignedUrls";
import { getSignedUrl } from "@/app/actions/getSignedUrl";
import { getOutplantingEvents } from "@/app/actions/getOutplantingEvents";
import { getOutplantingSignedURLs } from "@/app/actions/getOutplantingSignedURLs";
import { formatDistanceToNow } from "date-fns";
import { FileCategory, FileData } from "@/app/types/files";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useCallback, useEffect, useState } from "react";

const categories: FileCategory[] = [
  "Genetics",
  "Nursery",
  "Outplanting",
  "Monitoring",
];

const requiredColumns = {
  Genetics: ["Local ID/Genet Propagation"],
  Nursery: ["Local ID", "Quantity", "Nursery"],
  Outplanting: ["Local ID", "Quantity", "Tag"],
  Monitoring: ["Qty Survived"],
};

const validateFileColumns = (
  file: File,
  category: FileCategory
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
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

const templateHeaders = {
  Genetics: ["Local ID/Genet Propogation", "AccessionNumber"],
  Nursery: ["Local ID", "Quantity", "Nursery"],
  Outplanting: ["Local ID", "Quantity", "Tag"],
  Monitoring: ["Local ID", "Qty Survived", "Notes"],
};

const downloadTemplate = (category: FileCategory) => {
  const headers = templateHeaders[category];
  const csvContent = headers.join(",") + "\n";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${category.toLowerCase()}_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  mappingFile?: File | null;
}

type SignedURL = {
  fileId: string;
  name: string;
  url: string;
};

type OutplantingEvent = {
  id: string;
  outplantingFileId: string | null;
  createdAt: Date;
  status: string;
  metadata: {
    reefName: string;
    siteName: string;
    eventName: string;
  };
};

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

interface FileUploadFormProps {
  files: FileData[];
}

export default function FileUploadForm({ files }: FileUploadFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<FileCategory>("Monitoring");
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
    mappingFile: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<SignedURL[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [outplantingEvents, setOutplantingEvents] = useState<
    OutplantingEvent[]
  >([]);

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
        const inputName = e.target.name;
        if (inputName === "mappingFile") {
          setFormData((prev) => ({ ...prev, mappingFile: file }));
          setUploadError(null);
          return;
        }

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
        if (e.target.name === "mappingFile") {
          setFormData((prev) => ({ ...prev, mappingFile: null }));
        } else {
          setFormData((prev) => ({ ...prev, file: null }));
        }
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

      if (category === "Genetics" && formData.mappingFile) {
        const mappingSignedUrl = await getSignedUrl(
          formData.mappingFile.name,
          formData.mappingFile.type,
          "GeneticsMapping",
          metadata
        );

        await fetch(mappingSignedUrl, {
          method: "PUT",
          body: formData.mappingFile,
          headers: {
            "Content-Type": formData.mappingFile.type,
          },
        });
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
        mappingFile: null,
      });
      setCategory("Monitoring");

      const newUrls = await getFileSignedUrls();
      setSignedUrls((prevUrls) => {
        const outplantingUrls = prevUrls.filter(
          (url) =>
            url.fileId.startsWith("outplanting") ||
            !newUrls.some((newUrl) => newUrl.fileId === url.fileId)
        );
        return [...outplantingUrls, ...newUrls];
      });

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

  useEffect(() => {
    setIsLoadingFiles(true);
    Promise.all([
      getFileSignedUrls(),
      category === "Monitoring" ? getOutplantingEvents() : Promise.resolve([]),
      category === "Monitoring"
        ? getOutplantingSignedURLs()
        : Promise.resolve([]),
    ])
      .then(([fileUrls, events, outplantingUrls]) => {
        setSignedUrls([...fileUrls, ...outplantingUrls]);
        if (category === "Monitoring") {
          setOutplantingEvents(events);
        }
      })
      .catch((error) => {
        console.error("Failed to load files:", error);
        setUploadError("Failed to load files");
      })
      .finally(() => {
        setIsLoadingFiles(false);
      });
  }, [files, category]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Upload New File</h2>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {uploadError}
        </div>
      )}

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Recent {category} Files
        </h3>
        {isLoadingFiles ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-2">
            {files?.filter((f: FileData) => f.category === category).length >
            0 ? (
              files
                ?.filter((f: FileData) => f.category === category)
                .sort(
                  (a, b) =>
                    new Date(b.uploadDate).getTime() -
                    new Date(a.uploadDate).getTime()
                )
                .slice(0, 5)
                .map((file: FileData) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-white p-2 rounded-md"
                  >
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {file.fileName}
                    </span>
                    {signedUrls.find((url) => url.fileId === file.id) && (
                      <a
                        href={
                          signedUrls.find((url) => url.fileId === file.id)?.url
                        }
                        download={file.fileName}
                        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-500 text-center p-2">
                No {category.toLowerCase()} files available
              </p>
            )}
          </div>
        )}
      </div>

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
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => downloadTemplate(category)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            Download Sample CSV
          </button>
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
            {outplantingEvents.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Event ID <span className="text-red-500">*</span>
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setFormData((prev) => ({
                      ...prev,
                      eventId: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an outplanting event</option>
                  {outplantingEvents.map((event) => (
                    <option
                      key={event.id}
                      value={event.outplantingFileId || ""}
                      className="py-2"
                    >
                      {event.metadata.eventName} - {event.metadata.reefName} (
                      {formatDistanceToNow(new Date(event.createdAt), {
                        addSuffix: true,
                      })}
                      ){event.status !== "completed" && ` - ${event.status}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 font-medium text-center">
                  🌊 Looks like we need some coral history! Please upload an
                  outplanting event first to start monitoring.
                </p>
              </div>
            )}
            <div className="mt-4">
              {isLoadingFiles ? (
                <div className="p-4 bg-gray-50 rounded-md text-center">
                  <p className="text-gray-600">Loading available files...</p>
                </div>
              ) : formData.eventId ? (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Event File:
                  </h4>
                  {signedUrls
                    .filter((url) => url.fileId === formData.eventId)
                    .map((file) => (
                      <div
                        key={file.fileId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{file.name}</span>
                        <a
                          href={file.url}
                          download
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          Download Original File
                        </a>
                      </div>
                    ))}
                  <p className="mt-3 text-xs text-gray-500 italic">
                    This is the original outplanting file you can reference for
                    monitoring
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-600 text-center">
                    Select an outplanting event to view its file
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            File Upload (CSV) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="mainFile"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {category === "Genetics" && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Mapping File (Optional)
            </label>
            <input
              type="file"
              name="mappingFile"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              CSV format: 2 columns - First column: Your genotype names, Second
              column: Other organization&apos;s corresponding genotype names
            </p>
          </div>
        )}

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
