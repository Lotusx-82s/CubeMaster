import React from 'react';
import { Layers, ArrowRight, CheckCircle2, ShieldAlert, Sparkles, Cpu } from 'lucide-react';
import { useCube } from '../../context';
import { PUZZLE_DEFINITIONS } from '../../services/puzzles';
import PuzzlePreview3D from '../3d/PuzzlePreview3D';
import type { PuzzleTypeId, PuzzleDefinition } from '../../types/cube';

export const PuzzleTypesShowcase: React.FC = () => {
  const { selectedPuzzle, setSelectedPuzzle, setView } = useCube();

  const handleSelectPuzzle = (id: PuzzleTypeId) => {
    setSelectedPuzzle(id);
    setView('select');
  };

  return (
    <section id="puzzle-selection" className="py-16 lg:py-20 border-t border-slate-900 bg-slate-950/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Puzzle Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Explore Supported & Preview Puzzles
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              CubeMaster supports six official WCA puzzle geometries. Each puzzle features custom 3D mesh rendering, exact sticker coordinates, and dedicated solving engines.
            </p>
          </div>

          <button
            onClick={() => setView('select')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer shrink-0"
          >
            <span>Open Puzzle Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUZZLE_DEFINITIONS.map((puzzle: PuzzleDefinition) => {
            const isSelected = selectedPuzzle === puzzle.id;
            return (
              <div
                key={puzzle.id}
                onClick={() => handleSelectPuzzle(puzzle.id)}
                className={`group relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/15'
                    : 'bg-slate-900/50 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-xl'
                }`}
              >
                <div>
                  {/* Top Status & Dimension Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                      {puzzle.dimensionsLabel}
                    </span>
                    {puzzle.supported ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Solver Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>In Development</span>
                      </span>
                    )}
                  </div>

                  {/* 3D Representative Model Preview */}
                  <div className="h-44 w-full flex items-center justify-center my-2 rounded-2xl bg-slate-950/70 border border-slate-800/80 group-hover:border-slate-700 transition-colors overflow-hidden">
                    <PuzzlePreview3D puzzleId={puzzle.id} autoRotate={true} />
                  </div>

                  {/* Puzzle Title & Geometry Type */}
                  <div className="mt-4 mb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                        {puzzle.name}
                      </h3>
                      <span className="text-xs font-bold text-cyan-400">
                        {puzzle.difficulty}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {puzzle.category} • {puzzle.geometryType}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-300/90 leading-relaxed mb-4 line-clamp-2">
                    {puzzle.description}
                  </p>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs mb-4 text-center">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Faces</span>
                      <span className="font-bold text-slate-200">{puzzle.facesCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stickers</span>
                      <span className="font-bold text-slate-200">{puzzle.totalStickers}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Colors</span>
                      <span className="font-bold text-cyan-400">{puzzle.colorSet.length}</span>
                    </div>
                  </div>

                  {/* Engine Details */}
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-0.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Engine: {puzzle.engineName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Support: <strong className="text-slate-200">{puzzle.algorithmSupport}</strong>
                    </span>
                  </div>
                </div>

                {/* Honest Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPuzzle(puzzle.id);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    puzzle.supported
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {puzzle.supported ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Solve {puzzle.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Explore {puzzle.name} (Preview)</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PuzzleTypesShowcase;
