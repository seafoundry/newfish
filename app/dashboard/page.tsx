import { getUserFiles } from "../actions/getUserFiles";
import FileBrowser from "../components/FileBrowser";
import FileUploadForm from "../components/FileUploadForm";

export default async function Dashboard() {
  const files = await getUserFiles();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            {files.length > 0 ? (
              <FileBrowser files={files} />
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No files uploaded
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by uploading your first file.
                </p>
              </div>
            )}
          </div>
          <FileUploadForm />
        </div>
      </div>
    </div>
  );
}
