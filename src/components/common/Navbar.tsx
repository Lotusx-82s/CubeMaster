import React, { useState } from 'react';
import { 
  Box, 
  Camera, 
  Edit3, 
  CheckCircle2, 
  PlayCircle, 
  Settings, 
  Menu, 
  X, 
  Sparkles,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useCube } from '../../context';
import type { AppView } from '../../types/navigation';

export const Navbar: React.FC = () => {
  const { currentView, setView, selectedPuzzle } = useCube();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AppView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Box },
    { id: 'select', label: 'Puzzles', icon: Layers },
    { id: 'scan', label: 'Camera Scan', icon: Camera },
    { id: 'manual', label: 'Manual Input', icon: Edit3 },
    { id: 'validate', label: 'Validation', icon: CheckCircle2 },
    { id: 'solution', label: '3D Solution', icon: PlayCircle },
    { id: 'settings', label: 'Help & Guide', icon: Settings },
  ];

  const handleNavClick = (view: AppView) => {
    setView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <div className="grid grid-cols-2 gap-0.5 p-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                Cube<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500">Master</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Modern 3D Rubik's Cube Solver
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Button & Active Puzzle Badge */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Puzzle:</span>
            <span className="font-semibold text-white uppercase">{selectedPuzzle}</span>
          </div>

          <button
            onClick={() => handleNavClick('manual')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:opacity-95 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Solving</span>
          </button>
        </div>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => handleNavClick('manual')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch 3D Solver</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
