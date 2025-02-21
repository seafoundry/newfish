"use client";

import { useEffect, useState } from "react";
import { getOutplantingSignedURLs } from "../actions/getOutplantingSignedURLs";
import { FileData, FileStatus } from "../types/files";

interface FileBrowserProps {
  files: FileData[];
}

const getStatusStyle = (status: FileStatus) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    DELETED: "bg-gray-100 text-gray-800",
  };
  return styles[status] || styles.PENDING;
};

export default function FileBrowser({ files }: FileBrowserProps) {
  const [signedUrls, setSignedUrls] = useState<
    { fileId: string; url: string; name: string }[]
  >([]);
  const [filteredFiles, setFilteredFiles] = useState(files);

  useEffect(() => {
    const loadUrls = async () => {
      try {
        const urls = await getOutplantingSignedURLs();
        setSignedUrls(urls);
      } catch (error) {
        console.error("Failed to load signed URLs:", error);
      }
    };
    loadUrls();
  }, []);

  useEffect(() => {
    setFilteredFiles(files);
  }, [files]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
      {filteredFiles.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No files found</div>
      ) : (
        <div className="grid gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{file.fileName}</h3>
                  <p className="text-sm text-gray-500">
                    Category: {file.category} | Uploaded: {file.uploadDate}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                      file.status as FileStatus
                    )}`}
                  >
                    {file.status.toLowerCase()}
                  </span>
                  {signedUrls.find((url) => url.fileId === file.id) && (
                    <a
                      href={
                        signedUrls.find((url) => url.fileId === file.id)?.url
                      }
                      download
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
