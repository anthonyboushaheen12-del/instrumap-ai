import { Activity, Github, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1B263B] border-t border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#22c55e] to-[#06b6d4] rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">InstruMap AI</h3>
                <p className="text-xs text-slate-400">P&ID Analysis Engine</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md mb-4">
              Transform P&ID drawings into structured I/O lists in seconds.
              Built by I&C Engineers, for I&C Engineers.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-[#22c55e] transition-colors">
                  Analyze P&ID
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-sm text-slate-400 hover:text-[#22c55e] transition-colors">
                  Equipment Templates
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-slate-400 hover:text-[#22c55e] transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-[#22c55e] transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-[#22c55e] transition-colors">
                  ISA Standards
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-[#22c55e] transition-colors">
                  API Access
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} InstruMap AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <span>·</span>
            <span className="text-[#22c55e]">v1.0.0-beta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
