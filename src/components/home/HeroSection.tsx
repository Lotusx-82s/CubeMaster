import React from 'react';
import { Camera, Edit3, ArrowRight, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { useCube } from '../../context';
import HeroCube3D from '../3d/HeroCube3D';

export const HeroSection: React.FC = () => {
  const { setView, setInputMode } = useCube();

  const handleStartCamera = () => {
    setInputMode('camera');
    setView('scan');
  };

  const handleStartManual = () => {
    setInputMode('manual');
    setView('manual');
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
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-300">
                Next-Gen AI Rubik's Cube Solver
              </span>
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                v1.0 <Sparkles className="w-3 h-3" />
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Solve Any Rubik's Cube with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                AI Vision
              </span>{' '}
              & 3D Precision.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Scan your scrambled cube face-by-face using your device camera or tap colors onto an interactive 3D virtual cube. Get instant state validation and step-by-step animated 3D solution moves.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={handleStartCamera}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-base bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Scan with Camera</span>
                <ArrowRight className="w-4 h-4 text-cyan-200" />
              </button>

              <button
                onClick={handleStartManual}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-base bg-slate-900/90 hover:bg-slate-800/90 text-white border border-slate-700/80 shadow-lg hover:border-slate-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Manual 3D Input</span>
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
