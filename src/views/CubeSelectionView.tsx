import React from 'react';
import { Camera, Edit3, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import PageHeader from '../components/common/PageHeader';
import type { PuzzleTypeId, PuzzleDefinition } from '../types/cube';

export const CubeSelectionView: React.FC = () => {
  const { selectedPuzzle, setSelectedPuzzle, setInputMode, setView } = useCube();

  const handleSelectAndProceed = (id: PuzzleTypeId, mode: 'manual' | 'camera') => {
    setSelectedPuzzle(id);
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
        title="Select Puzzle & Input Mode"
        subtitle="Choose your cube geometry and select how you would like to input your colors (AI Camera Scan or Manual 3D Painter)."
        badge="Universal Engine"
        backTo="home"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {PUZZLE_DEFINITIONS.map((puzzle: PuzzleDefinition) => {
          const isSelected = selectedPuzzle === puzzle.id;
          return (
            <div
              key={puzzle.id}
              className={`rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/15'
                  : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                  Active Selection
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      {puzzle.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{puzzle.category}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-semibold text-cyan-400">{puzzle.difficulty}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {puzzle.description}
                </p>

                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-6 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Dimensions</span>
                    <span className="text-sm font-bold text-white">{puzzle.size}x{puzzle.size}x{puzzle.size}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total Faces</span>
                    <span className="text-sm font-bold text-white">{puzzle.faces}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Stickers/Face</span>
                    <span className="text-sm font-bold text-white">{puzzle.stickersPerFace}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-8 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Solving Engine: <strong className="text-slate-200">{puzzle.algorithmSupport}</strong></span>
                </div>
              </div>

              {puzzle.supported ? (
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Choose Input Method:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSelectAndProceed(puzzle.id, 'camera')}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Camera Scanner</span>
                    </button>
                    <button
                      onClick={() => handleSelectAndProceed(puzzle.id, 'manual')}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                      <span>Manual 3D Net</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Geometry engine mapped. Solving algorithms arrive in Stage 2.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CubeSelectionView;
