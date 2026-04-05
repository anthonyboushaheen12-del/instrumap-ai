import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FolderOpen, Database, Activity, FileText,
  Loader2, Trash2, X, Clock
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../utils/supabase';
import { getProjects, createProject, deleteProject } from '../utils/projectService';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        setError('Cannot reach Supabase. Your project may be paused (free tier auto-pauses after inactivity) — visit supabase.com to resume it, or check your VITE_SUPABASE_URL in .env.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setCreating(true);
    try {
      const project = await createProject({
        name: formName.trim(),
        client: formClient.trim(),
        description: formDescription.trim(),
      });
      setShowModal(false);
      setFormName('');
      setFormClient('');
      setFormDescription('');
      navigate(`/project/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its data?')) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const getProjectSizeColor = (ioCount) => {
    if (ioCount > 100) return '#22c55e';
    if (ioCount > 50) return '#3b82f6';
    if (ioCount > 0) return '#eab308';
    return '#30363d';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="terminal-container min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20 px-6 pb-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white font-mono tracking-tight">My Projects</h2>
              <p className="text-sm text-[#7d8590] font-mono mt-1">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="hardware-switch"
              disabled={!supabase}
            >
              <Plus className="w-4 h-4 ml-4" />
              <span>NEW PROJECT</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-[#f85149]/10 border border-[#f85149]/30 rounded text-[#f85149] text-sm font-mono flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && projects.length === 0 && !error && (
            <div className="hud-card p-16 text-center">
              <div className="hud-card-corners"></div>
              <div className="relative z-10">
                <FolderOpen className="w-16 h-16 text-[#30363d] mx-auto mb-4" />
                <h3 className="text-lg font-mono text-[#c9d1d9] mb-2">No projects yet</h3>
                <p className="text-sm text-[#7d8590] font-mono mb-6">
                  Create your first project to start analyzing P&ID drawings
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="hardware-switch"
                  disabled={!supabase}
                >
                  <Plus className="w-4 h-4 ml-4" />
                  <span>CREATE PROJECT</span>
                </button>
              </div>
            </div>
          )}

          {/* Project Grid */}
          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative bg-[#0d1117] border border-[#30363d] rounded cursor-pointer transition-all hover:border-[#22c55e]/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                >
                  {/* Size bar at top */}
                  <div
                    className="h-1 rounded-t"
                    style={{ background: getProjectSizeColor(project.ioCount) }}
                  />

                  <div className="p-5">
                    {/* Project Name */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-[#c9d1d9] font-mono group-hover:text-[#22c55e] transition-colors truncate pr-2">
                        {project.name}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-1.5 rounded hover:bg-[#f85149]/10 text-[#484f58] hover:text-[#f85149] transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Client */}
                    {project.client && (
                      <p className="text-xs text-[#7d8590] font-mono mb-3 truncate">
                        {project.client}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#7d8590]">
                        <FileText className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span>{project.drawingCount} drawing{project.drawingCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#7d8590]">
                        <Database className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>{project.ioCount} I/O point{project.ioCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#484f58]">
                      <Clock className="w-3 h-3" />
                      <span>Updated {formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Analyze Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/analyze')}
              className="text-sm font-mono text-[#7d8590] hover:text-[#22c55e] transition-colors"
            >
              or analyze without a project →
            </button>
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg w-full max-w-md mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#22c55e]" />
                <span className="font-mono font-semibold text-[#c9d1d9] text-sm">NEW PROJECT</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded hover:bg-[#21262d] text-[#7d8590] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#7d8590] uppercase mb-1.5">
                  Project Name <span className="text-[#f85149]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. PS2.1 Pump Station"
                  autoFocus
                  required
                  className="terminal-input w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#7d8590] uppercase mb-1.5">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  placeholder="e.g. Dar Al-Handasah"
                  className="terminal-input w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#7d8590] uppercase mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief project description..."
                  rows={2}
                  className="terminal-input w-full resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 border border-[#30363d] rounded text-sm font-mono text-[#7d8590] hover:border-[#7d8590] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim() || creating}
                  className="flex-1 py-2.5 px-4 bg-[#22c55e] text-[#0d1117] rounded text-sm font-mono font-semibold hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
