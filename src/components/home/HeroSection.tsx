import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Layers, Play } from 'lucide-react';
import { useCube } from '../../context';
import HeroCube3D from '../3d/HeroCube3D';

export const HeroSection: React.FC = () => {
  const { setView } = useCube();

  const handleStartSolving = () => {
    const el = document.getElementById('input-selection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setView('select');
    }
  };

  const handleExplorePuzzles = () => {
    const el = document.getElementById('puzzle-selection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setView('select');
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background glow and subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Website Name & Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-black tracking-wide text-white uppercase">
                CubeMaster
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-xs font-semibold text-cyan-300">
                Every Puzzle. One Solution.
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Solve Any Cube,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Your Way.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Scan it, enter its colors manually, or import a scrambled puzzle from a supported simulator. Get step-by-step solutions with interactive 3D animations.
            </p>

            {/* Main Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={handleStartSolving}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
              >
                <Play className="w-5 h-5 fill-current text-white group-hover:scale-110 transition-transform" />
                <span>Start Solving</span>
                <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleExplorePuzzles}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base bg-slate-900/90 hover:bg-slate-800/90 text-white border border-slate-700/80 shadow-lg hover:border-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Explore Puzzles</span>
              </button>
            </div>

            {/* Quick feature highlights */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Parity & Sticker Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Real-Time 3D Playback</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Zero Fake Solutions</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Cube Presentation */}
          <div className="lg:col-span-5 relative">
            <HeroCube3D />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
