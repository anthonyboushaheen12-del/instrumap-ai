import { X } from 'lucide-react';

export default function ErrorMessage({ error, onClose }) {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border-l-4 border-red-500 p-4 shadow-lg rounded-lg z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            {error.title || 'Error'}
          </h3>
          <p className="text-red-700 text-sm mb-3">
            {error.message}
          </p>

          {import.meta.env.DEV && error.technicalDetails && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">
                Technical Details
              </summary>
              <pre className="text-xs text-red-600 mt-1 p-2 bg-red-100 rounded overflow-x-auto">
                {error.technicalDetails}
              </pre>
            </details>
          )}
        </div>

        <button
          onClick={onClose}
          className="ml-4 text-red-500 hover:text-red-700"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
