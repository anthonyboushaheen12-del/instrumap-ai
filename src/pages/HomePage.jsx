import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, X, Info,
  ChevronDown, ChevronUp, Loader2, Shield,
  Cpu, Zap, Eye, Check, FileImage,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';
import { analyzeDrawing, mockAnalyzeDrawing } from '../utils/analyzeDrawing';
import { saveAnalysisData } from '../utils/storage';
import { storeFiles } from '../utils/fileStore';
import { validateFiles } from '../utils/fileValidator';
import { createErrorNotification, logError } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';

// Template options
const TEMPLATE_OPTIONS = [
  { id: 'isa-5.1', name: 'ISA-5.1', description: 'International standard', recommended: true },
  { id: 'iec-62443', name: 'IEC 62443', description: 'Security standard', recommended: false },
  { id: 'generic', name: 'Generic', description: 'Standard ISA', recommended: false },
  { id: 'dar', name: 'DAR', description: 'Dar Al-Handasah', recommended: false },
  { id: 'custom', name: 'Custom', description: 'Your template', recommended: false }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [template, setTemplate] = useState('isa-5.1');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [analysisStep, setAnalysisStep] = useState('reading');
  const [showPidDetails, setShowPidDetails] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pidDetails, setPidDetails] = useState({
    projectName: '',
    drawingNumber: '',
    revision: '',
    area: '',
    equipmentList: '',
    notes: '',
    referenceFiles: []
  });
  const [analyzingRefIndex, setAnalyzingRefIndex] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pdfRendering, setPdfRendering] = useState(false);
  const [pdfPreviewSrc, setPdfPreviewSrc] = useState(null);
  const pdfDocRef = useRef(null);
  const pdfjsLibRef = useRef(null);
  // Cache: Map<string, Map<number, string>> — fileKey → (pageNum → dataURL)
  const pdfPageCacheRef = useRef(new Map());

  // Load PDF.js from CDN via dynamic import
  const loadPdfjs = useCallback(async () => {
    if (pdfjsLibRef.current) return pdfjsLibRef.current;

    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    pdfjsLibRef.current = pdfjs;
    return pdfjs;
  }, []);

  // Get a stable cache key for a file
  const getFileCacheKey = useCallback((file) => `${file.name}_${file.size}_${file.lastModified}`, []);

  // Render a single page to a dataURL string (off-screen), returns cached if available
  const renderPageToDataUrl = useCallback(async (pdf, pageNum, cacheKey) => {
    const fileCache = pdfPageCacheRef.current.get(cacheKey);
    if (fileCache?.has(pageNum)) return fileCache.get(pageNum);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.8 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (!pdfPageCacheRef.current.has(cacheKey)) {
      pdfPageCacheRef.current.set(cacheKey, new Map());
    }
    pdfPageCacheRef.current.get(cacheKey).set(pageNum, dataUrl);

    return dataUrl;
  }, []);

  // Load a PDF and render page 1 into cache (called eagerly on file add)
  const preloadPdf = useCallback(async (file) => {
    const cacheKey = getFileCacheKey(file);
    // Already cached page 1 — nothing to do
    if (pdfPageCacheRef.current.get(cacheKey)?.has(1)) return;

    try {
      const pdfjs = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      await renderPageToDataUrl(pdf, 1, cacheKey);
    } catch (err) {
      console.error('PDF preload error:', err);
    }
  }, [loadPdfjs, getFileCacheKey, renderPageToDataUrl]);

  // Load and display a PDF file for the selected file
  const loadPdfPreview = useCallback(async (file) => {
    const cacheKey = getFileCacheKey(file);

    // Show cached page 1 immediately if available
    const cached = pdfPageCacheRef.current.get(cacheKey)?.get(1);
    if (cached) {
      setPdfPreviewSrc(cached);
    } else {
      setPdfRendering(true);
      setPdfPreviewSrc(null);
    }

    try {
      const pdfjs = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      pdfDocRef.current = pdf;
      setPdfTotalPages(pdf.numPages);
      setPdfPageNum(1);

      if (!cached) {
        const dataUrl = await renderPageToDataUrl(pdf, 1, cacheKey);
        setPdfPreviewSrc(dataUrl);
        setPdfRendering(false);
      }
    } catch (err) {
      console.error('PDF preview error:', err);
      setPdfRendering(false);
    }
  }, [loadPdfjs, getFileCacheKey, renderPageToDataUrl]);

  // Handle page navigation
  const goToPdfPage = useCallback(async (newPage) => {
    if (!pdfDocRef.current || newPage < 1 || newPage > pdfTotalPages) return;

    const file = files[selectedFileIndex];
    if (!file) return;
    const cacheKey = getFileCacheKey(file);

    // Show cached immediately if available
    const cached = pdfPageCacheRef.current.get(cacheKey)?.get(newPage);
    if (cached) {
      setPdfPageNum(newPage);
      setPdfPreviewSrc(cached);
      return;
    }

    setPdfPageNum(newPage);
    setPdfRendering(true);
    const dataUrl = await renderPageToDataUrl(pdfDocRef.current, newPage, cacheKey);
    setPdfPreviewSrc(dataUrl);
    setPdfRendering(false);
  }, [pdfTotalPages, files, selectedFileIndex, getFileCacheKey, renderPageToDataUrl]);

  // When selected file changes, update preview
  useEffect(() => {
    const file = files[selectedFileIndex];
    if (!file) {
      setPreviewUrl(null);
      pdfDocRef.current = null;
      setPdfTotalPages(0);
      setPdfPreviewSrc(null);
      return;
    }

    if (file.type === 'application/pdf') {
      setPreviewUrl(null);
      loadPdfPreview(file);
    } else if (file.type.startsWith('image/')) {
      pdfDocRef.current = null;
      setPdfTotalPages(0);
      setPdfPreviewSrc(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFileIndex, files]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
    }
  };

  const handleFileSelect = (selectedFiles) => {
    const validation = validateFiles(selectedFiles);

    if (validation.errors.length > 0) {
      setError({
        title: 'Invalid Files',
        message: validation.errors.join('\n'),
        technicalDetails: null
      });
    } else {
      setError(null);
    }

    if (validation.validFiles.length > 0) {
      // Preload page 1 of any PDFs in the background immediately
      validation.validFiles.forEach(f => {
        if (f.type === 'application/pdf') preloadPdf(f);
      });

      setFiles(prevFiles => {
        const newFiles = [...prevFiles, ...validation.validFiles];
        setSelectedFileIndex(prevFiles.length);
        return newFiles;
      });
    }
  };

  const removeFile = (index) => {
    // Clean up cache for removed file
    const removedFile = files[index];
    if (removedFile) {
      pdfPageCacheRef.current.delete(getFileCacheKey(removedFile));
    }

    setFiles(prevFiles => {
      const newFiles = prevFiles.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setSelectedFileIndex(0);
        setPreviewUrl(null);
        setPdfPreviewSrc(null);
        pdfDocRef.current = null;
        setPdfTotalPages(0);
      } else if (selectedFileIndex >= newFiles.length) {
        setSelectedFileIndex(newFiles.length - 1);
      } else if (index < selectedFileIndex) {
        setSelectedFileIndex(prev => prev - 1);
      }
      return newFiles;
    });
    setError(null);
  };

  const handlePidDetailChange = (field, value) => {
    setPidDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleReferenceFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      const isPdf = file.type === 'application/pdf';
      const isDwg = file.name.toLowerCase().endsWith('.dwg');
      if (!isPdf && !isDwg) {
        setError({ title: 'Invalid File Type', message: `${file.name}: Only PDF and DWG files are allowed` });
        return;
      }
      const fileRef = {
        name: file.name,
        size: file.size,
        type: file.type || (isDwg ? 'application/dwg' : 'unknown'),
        file: file
      };
      setPidDetails(prev => ({
        ...prev,
        referenceFiles: [...prev.referenceFiles, fileRef]
      }));
    });
    e.target.value = '';
  };

  const removeReferenceFile = (index) => {
    setPidDetails(prev => ({
      ...prev,
      referenceFiles: prev.referenceFiles.filter((_, i) => i !== index)
    }));
  };

  const analyzeReferenceFile = async (index) => {
    const refFile = pidDetails.referenceFiles[index];
    if (!refFile || !refFile.file) {
      setError({ title: 'Analysis Error', message: 'Cannot analyze this file.' });
      return;
    }
    setAnalyzingRefIndex(index);
    setError(null);
    try {
      const useMock = import.meta.env.VITE_USE_MOCK === 'true';
      const instruments = useMock
        ? await mockAnalyzeDrawing(refFile.file, template)
        : await analyzeDrawing(refFile.file, template);
      setPidDetails(prev => ({
        ...prev,
        referenceFiles: prev.referenceFiles.map((file, i) => {
          if (i === index) {
            return { ...file, analyzed: true, analyzedData: instruments, analyzedAt: new Date().toISOString() };
          }
          return file;
        })
      }));
    } catch (err) {
      logError(err, { context: 'reference-analysis', fileName: refFile.name });
      setError(createErrorNotification(err, 'analysis'));
    } finally {
      setAnalyzingRefIndex(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (files.length === 0) {
      setError({ title: 'No Files', message: 'Please select at least one file.' });
      return;
    }

    // Re-validate all files before analysis
    const validation = validateFiles(files);
    if (!validation.valid) {
      setError({ title: 'Invalid Files', message: 'No valid files to analyze:\n' + validation.errors.join('\n') });
      return;
    }

    setAnalyzing(true);
    setAnalysisStep('reading');
    setError(null);
    setAnalysisProgress({ current: 0, total: files.length });

    try {
      const useMock = import.meta.env.VITE_USE_MOCK === 'true';
      const allInstruments = [];
      const fileResults = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAnalysisProgress({ current: i + 1, total: files.length });
        try {
          const instruments = useMock
            ? await mockAnalyzeDrawing(file, template)
            : await analyzeDrawing(file, template, setAnalysisStep);
          if (instruments && instruments.length > 0) {
            const instrumentsWithSource = instruments.map(inst => ({ ...inst, source: file.name }));
            allInstruments.push(...instrumentsWithSource);
            fileResults.push({ filename: file.name, count: instruments.length, success: true });
          } else {
            fileResults.push({ filename: file.name, count: 0, success: false, error: 'No instruments detected' });
          }
        } catch (err) {
          fileResults.push({ filename: file.name, count: 0, success: false, error: err.message });
        }
      }

      // Deduplicate instruments based on tag + signalType + description
      const seen = new Map();
      const deduplicatedInstruments = [];
      
      for (const inst of allInstruments) {
        const key = `${inst.tag}|${inst.signalType}|${inst.description.toUpperCase()}`;
        if (!seen.has(key)) {
          seen.set(key, true);
          deduplicatedInstruments.push(inst);
        } else {
          // Update source to show it was found in multiple files
          const existing = deduplicatedInstruments.find(i => 
            `${i.tag}|${i.signalType}|${i.description.toUpperCase()}` === key
          );
          if (existing && existing.source !== inst.source) {
            existing.source = `${existing.source}, ${inst.source}`;
          }
        }
      }
      
      allInstruments.length = 0;
      allInstruments.push(...deduplicatedInstruments);

      if (allInstruments.length === 0) {
        const failedFiles = fileResults.filter(f => !f.success);
        const errorDetails = failedFiles.map(f => `${f.filename}: ${f.error}`).join('; ');
        throw new Error(`No instruments detected. ${errorDetails || 'Check console for details.'}`);
      }

      const analysisData = {
        filename: files.length === 1 ? files[0].name : `${files.length} files`,
        multipleFiles: files.length > 1,
        fileResults,
        instruments: allInstruments,
        template,
        timestamp: new Date().toISOString(),
        pidDetails,
      };
      saveAnalysisData(analysisData);
      storeFiles(files);
      navigate('/results', { state: analysisData });
    } catch (err) {
      logError(err, { context: 'analysis', fileCount: files.length, template });
      setError(createErrorNotification(err, 'analysis'));
    } finally {
      setAnalyzing(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden">
      <Header />
      {analyzing && <LoadingOverlay step={analysisStep} />}
      <ErrorMessage error={typeof error === 'object' ? error : null} onClose={() => setError(null)} />

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 pt-16 flex overflow-hidden">
        {/* Left Column - File Preview (60%) */}
        <div className="w-[60%] h-full p-4 flex flex-col">
          <div
            className={`flex-1 relative rounded border-2 border-dashed transition-all ${
              dragActive
                ? 'border-[#22c55e] bg-[#22c55e]/5'
                : files.length > 0
                ? 'border-[#22c55e]/50 bg-[#161b22]'
                : 'border-[#30363d] bg-[#161b22] hover:border-[#22c55e]/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>

            {/* HUD Corners */}
            <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-[#22c55e]/40"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-[#22c55e]/40"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-[#22c55e]/40"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-[#22c55e]/40"></div>

            {/* Scanning Line */}
            {files.length === 0 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#22c55e]/60 to-transparent animate-[scan_3s_linear_infinite]"></div>
            )}

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={handleFileInput}
              multiple
            />

            {files.length === 0 ? (
              /* Empty State */
              <label
                htmlFor="file-upload"
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-2 border-[#22c55e]/30 rotate-45 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-[#22c55e] -rotate-45" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">DROP P&ID FILES HERE</h3>
                <p className="text-[#7d8590] text-sm mb-4 font-mono">
                  or <span className="text-[#22c55e]">click to browse</span>
                </p>
                <div className="flex gap-2">
                  {['PDF', 'PNG', 'JPG'].map(f => (
                    <span key={f} className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-[10px] font-mono text-[#7d8590]">
                      {f}
                    </span>
                  ))}
                </div>
              </label>
            ) : (
              /* File Preview */
              <div className="absolute inset-0 p-4 flex flex-col">
                {/* File List Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></span>
                    <span className="text-xs font-mono text-[#22c55e]">{files.length} FILE{files.length > 1 ? 'S' : ''} LOADED</span>
                  </div>
                  <div className="flex gap-2">
                    <label
                      htmlFor="file-upload"
                      className="px-2 py-1 text-xs font-mono text-[#7d8590] hover:text-[#22c55e] cursor-pointer"
                    >
                      + ADD
                    </label>
                    <button
                      onClick={() => { setFiles([]); setPreviewUrl(null); setPdfPreviewSrc(null); setSelectedFileIndex(0); pdfDocRef.current = null; setPdfTotalPages(0); pdfPageCacheRef.current.clear(); }}
                      className="px-2 py-1 text-xs font-mono text-red-400 hover:text-red-300"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 flex gap-3 min-h-0">
                  {/* Thumbnail List */}
                  <div className="w-24 flex-shrink-0 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className={`relative p-2 rounded border cursor-pointer transition-all ${
                          index === selectedFileIndex ? 'border-[#22c55e] bg-[#22c55e]/10' : 'border-[#30363d] bg-[#21262d] hover:border-[#7d8590]'
                        }`}
                        onClick={() => setSelectedFileIndex(index)}
                      >
                        <div className="aspect-square bg-[#0d1117] rounded flex items-center justify-center mb-1">
                          {file.type.startsWith('image/') ? (
                            <FileImage className="w-6 h-6 text-[#7d8590]" />
                          ) : (
                            <FileText className="w-6 h-6 text-[#7d8590]" />
                          )}
                        </div>
                        <p className="text-[8px] font-mono text-[#7d8590] truncate">{file.name}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2 h-2 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Main Preview */}
                  <div className="flex-1 bg-[#0d1117] rounded border border-[#30363d] flex flex-col overflow-hidden">
                    {/* Preview Content */}
                    <div className="flex-1 flex items-center justify-center overflow-auto relative">
                      {pdfRendering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 z-10">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
                            <span className="text-xs font-mono text-[#7d8590]">Rendering...</span>
                          </div>
                        </div>
                      )}

                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : pdfPreviewSrc ? (
                        <img src={pdfPreviewSrc} alt="PDF Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-center p-8">
                          <Eye className="w-12 h-12 text-[#30363d] mx-auto mb-3" />
                          <p className="text-[#7d8590] text-sm">Select a file to preview</p>
                        </div>
                      )}
                    </div>

                    {/* PDF Page Navigation */}
                    {pdfTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 py-2 px-3 border-t border-[#30363d] bg-[#161b22]">
                        <button
                          onClick={() => goToPdfPage(pdfPageNum - 1)}
                          disabled={pdfPageNum <= 1 || pdfRendering}
                          className="p-1 rounded hover:bg-[#21262d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-[#c9d1d9]" />
                        </button>
                        <span className="text-xs font-mono text-[#7d8590]">
                          Page <span className="text-[#c9d1d9]">{pdfPageNum}</span> / {pdfTotalPages}
                        </span>
                        <button
                          onClick={() => goToPdfPage(pdfPageNum + 1)}
                          disabled={pdfPageNum >= pdfTotalPages || pdfRendering}
                          className="p-1 rounded hover:bg-[#21262d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-[#c9d1d9]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#7d8590]">
            <Shield className="w-3 h-3 text-[#22c55e]" />
            <span>Secure processing: Files deleted after analysis</span>
          </div>
        </div>

        {/* Right Column - Configuration Sidebar (40%) */}
        <div className="w-[40%] h-full border-l border-[#30363d] flex flex-col bg-[#161b22]">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#30363d]">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-[#22c55e]" />
              <span className="font-semibold text-white text-sm">Configuration</span>
            </div>
            <p className="text-[10px] text-[#7d8590] font-mono">SELECT TEMPLATE & CONFIGURE</p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Template Selection - Compact Grid */}
            <div>
              <label className="block text-xs font-mono text-[#7d8590] mb-2 uppercase">Template Standard</label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-2 rounded border text-left transition-all ${
                      template === t.id
                        ? 'border-[#22c55e] bg-[#22c55e]/10'
                        : 'border-[#30363d] bg-[#21262d] hover:border-[#7d8590]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#c9d1d9]">{t.name}</span>
                      {t.recommended && <span className="text-[8px] text-[#22c55e]">REC</span>}
                    </div>
                    <p className="text-[9px] text-[#7d8590] truncate">{t.description}</p>
                    {template === t.id && (
                      <Check className="w-3 h-3 text-[#22c55e] absolute top-1 right-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* P&ID Details Accordion */}
            <div className="border border-[#30363d] rounded bg-[#21262d]">
              <button
                onClick={() => setShowPidDetails(!showPidDetails)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-sm font-medium text-white">P&ID Details</span>
                  <span className="text-[9px] text-[#7d8590]">(Optional)</span>
                </div>
                {showPidDetails ? (
                  <ChevronUp className="w-4 h-4 text-[#7d8590]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#7d8590]" />
                )}
              </button>

              {showPidDetails && (
                <div className="px-3 pb-3 space-y-3 border-t border-[#30363d]">
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <div>
                      <label className="block text-[9px] font-mono text-[#7d8590] mb-1">PROJECT</label>
                      <input
                        type="text"
                        value={pidDetails.projectName}
                        onChange={(e) => handlePidDetailChange('projectName', e.target.value)}
                        placeholder="Project name"
                        className="w-full px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#484f58] focus:border-[#22c55e] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#7d8590] mb-1">DWG NUMBER</label>
                      <input
                        type="text"
                        value={pidDetails.drawingNumber}
                        onChange={(e) => handlePidDetailChange('drawingNumber', e.target.value)}
                        placeholder="DW-001"
                        className="w-full px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#484f58] focus:border-[#22c55e] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#7d8590] mb-1">REVISION</label>
                      <input
                        type="text"
                        value={pidDetails.revision}
                        onChange={(e) => handlePidDetailChange('revision', e.target.value)}
                        placeholder="Rev A"
                        className="w-full px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#484f58] focus:border-[#22c55e] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#7d8590] mb-1">AREA</label>
                      <input
                        type="text"
                        value={pidDetails.area}
                        onChange={(e) => handlePidDetailChange('area', e.target.value)}
                        placeholder="Unit 100"
                        className="w-full px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#484f58] focus:border-[#22c55e] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-[#7d8590] mb-1">EQUIPMENT</label>
                    <textarea
                      value={pidDetails.equipmentList}
                      onChange={(e) => handlePidDetailChange('equipmentList', e.target.value)}
                      placeholder="One per line..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#484f58] focus:border-[#22c55e] focus:outline-none font-mono resize-none"
                    />
                  </div>

                  {/* Reference Files */}
                  <div className="pt-2 border-t border-[#30363d]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-mono text-[#7d8590]">REFERENCE FILES</label>
                      <label
                        htmlFor="reference-file-upload"
                        className="text-[9px] text-[#22c55e] cursor-pointer hover:underline"
                      >
                        + Add
                      </label>
                      <input
                        type="file"
                        id="reference-file-upload"
                        className="hidden"
                        accept=".pdf,.dwg"
                        onChange={handleReferenceFileUpload}
                        multiple
                      />
                    </div>
                    {pidDetails.referenceFiles.length > 0 && (
                      <div className="space-y-1">
                        {pidDetails.referenceFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-1.5 bg-[#0d1117] rounded text-[10px]">
                            <FileText className="w-3 h-3 text-[#7d8590]" />
                            <span className="flex-1 truncate text-[#c9d1d9]">{file.name}</span>
                            {!file.analyzed ? (
                              <button
                                onClick={() => analyzeReferenceFile(index)}
                                disabled={analyzingRefIndex !== null}
                                className="px-1.5 py-0.5 bg-[#22c55e] text-white rounded text-[8px] font-mono"
                              >
                                {analyzingRefIndex === index ? '...' : 'SCAN'}
                              </button>
                            ) : (
                              <span className="text-[#22c55e]">✓</span>
                            )}
                            <button onClick={() => removeReferenceFile(index)} className="text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Display (inline fallback for string errors) */}
            {error && typeof error === 'string' && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Fixed Bottom - Analyze Button */}
          <div className="p-4 border-t border-[#30363d] bg-[#0d1117]">
            <button
              onClick={handleUploadAndAnalyze}
              disabled={files.length === 0 || analyzing}
              className={`w-full py-3 rounded font-semibold text-sm transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-wider ${
                files.length > 0 && !analyzing
                  ? 'bg-[#22c55e] text-white hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                  : 'bg-[#21262d] text-[#484f58] cursor-not-allowed border border-[#30363d]'
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PROCESSING {analysisProgress.current}/{analysisProgress.total}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {files.length > 0 ? `ANALYZE ${files.length} FILE${files.length > 1 ? 'S' : ''}` : 'SELECT FILES'}
                </>
              )}
            </button>

            {/* Status Indicators */}
            <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-[#7d8590]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${files.length > 0 ? 'bg-[#22c55e]' : 'bg-[#484f58]'}`}></span>
                  FILES
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                  TEMPLATE
                </span>
              </div>
              <span className="text-[#22c55e]">READY</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
