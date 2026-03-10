import { useState, useEffect, useMemo } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Eye, EyeOff } from 'lucide-react';
import { getStoredFiles } from '../utils/fileStore';

// pdfjs-dist 3.11.174 worker
const WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export default function PdfPanel({ collapsed, onToggle }) {
  const [fileUrl, setFileUrl] = useState(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      fullScreenPlugin: { onEnterFullScreen: () => {}, onExitFullScreen: () => {} },
    },
  });

  // Load the first PDF from stored files
  useEffect(() => {
    const files = getStoredFiles();
    const pdf = files.find(f => f.type === 'application/pdf');
    if (pdf) {
      const url = URL.createObjectURL(pdf);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    // Fallback: try image files
    const img = files.find(f => f.type.startsWith('image/'));
    if (img) {
      const url = URL.createObjectURL(img);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, []);

  const isImage = useMemo(() => {
    const files = getStoredFiles();
    const pdf = files.find(f => f.type === 'application/pdf');
    return !pdf && files.some(f => f.type.startsWith('image/'));
  }, []);

  return (
    <div
      className={`pdf-panel-container transition-all duration-300 ${
        collapsed ? 'pdf-panel-collapsed' : 'pdf-panel-expanded'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="pdf-panel-toggle"
        title={collapsed ? 'Show Drawing' : 'Hide Drawing'}
      >
        {collapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span className="font-mono text-xs">
          {collapsed ? 'SHOW DRAWING' : 'HIDE DRAWING'}
        </span>
      </button>

      {/* PDF Viewer */}
      {!collapsed && fileUrl && (
        <div className="pdf-panel-viewer">
          {isImage ? (
            <div className="flex items-center justify-center h-full overflow-auto bg-[#1a1a2e] p-4">
              <img src={fileUrl} alt="Drawing" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <Worker workerUrl={WORKER_URL}>
              <Viewer
                fileUrl={fileUrl}
                plugins={[defaultLayoutPluginInstance]}
                theme="dark"
              />
            </Worker>
          )}
        </div>
      )}

      {!collapsed && !fileUrl && (
        <div className="pdf-panel-viewer flex items-center justify-center">
          <div className="text-center">
            <Eye className="w-10 h-10 text-[#30363d] mx-auto mb-2" />
            <p className="text-[#7d8590] text-sm font-mono">No drawing available</p>
          </div>
        </div>
      )}
    </div>
  );
}
