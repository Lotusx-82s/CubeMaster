import React from 'react';
import { Camera, Grid, Link2, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useCube } from '../../context';

export const InputSelectionSection: React.FC = () => {
  const { setInputMode, setView } = useCube();

  const handleStartScanning = () => {
    setInputMode('camera');
    setView('scan');
  };

  const handleEnterColors = () => {
    setInputMode('manual');
    setView('manual');
  };

  const handleImportCube = () => {
    setInputMode('url');
    setView('url-import');
  };

  return (
    <section id="input-selection" className="py-16 lg:py-20 border-t border-slate-900 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Three Smart Input Methods</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How Would You Like to Input Your Cube?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Choose your preferred capture method. Every input pipeline passes through our unified state normalizer, geometric parity validator, and interactive 3D solver.
          </p>
        </div>

        {/* 3 Distinguishable Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. SCAN YOUR CUBE */}
          <div
            onClick={handleStartScanning}
            className="group relative p-8 rounded-3xl bg-slate-900/60 border-2 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              {/* Card Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI Computer Vision
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">
                SCAN YOUR CUBE
              </h3>

              {/* Short Description */}
              <p className="text-sm text-slate-300/90 leading-relaxed mb-6">
                Position your physical puzzle inside the real-time camera viewfinder. Automatic CIELAB computer vision samples colors with ambient lighting and glare filtering.
              </p>

              {/* Feature Pill / Bullet */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold text-cyan-300 mb-8">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Capture all puzzle faces</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartScanning();
              }}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Start Scanning</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 2. ENTER COLORS MANUALLY */}
          <div
            onClick={handleEnterColors}
            className="group relative p-8 rounded-3xl bg-slate-900/60 border-2 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              {/* Card Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                  <Grid className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Interactive 3D / 2D Net
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-300 transition-colors">
                ENTER COLORS MANUALLY
              </h3>

              {/* Short Description */}
              <p className="text-sm text-slate-300/90 leading-relaxed mb-6">
                Paint stickers directly on an unfolded 2D face net or the interactive 3D virtual cube. Includes full color palettes, sticker counters, and undo history.
              </p>

              {/* Feature Pill / Bullet */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold text-emerald-300 mb-8">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Select each sticker color</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEnterColors();
              }}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span>Enter Colors</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 3. IMPORT USING URL */}
          <div
            onClick={handleImportCube}
            className="group relative p-8 rounded-3xl bg-slate-900/60 border-2 border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              {/* Card Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                  <Link2 className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Zero-Touch Import
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-300 transition-colors">
                IMPORT USING URL
              </h3>

              {/* Short Description */}
              <p className="text-sm text-slate-300/90 leading-relaxed mb-6">
                Paste a web link from verified external simulators (Alg.cubing.net, CubeDB.net, RubiksCu.be) to instantly extract and validate scrambled configurations.
              </p>

              {/* Feature Pill / Bullet */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold text-purple-300 mb-8">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Paste a supported simulator URL</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleImportCube();
              }}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>Import Cube</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InputSelectionSection;
