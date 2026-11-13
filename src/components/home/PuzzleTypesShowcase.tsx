import React from 'react';
import { Layers, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
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
    <section className="py-16 border-t border-slate-900 bg-slate-950/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              <Layers className="w-4 h-4" />
              <span>Multi-Puzzle Architecture</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Supported Rubik's & Twisty Puzzles
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Select any of the 6 official puzzle geometries to inspect 3D structure, input stickers, or view solving algorithms.
            </p>
          </div>

          <button
            onClick={() => setView('select')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <span>View Full Puzzle Matrix</span>
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
                className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-2 border-cyan-500 shadow-xl shadow-cyan-500/10'
                    : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                      {puzzle.dimensionsLabel}
                    </span>
                    {puzzle.supported ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <ShieldAlert className="w-3 h-3" />
                        <span>In Development</span>
                      </span>
                    )}
                  </div>

                  {/* Representative 3D model */}
                  <div className="h-40 w-full flex items-center justify-center my-1 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <PuzzlePreview3D puzzleId={puzzle.id} autoRotate={true} />
                  </div>

                  {/* Puzzle Title */}
                  <div className="mt-3 mb-1">
                    <h4 className="text-lg font-bold text-white">
                      {puzzle.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {puzzle.category} • {puzzle.geometryType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                    {puzzle.description}
                  </p>

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs mb-4 text-center">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Faces</span>
                      <span className="font-semibold text-slate-200">{puzzle.facesCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stickers</span>
                      <span className="font-semibold text-slate-200">{puzzle.totalStickers}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Difficulty</span>
                      <span className="font-semibold text-cyan-400">{puzzle.difficulty}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPuzzle(puzzle.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>Select & Choose Input</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
