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
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
      <div className="grid gap-4">
        {files.map((file) => (
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
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                    file.status as FileStatus
                  )}`}
                >
                  {file.status.toLowerCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {file.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
