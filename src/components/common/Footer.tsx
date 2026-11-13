import React from 'react';
import { Compass, BookOpen, ShieldCheck, Cpu } from 'lucide-react';
import { useCube } from '../../context';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  const { setView } = useCube();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                CM
              </div>
              <span className="font-bold text-lg text-white">
                Cube<span className="text-cyan-400">Master</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Professional, modern AI Rubik's cube solver with computer vision scanning, 3D interactive manipulation, and verified step-by-step algorithms.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>WCA Standard Compliant</span>
            </div>
          </div>

          {/* Quick Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Input Methods
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => setView('scan')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  AI Camera Face Scanner
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setView('manual')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  3D Interactive Color Palette
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setView('validate')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Parity & Integrity Validator
                </button>
              </li>
            </ul>
          </div>

          {/* Puzzle Types */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Supported Puzzles
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => setView('select')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>3x3 Rubik's Cube</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">Active</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setView('select')}
                  className="hover:text-slate-500 transition-colors cursor-pointer"
                >
                  2x2 Pocket Cube (Preview)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setView('select')}
                  className="hover:text-slate-500 transition-colors cursor-pointer"
                >
                  4x4 Rubik's Revenge (Preview)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setView('select')}
                  className="hover:text-slate-500 transition-colors cursor-pointer"
                >
                  Pyraminx (Preview)
                </button>
              </li>
            </ul>
          </div>

          {/* Solving Technology */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Solving Engines
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Two-Phase Kociemba Algorithm</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>CFOP Layer-by-Layer Guide</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Official Singmaster Move Notation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {CURRENT_YEAR} CubeMaster AI. All puzzle trademarks belong to their respective owners.</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('settings')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Notation Reference
            </button>
            <span>•</span>
            <button 
              onClick={() => setView('settings')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Calibration Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
