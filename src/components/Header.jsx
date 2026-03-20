import { Moon, Sun, Package, Activity, FolderOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1B263B]/95 backdrop-blur-md border-b border-slate-700/50 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#22c55e] to-[#06b6d4] rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/30 transition-shadow">
              <Activity className="w-5 h-5 text-white" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full border-2 border-[#1B263B] animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">InstruMap AI</h1>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase">P&ID Analysis Engine</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Link>

            <Link
              to="/analyze"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                location.pathname.startsWith('/analyze')
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Analyze
            </Link>

            <Link
              to="/templates"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                location.pathname === '/templates'
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </Link>

            <div className="h-6 w-px bg-slate-700 mx-2"></div>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Beta Badge */}
            <div className="ml-2 px-2.5 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full">
              <span className="text-[10px] font-semibold text-[#22c55e] uppercase tracking-wider">Beta</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
