import React from 'react';
import { 
  Camera, 
  Edit3, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import PageHeader from '../components/common/PageHeader';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import type { PuzzleTypeId, PuzzleDefinition } from '../types/cube';

export const CubeSelectionView: React.FC = () => {
  const { selectedPuzzle, setSelectedPuzzle, setInputMode, setView } = useCube();

  const currentDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];

  const handleSelectPuzzle = (id: PuzzleTypeId) => {
    setSelectedPuzzle(id);
  };

  const handleProceedWithMode = (mode: 'camera' | 'manual') => {
    setInputMode(mode);
    if (mode === 'camera') {
      setView('scan');
    } else {
      setView('manual');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="Select Puzzle & Input Method"
        subtitle="Choose from 6 official WCA puzzle types. Each puzzle features its own authentic 3D geometry, face structure, color configuration, and dedicated solving engine."
        badge="6 Geometries"
        backTo="home"
      />

      {/* 6 Puzzle Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {PUZZLE_DEFINITIONS.map((puzzle: PuzzleDefinition) => {
          const isSelected = selectedPuzzle === puzzle.id;

          return (
            <div
              key={puzzle.id}
              onClick={() => handleSelectPuzzle(puzzle.id)}
              className={`rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Top status & badge */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                    {puzzle.dimensionsLabel}
                  </span>
                  {puzzle.supported ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Solver Ready</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <ShieldAlert className="w-3 h-3" />
                      <span>In Development</span>
                    </span>
                  )}
                </div>

                {/* 3D Representative Preview for this exact puzzle */}
                <div className="h-44 w-full flex items-center justify-center my-1 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <PuzzlePreview3D puzzleId={puzzle.id} autoRotate={true} />
                </div>

                {/* Title & Category */}
                <div className="mt-3 mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-white">
                      {puzzle.name}
                    </h3>
                    <span className="text-xs font-semibold text-cyan-400">
                      {puzzle.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {puzzle.category} • {puzzle.geometryType}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                  {puzzle.description}
                </p>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Faces</span>
                    <span className="font-bold text-white">{puzzle.facesCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Stickers/Face</span>
                    <span className="font-bold text-white">{puzzle.stickersPerFace}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total</span>
                    <span className="font-bold text-cyan-400">{puzzle.totalStickers}</span>
                  </div>
                </div>

                {/* Compatible Solving Engine */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs mb-4">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Engine: {puzzle.engineName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Methods: <strong className="text-slate-200">{puzzle.algorithmSupport}</strong>
                  </span>
                </div>
              </div>

              {/* Select Puzzle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPuzzle(puzzle.id);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Selected Puzzle</span>
                  </>
                ) : (
                  <span>Select Puzzle</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Puzzle Action & Input Method Drawer */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border-2 border-cyan-500/50 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header of Selection */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white">
                    {currentDef.name}
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {currentDef.dimensionsLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentDef.facesCount} faces • {currentDef.totalStickers} stickers ({currentDef.stickersPerFace} per face) • {currentDef.colorSet.length} distinct colors
                </p>
              </div>
            </div>

            {/* Move Notation Pills */}
            <div className="flex items-center gap-1.5 flex-wrap max-w-md">
              <span className="text-[10px] font-bold uppercase text-slate-400 block w-full mb-1">
                Move Notations:
              </span>
              {currentDef.moveNotation.slice(0, 8).map((move) => (
                <span
                  key={move}
                  className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 text-[11px] font-mono font-bold"
                >
                  {move}
                </span>
              ))}
              {currentDef.moveNotation.length > 8 && (
                <span className="text-[10px] text-slate-400">
                  +{currentDef.moveNotation.length - 8} more
                </span>
              )}
            </div>
          </div>

          {/* Solver Availability Notice */}
          {!currentDef.supported ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300 block mb-0.5">
                  Solving Engine Notice: Solver for {currentDef.name} is In Active Development
                </strong>
                Algorithmic solving for this {currentDef.geometryType} geometry is currently in active development. Color input, geometric face mapping, and 3D preview are fully functional, but automated solving step generation is scheduled for the next engine release.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-emerald-300 block mb-0.5">
                  Solving Engine Ready: {currentDef.engineName}
                </strong>
                Fully integrated with Two-Phase Kociemba reduction and CFOP layer-by-layer methods with real-time 3D animation.
              </div>
            </div>
          )}

          {/* Dual Input Method Selection Options */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Select Input Method for {currentDef.name}:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Camera Scanning */}
              <div
                onClick={() => handleProceedWithMode('camera')}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Option A
                    </span>
                  </div>

                  <h5 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    Scan Using Camera
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Position your physical {currentDef.name} within the real-time targeting frame. Capture all {currentDef.facesCount} faces with automatic color extraction and lighting correction.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Camera Scanner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Option B: Enter Colors Manually */}
              <div
                onClick={() => handleProceedWithMode('manual')}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Option B
                    </span>
                  </div>

                  <h5 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    Enter Colors Manually
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Paint stickers directly on an interactive net or 3D preview. Includes full color palette ({currentDef.colorSet.length} colors), sticker counters, random scramble, and reset tools.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 group-hover:bg-emerald-600 text-white border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                  <span>Open Manual Color Painter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeSelectionView;
