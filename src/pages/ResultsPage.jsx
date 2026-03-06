import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Download, Plus, Trash2, FileText, Info,
  ChevronDown, ChevronUp, Paperclip, Terminal, Database,
  Cpu, Activity, Zap, Server, HardDrive, Upload, AlertTriangle, Check
} from 'lucide-react';
import Header from '../components/Header';
import SuccessToast from '../components/SuccessToast';
import { exportToExcelWithSummary, calculateSummary } from '../utils/exportToExcel';
import { getAnalysisData, clearAnalysisData } from '../utils/storage';
import { analyzeDrawing, mockAnalyzeDrawing } from '../utils/analyzeDrawing';
import { validateFiles } from '../utils/fileValidator';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [newTag, setNewTag] = useState('');
  const [newSignalType, setNewSignalType] = useState('AI');
  const [newDescription, setNewDescription] = useState('');
  const [showPidDetails, setShowPidDetails] = useState(false);

  // Multi-PDF accumulation state
  const [analyzedFiles, setAnalyzedFiles] = useState([]);
  const [addingFile, setAddingFile] = useState(false);
  const [addFileProgress, setAddFileProgress] = useState('');

  useEffect(() => {
    let analysisData = location.state;
    if (!analysisData) {
      analysisData = getAnalysisData();
    }
    if (!analysisData || !analysisData.instruments) {
      navigate('/');
      return;
    }
    setData(analysisData);

    // Tag each instrument with its source file
    const sourceName = analysisData.filename || 'Unknown';
    const taggedInstruments = analysisData.instruments.map(inst => ({
      ...inst,
      sourceFile: inst.sourceFile || inst.source || sourceName,
    }));
    setInstruments(taggedInstruments);

    // Build initial file tracker
    const initialFiles = [];
    if (analysisData.fileResults) {
      analysisData.fileResults.forEach(r => {
        initialFiles.push({
          name: r.filename,
          count: r.count,
          success: r.success,
        });
      });
    } else {
      initialFiles.push({
        name: sourceName,
        count: taggedInstruments.length,
        success: true,
      });
    }
    setAnalyzedFiles(initialFiles);

    clearAnalysisData();
  }, [location.state, navigate]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleStartFresh = () => {
    navigate('/');
  };

  const handleExport = () => {
    try {
      const summary = calculateSummary(instruments);
      const filename = exportToExcelWithSummary(instruments, data.filename, summary, data.pidDetails);
      setSuccessMessage(`EXPORT COMPLETE: ${filename}`);
      setShowSuccess(true);
    } catch (error) {
      console.error('Export error:', error);
      alert(`EXPORT FAILED: ${error.message}`);
    }
  };

  const handleCellEdit = (index, field, value) => {
    const updated = [...instruments];
    updated[index][field] = value;
    setInstruments(updated);
  };

  const handleDeleteRow = (index) => {
    if (window.confirm('CONFIRM: Delete this tag from the database?')) {
      const updated = instruments.filter((_, i) => i !== index);
      setInstruments(updated);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) {
      alert('ERROR: Tag identifier required');
      return;
    }
    const newInstrument = {
      tag: newTag.trim(),
      signalType: newSignalType,
      description: newDescription.trim() || 'No description',
      sourceFile: 'Manual Entry',
      location: '',
      equipment: '',
      equipmentId: '',
      isAlarm: false,
    };
    setInstruments([...instruments, newInstrument]);
    setNewTag('');
    setNewSignalType('AI');
    setNewDescription('');
  };

  // Add Another P&ID handler
  const handleAddAnotherPdf = () => {
    fileInputRef.current?.click();
  };

  const handleNewFileSelected = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    e.target.value = '';

    const validation = validateFiles(selectedFiles);
    if (validation.validFiles.length === 0) {
      alert('No valid files selected.');
      return;
    }

    setAddingFile(true);

    for (const file of validation.validFiles) {
      setAddFileProgress(`Analyzing ${file.name}...`);
      try {
        const newInstruments = await analyzeDrawing(file, data?.template || 'isa-5.1');

        // Tag with source file
        const tagged = newInstruments.map(inst => ({
          ...inst,
          sourceFile: file.name,
        }));

        // Append to instruments
        setInstruments(prev => [...prev, ...tagged]);

        // Update file tracker
        setAnalyzedFiles(prev => [...prev, {
          name: file.name,
          count: tagged.length,
          success: true,
        }]);

        setSuccessMessage(`Added ${tagged.length} instruments from ${file.name}`);
        setShowSuccess(true);
      } catch (err) {
        console.error('Add file error:', err);
        setAnalyzedFiles(prev => [...prev, {
          name: file.name,
          count: 0,
          success: false,
        }]);
        alert(`Failed to analyze ${file.name}: ${err.message}`);
      }
    }

    setAddingFile(false);
    setAddFileProgress('');
  };

  // Check for duplicate tags
  const getDuplicateTags = () => {
    const tagCounts = {};
    instruments.forEach(inst => {
      const key = `${inst.tag}|${inst.signalType}`;
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    });
    return tagCounts;
  };

  const getSignalBadgeClass = (type) => {
    const classes = {
      AI: 'signal-badge ai',
      DI: 'signal-badge di',
      DO: 'signal-badge do',
      AO: 'signal-badge ao',
      COM: 'signal-badge com',
    };
    return classes[type] || 'signal-badge';
  };

  if (!data) {
    return null;
  }

  const summary = calculateSummary(instruments);
  const duplicateTags = getDuplicateTags();
  const totalFiles = analyzedFiles.length;

  return (
    <div className="terminal-container min-h-screen flex flex-col">
      <Header />

      {showSuccess && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {/* Hidden file input for adding more PDFs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        onChange={handleNewFileSelected}
        multiple
      />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Top Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackToHome}
              className="hardware-switch secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="pl-4">RETURN</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="status-online">SYSTEM ONLINE</span>
              <button
                onClick={handleExport}
                className="hardware-switch"
              >
                <Download className="w-4 h-4 ml-4" />
                <span>EXPORT TO EXCEL</span>
              </button>
            </div>
          </div>

          {/* File Tracker Banner */}
          <div className="hud-card p-4 mb-6">
            <div className="hud-card-corners"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="terminal-header">
                  <Database className="w-4 h-4" />
                  <span>Showing {instruments.length} instruments from {totalFiles} file{totalFiles !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddAnotherPdf}
                    disabled={addingFile}
                    className="hardware-switch text-xs"
                  >
                    {addingFile ? (
                      <>
                        <Cpu className="w-3 h-3 ml-2 animate-spin" />
                        <span className="text-xs">{addFileProgress || 'PROCESSING...'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 ml-2" />
                        <span className="text-xs">ADD ANOTHER P&ID</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStartFresh}
                    className="hardware-switch secondary text-xs"
                  >
                    <Trash2 className="w-3 h-3 ml-2" />
                    <span className="text-xs">START FRESH</span>
                  </button>
                </div>
              </div>

              {/* File list */}
              <div className="space-y-1">
                {analyzedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 font-mono text-xs border ${
                      file.success
                        ? 'bg-[#22c55e]/5 border-[#22c55e]/20 text-[#22c55e]'
                        : 'bg-[#f85149]/5 border-[#f85149]/20 text-[#f85149]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {file.success ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {file.name}
                    </span>
                    <span className="text-[10px]">
                      {file.success ? `${file.count} instruments` : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* File Analysis Header */}
          <div className="hud-card p-6 mb-6">
            <div className="hud-card-corners"></div>
            <div className="relative z-10">
              <div className="terminal-header mb-4">
                <Terminal className="w-4 h-4" />
                <span>ANALYSIS COMPLETE</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider">
                    {totalFiles > 1 ? 'FILES ANALYZED' : 'SOURCE FILE'}
                  </p>
                  <p className="text-lg font-mono font-semibold text-[#22c55e]">
                    {totalFiles > 1 ? `${totalFiles} files` : data.filename}
                  </p>
                </div>
              </div>

              <p className="text-sm font-mono text-[#7d8590]">
                &gt; Click any cell to modify. Use form below to add missing entries.
              </p>

              {/* P&ID Details Accordion */}
              {data.pidDetails && (data.pidDetails.projectName || data.pidDetails.drawingNumber || data.pidDetails.equipmentList || (data.pidDetails.referenceFiles && data.pidDetails.referenceFiles.length > 0)) && (
                <div className="mt-4 pt-4 border-t border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setShowPidDetails(!showPidDetails)}
                    className="w-full flex items-center justify-between text-left py-2"
                  >
                    <div className="flex items-center gap-2 text-[#22c55e] font-mono text-sm">
                      <Database className="w-4 h-4" />
                      <span>P&ID METADATA</span>
                    </div>
                    {showPidDetails ? (
                      <ChevronUp className="w-4 h-4 text-[#7d8590]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#7d8590]" />
                    )}
                  </button>

                  {showPidDetails && (
                    <div className="mt-3 p-4 bg-[#0d1117] border border-[#30363d] space-y-3 font-mono text-sm">
                      {data.pidDetails.projectName && (
                        <div>
                          <span className="text-[10px] text-[#7d8590] uppercase">PROJECT:</span>
                          <p className="text-[#c9d1d9]">{data.pidDetails.projectName}</p>
                        </div>
                      )}
                      {data.pidDetails.drawingNumber && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-[#7d8590] uppercase">DWG NUMBER:</span>
                            <p className="text-[#c9d1d9]">{data.pidDetails.drawingNumber}</p>
                          </div>
                          {data.pidDetails.revision && (
                            <div>
                              <span className="text-[10px] text-[#7d8590] uppercase">REVISION:</span>
                              <p className="text-[#c9d1d9]">{data.pidDetails.revision}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {data.pidDetails.area && (
                        <div>
                          <span className="text-[10px] text-[#7d8590] uppercase">AREA/UNIT:</span>
                          <p className="text-[#c9d1d9]">{data.pidDetails.area}</p>
                        </div>
                      )}
                      {data.pidDetails.equipmentList && (
                        <div>
                          <span className="text-[10px] text-[#7d8590] uppercase">EQUIPMENT:</span>
                          <pre className="text-[#22c55e] bg-[#161b22] p-2 mt-1 border border-[#30363d] whitespace-pre-wrap">
                            {data.pidDetails.equipmentList}
                          </pre>
                        </div>
                      )}
                      {data.pidDetails.referenceFiles && data.pidDetails.referenceFiles.length > 0 && (
                        <div className="pt-3 border-t border-[#30363d]">
                          <span className="text-[10px] text-[#7d8590] uppercase flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            REFERENCE FILES ({data.pidDetails.referenceFiles.length})
                          </span>
                          <div className="mt-2 space-y-1">
                            {data.pidDetails.referenceFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-[#161b22] border border-[#30363d]"
                              >
                                <HardDrive className="w-3 h-3 text-[#22c55e]" />
                                <span className="text-[#c9d1d9] truncate flex-1">{file.name}</span>
                                <span className="text-[10px] text-[#7d8590]">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Summary - HUD Stats */}
          <div className="hud-card p-6 mb-6">
            <div className="hud-card-corners"></div>
            <div className="relative z-10">
              <div className="terminal-header mb-4">
                <Activity className="w-4 h-4" />
                <span>ANALYSIS SUMMARY</span>
              </div>

              <div className="grid grid-cols-6 gap-4">
                <div className="hud-stat-card">
                  <p className="text-3xl font-mono font-bold text-[#22c55e]">{summary.total}</p>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">TOTAL TAGS</p>
                </div>
                <div className="hud-stat-card">
                  <p className="text-3xl font-mono font-bold text-[#3b82f6]">{summary.AI}</p>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">ANALOG IN</p>
                </div>
                <div className="hud-stat-card">
                  <p className="text-3xl font-mono font-bold text-[#22c55e]">{summary.DI}</p>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">DIGITAL IN</p>
                </div>
                <div className="hud-stat-card">
                  <p className="text-3xl font-mono font-bold text-[#f97316]">{summary.DO}</p>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">DIGITAL OUT</p>
                </div>
                <div className="hud-stat-card">
                  <p className="text-3xl font-mono font-bold text-[#a855f7]">{summary.AO}</p>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">ANALOG OUT</p>
                </div>
                <div className="hud-stat-card">
                  <p className="text-3xl font-mono font-bold text-[#eab308]">{summary.COM}</p>
                  <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">COMM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Tag Form */}
          <div className="hud-card p-6 mb-6">
            <div className="hud-card-corners"></div>
            <div className="relative z-10">
              <div className="terminal-header mb-4">
                <Plus className="w-4 h-4" />
                <span>ADD INSTRUMENT TAG</span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="TAG_ID (e.g., FIT-001)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="terminal-input"
                />
                <select
                  value={newSignalType}
                  onChange={(e) => setNewSignalType(e.target.value)}
                  className="terminal-select"
                >
                  <option value="AI">AI - ANALOG INPUT</option>
                  <option value="DI">DI - DIGITAL INPUT</option>
                  <option value="DO">DO - DIGITAL OUTPUT</option>
                  <option value="AO">AO - ANALOG OUTPUT</option>
                  <option value="COM">COM - COMMUNICATION</option>
                </select>
                <input
                  type="text"
                  placeholder="DESCRIPTION"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="terminal-input"
                />
                <button
                  onClick={handleAddTag}
                  className="hardware-switch"
                >
                  <Plus className="w-4 h-4 ml-4" />
                  <span>INSERT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tags Table */}
          <div className="hud-card overflow-hidden mb-6">
            <div className="hud-card-corners"></div>
            <div className="relative z-10">
              <div className="terminal-header">
                <Server className="w-4 h-4" />
                <span>INSTRUMENT DATABASE</span>
                <span className="ml-auto text-[10px] text-[#7d8590]">{instruments.length} RECORDS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>TAG ID</th>
                      <th style={{ width: '100px' }}>SIGNAL</th>
                      <th>DESCRIPTION</th>
                      <th style={{ width: '180px' }}>SOURCE FILE</th>
                      <th style={{ width: '80px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instruments.map((instrument, index) => {
                      const dupKey = `${instrument.tag}|${instrument.signalType}`;
                      const isDuplicate = duplicateTags[dupKey] > 1;

                      return (
                        <tr key={index}>
                          <td className="text-[#7d8590] font-mono">{String(index + 1).padStart(3, '0')}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              {editingCell === `${index}-tag` ? (
                                <input
                                  type="text"
                                  value={instrument.tag}
                                  onChange={(e) => handleCellEdit(index, 'tag', e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="terminal-input w-full"
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingCell(`${index}-tag`)}
                                  className="cursor-pointer hover:text-[#22c55e] font-mono font-semibold text-[#c9d1d9]"
                                >
                                  {instrument.tag}
                                </span>
                              )}
                              {isDuplicate && (
                                <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30 rounded whitespace-nowrap">
                                  DUP
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {editingCell === `${index}-signalType` ? (
                              <select
                                value={instrument.signalType}
                                onChange={(e) => handleCellEdit(index, 'signalType', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="terminal-select"
                              >
                                <option value="AI">AI</option>
                                <option value="DI">DI</option>
                                <option value="DO">DO</option>
                                <option value="AO">AO</option>
                                <option value="COM">COM</option>
                              </select>
                            ) : (
                              <span
                                onClick={() => setEditingCell(`${index}-signalType`)}
                                className={`cursor-pointer ${getSignalBadgeClass(instrument.signalType)}`}
                              >
                                {instrument.signalType}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingCell === `${index}-description` ? (
                              <input
                                type="text"
                                value={instrument.description}
                                onChange={(e) => handleCellEdit(index, 'description', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="terminal-input w-full"
                              />
                            ) : (
                              <span
                                onClick={() => setEditingCell(`${index}-description`)}
                                className="cursor-pointer hover:text-[#22c55e] text-[#7d8590]"
                              >
                                {instrument.description}
                              </span>
                            )}
                          </td>
                          <td className="text-[#7d8590] text-xs truncate max-w-[180px] font-mono" title={instrument.sourceFile}>
                            {instrument.sourceFile || '-'}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteRow(index)}
                              className="hardware-switch danger"
                              title="Delete tag"
                            >
                              <Trash2 className="w-3 h-3 ml-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToHome}
                className="hardware-switch secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="pl-4">RETURN TO TERMINAL</span>
              </button>
              <button
                onClick={handleAddAnotherPdf}
                disabled={addingFile}
                className="hardware-switch secondary"
              >
                <Upload className="w-4 h-4" />
                <span className="pl-2">ADD ANOTHER P&ID</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[#7d8590] uppercase">
                {instruments.length} INSTRUMENTS FROM {totalFiles} FILE{totalFiles !== 1 ? 'S' : ''}
              </span>
              <button
                onClick={handleExport}
                className="hardware-switch"
              >
                <Zap className="w-4 h-4 ml-4" />
                <span>EXPORT TO EXCEL</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-[#30363d] bg-[#0d1117] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 font-mono text-[10px] text-[#7d8590]">
            <span className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-[#22c55e]" />
              INSTRUMAP AI v1.0
            </span>
            <span>|</span>
            <span>TEMPLATE: {data.template?.toUpperCase() || 'ISA-5.1'}</span>
            <span>|</span>
            <span>PROCESSED: {new Date(data.timestamp).toLocaleString()}</span>
          </div>
          <span className="status-online">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </footer>
    </div>
  );
}
