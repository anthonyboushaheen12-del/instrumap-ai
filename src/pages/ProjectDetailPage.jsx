import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Plus, Trash2, FileText, Database,
  Cpu, Activity, Zap, Server, Loader2, Filter,
  Check, AlertTriangle, Clock, Upload
} from 'lucide-react';
import Header from '../components/Header';
import SuccessToast from '../components/SuccessToast';
import { exportToExcelWithSummary, calculateSummary } from '../utils/exportToExcel';
import { analyzeDrawing } from '../utils/analyzeDrawing';
import { validateFiles } from '../utils/fileValidator';
import {
  getProject, getProjectDrawings, getProjectIOPoints,
  saveResultsToProject, deleteDrawing
} from '../utils/projectService';

export default function ProjectDetailPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [project, setProject] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [ioPoints, setIOPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterDrawing, setFilterDrawing] = useState('all');
  const [filterSignalType, setFilterSignalType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');

  // Upload/analyze state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState('');

  // UI state
  const [selectedDrawingId, setSelectedDrawingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [proj, drawingList, points] = await Promise.all([
        getProject(projectId),
        getProjectDrawings(projectId),
        getProjectIOPoints(projectId),
      ]);
      setProject(proj);
      setDrawings(drawingList);
      setIOPoints(points);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Add P&ID ──────────────────────────────────────────────────────────────

  const handleAddPid = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    e.target.value = '';

    const validation = validateFiles(selectedFiles);
    if (validation.validFiles.length === 0) {
      setError('No valid files selected.');
      return;
    }

    setAnalyzing(true);

    for (const file of validation.validFiles) {
      setAnalyzeProgress(`Analyzing ${file.name}...`);
      try {
        const instruments = await analyzeDrawing(file, 'isa-5.1');
        const drawing = await saveResultsToProject(projectId, file.name, instruments);

        // Refresh data
        const [drawingList, points] = await Promise.all([
          getProjectDrawings(projectId),
          getProjectIOPoints(projectId),
        ]);
        setDrawings(drawingList);
        setIOPoints(points);

        setSuccessMessage(`Added ${instruments.length} instruments from ${file.name}`);
        setShowSuccess(true);
      } catch (err) {
        setError(`Failed to analyze ${file.name}: ${err.message}`);
      }
    }

    setAnalyzing(false);
    setAnalyzeProgress('');
  };

  // ─── Delete Drawing ────────────────────────────────────────────────────────

  const handleDeleteDrawing = async (drawingId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this drawing and all its I/O points?')) return;

    try {
      await deleteDrawing(drawingId);
      const [drawingList, points] = await Promise.all([
        getProjectDrawings(projectId),
        getProjectIOPoints(projectId),
      ]);
      setDrawings(drawingList);
      setIOPoints(points);
      if (selectedDrawingId === drawingId) setSelectedDrawingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const instruments = filteredPoints.map(p => ({
      tag: p.tag,
      signalType: p.signal_type,
      description: p.description,
      location: p.location,
      equipment: p.equipment,
      equipmentId: p.equipment_id,
      isAlarm: p.is_alarm,
      sourceFile: p.source_file,
    }));

    const summary = calculateSummary(instruments);
    const filename = exportToExcelWithSummary(
      instruments,
      project?.name || 'project',
      summary,
      { projectName: project?.name, drawingNumber: '' }
    );
    setSuccessMessage(`EXPORT COMPLETE: ${filename}`);
    setShowSuccess(true);
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const filteredPoints = ioPoints.filter(p => {
    if (filterDrawing !== 'all' && p.drawing_id !== filterDrawing) return false;
    if (filterSignalType !== 'all' && p.signal_type !== filterSignalType) return false;
    if (filterLocation && !p.location?.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    return true;
  });

  const summary = calculateSummary(filteredPoints.map(p => ({ signalType: p.signal_type })));

  const getSignalBadgeClass = (type) => {
    const classes = { AI: 'signal-badge ai', DI: 'signal-badge di', DO: 'signal-badge do', AO: 'signal-badge ao', COM: 'signal-badge com' };
    return classes[type] || 'signal-badge';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const uniqueLocations = [...new Set(ioPoints.map(p => p.location).filter(Boolean))];

  if (loading) {
    return (
      <div className="terminal-container min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="terminal-container min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#7d8590] font-mono">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-container min-h-screen flex flex-col">
      <Header />

      {showSuccess && (
        <SuccessToast message={successMessage} onClose={() => setShowSuccess(false)} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        onChange={handleFileSelected}
        multiple
      />

      <div className="flex-1 flex pt-16 overflow-hidden">
        {/* LEFT PANEL — Drawing List */}
        <aside className="w-72 flex-shrink-0 border-r border-[#30363d] bg-[#0d1117] flex flex-col overflow-hidden">
          {/* Back + Project Info */}
          <div className="p-4 border-b border-[#30363d]">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-xs font-mono text-[#7d8590] hover:text-[#22c55e] mb-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ALL PROJECTS
            </button>
            <h2 className="text-base font-bold text-white font-mono truncate">{project.name}</h2>
            {project.client && (
              <p className="text-[10px] text-[#7d8590] font-mono mt-0.5 truncate">{project.client}</p>
            )}
          </div>

          {/* Add P&ID Button */}
          <div className="p-3 border-b border-[#30363d]">
            <button
              onClick={handleAddPid}
              disabled={analyzing}
              className="w-full py-2.5 px-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded text-sm font-mono text-[#22c55e] hover:bg-[#22c55e]/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs truncate">{analyzeProgress || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  ADD P&ID
                </>
              )}
            </button>
          </div>

          {/* Drawing List */}
          <div className="flex-1 overflow-y-auto">
            {drawings.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="w-8 h-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#7d8590] font-mono">No drawings yet</p>
                <p className="text-[10px] text-[#484f58] font-mono mt-1">Upload a P&ID to get started</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {/* Show All option */}
                <button
                  onClick={() => { setSelectedDrawingId(null); setFilterDrawing('all'); }}
                  className={`w-full p-2.5 rounded text-left transition-all ${
                    !selectedDrawingId
                      ? 'bg-[#22c55e]/10 border border-[#22c55e]/30'
                      : 'border border-transparent hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span className="text-xs font-mono text-[#c9d1d9]">ALL DRAWINGS</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7d8590] ml-5.5">
                    {ioPoints.length} total points
                  </span>
                </button>

                {drawings.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDrawingId(d.id); setFilterDrawing(d.id); }}
                    className={`w-full p-2.5 rounded text-left transition-all group ${
                      selectedDrawingId === d.id
                        ? 'bg-[#22c55e]/10 border border-[#22c55e]/30'
                        : 'border border-transparent hover:bg-[#161b22]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#3b82f6] flex-shrink-0" />
                        <span className="text-xs font-mono text-[#c9d1d9] truncate">{d.filename}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDrawing(d.id, e)}
                        className="p-1 rounded hover:bg-[#f85149]/10 text-[#484f58] hover:text-[#f85149] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1 ml-5.5">
                      <span className="text-[10px] font-mono text-[#7d8590]">{d.io_count} points</span>
                      <span className="text-[10px] font-mono text-[#484f58]">{formatDate(d.analyzed_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL — I/O List */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-[#f85149]/10 border border-[#f85149]/30 rounded text-[#f85149] text-xs font-mono flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Summary Stats */}
            <div className="hud-card p-6 mb-6">
              <div className="hud-card-corners"></div>
              <div className="relative z-10">
                <div className="terminal-header mb-4">
                  <Activity className="w-4 h-4" />
                  <span>PROJECT SUMMARY</span>
                  <span className="ml-auto text-[10px] text-[#7d8590]">
                    {drawings.length} drawing{drawings.length !== 1 ? 's' : ''} / {filteredPoints.length} I/O points
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <div className="hud-stat-card">
                    <p className="text-3xl font-mono font-bold text-[#22c55e]">{summary.total}</p>
                    <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">TOTAL</p>
                  </div>
                  <div className="hud-stat-card">
                    <p className="text-3xl font-mono font-bold text-[#3b82f6]">{summary.AI}</p>
                    <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">AI</p>
                  </div>
                  <div className="hud-stat-card">
                    <p className="text-3xl font-mono font-bold text-[#22c55e]">{summary.DI}</p>
                    <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">DI</p>
                  </div>
                  <div className="hud-stat-card">
                    <p className="text-3xl font-mono font-bold text-[#f97316]">{summary.DO}</p>
                    <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">DO</p>
                  </div>
                  <div className="hud-stat-card">
                    <p className="text-3xl font-mono font-bold text-[#a855f7]">{summary.AO}</p>
                    <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">AO</p>
                  </div>
                  <div className="hud-stat-card">
                    <p className="text-3xl font-mono font-bold text-[#eab308]">{summary.COM}</p>
                    <p className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider mt-1">COM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="hud-card p-4 mb-6">
              <div className="hud-card-corners"></div>
              <div className="relative z-10 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span className="text-[10px] font-mono text-[#7d8590] uppercase">Filters</span>
                </div>

                <select
                  value={filterSignalType}
                  onChange={(e) => setFilterSignalType(e.target.value)}
                  className="terminal-select text-xs py-1.5 px-3"
                >
                  <option value="all">All Signal Types</option>
                  <option value="AI">AI</option>
                  <option value="DI">DI</option>
                  <option value="DO">DO</option>
                  <option value="AO">AO</option>
                  <option value="COM">COM</option>
                </select>

                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="terminal-input text-xs py-1.5 px-3 w-48"
                />

                <div className="ml-auto">
                  <button onClick={handleExport} className="hardware-switch text-xs" disabled={filteredPoints.length === 0}>
                    <Download className="w-3.5 h-3.5 ml-2" />
                    <span className="text-xs">EXPORT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* I/O Table */}
            <div className="hud-card overflow-hidden mb-6">
              <div className="hud-card-corners"></div>
              <div className="relative z-10">
                <div className="terminal-header">
                  <Server className="w-4 h-4" />
                  <span>I/O DATABASE</span>
                  <span className="ml-auto text-[10px] text-[#7d8590]">{filteredPoints.length} RECORDS</span>
                </div>

                {filteredPoints.length === 0 ? (
                  <div className="p-12 text-center">
                    <Database className="w-10 h-10 text-[#30363d] mx-auto mb-3" />
                    <p className="text-sm text-[#7d8590] font-mono">
                      {ioPoints.length === 0
                        ? 'No I/O points yet — upload a P&ID drawing to get started'
                        : 'No points match your filters'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="terminal-table">
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}>#</th>
                          <th>LOCATION</th>
                          <th>EQUIPMENT</th>
                          <th>SIGNAL</th>
                          <th style={{ width: '80px' }}>IO TYPE</th>
                          <th style={{ width: '60px' }}>ALARM</th>
                          <th style={{ width: '160px' }}>SOURCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPoints.map((point, index) => (
                          <tr
                            key={point.id}
                            className={selectedDrawingId === point.drawing_id ? 'bg-[#22c55e]/5' : ''}
                          >
                            <td className="text-[#7d8590] font-mono">{String(index + 1).padStart(3, '0')}</td>
                            <td className="text-[#7d8590] text-xs font-mono">{point.location || '-'}</td>
                            <td>
                              <div>
                                <span className="font-mono font-semibold text-[#c9d1d9]">{point.tag}</span>
                                {point.equipment && (
                                  <span className="text-[10px] text-[#484f58] ml-2">{point.equipment}</span>
                                )}
                              </div>
                            </td>
                            <td className="text-[#7d8590] text-xs">{point.description}</td>
                            <td>
                              <span className={getSignalBadgeClass(point.signal_type)}>
                                {point.signal_type}
                              </span>
                            </td>
                            <td className="text-center">
                              {point.is_alarm && (
                                <span className="text-[#f97316] text-xs font-mono">X</span>
                              )}
                            </td>
                            <td className="text-[#484f58] text-[10px] font-mono truncate max-w-[160px]" title={point.source_file}>
                              {point.source_file || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
