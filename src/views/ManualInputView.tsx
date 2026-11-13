import React, { useState } from 'react';
import { 
  Palette, 
  RotateCcw, 
  Trash2, 
  Shuffle, 
  ShieldCheck, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import type { CubeColor, FaceId } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import PageHeader from '../components/common/PageHeader';

export const ManualInputView: React.FC = () => {
  const { 
    selectedPuzzle,
    cubeState, 
    setStickerColor, 
    selectedColor, 
    setSelectedColor, 
    resetToSolved, 
    clearCube, 
    scrambleCube, 
    activeFace, 
    setActiveFace,
    setView 
  } = useCube();

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];
  const is3x3 = selectedPuzzle === '3x3';

  // Dynamic state for non-3x3 puzzles: map of faceId -> array of colors
  const [genericPuzzleState, setGenericPuzzleState] = useState<Record<string, (CubeColor | null)[]>>(() => {
    const initial: Record<string, (CubeColor | null)[]> = {};
    for (const face of puzzleDef.faceNames) {
      initial[face.id] = Array(puzzleDef.stickersPerFace).fill(face.defaultColor);
    }
    return initial;
  });

  // Calculate sticker counts based on current active puzzle
  const colorCounts: Record<string, number> = {};
  for (const color of puzzleDef.colorSet) {
    colorCounts[color] = 0;
  }

  let totalFilled = 0;

  if (is3x3) {
    const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (const face of faces) {
      for (const sticker of cubeState[face]) {
        if (sticker && sticker in colorCounts) {
          colorCounts[sticker] += 1;
          totalFilled++;
        }
      }
    }
  } else {
    for (const face of puzzleDef.faceNames) {
      const stickers = genericPuzzleState[face.id] || [];
      for (const sticker of stickers) {
        if (sticker && sticker in colorCounts) {
          colorCounts[sticker] += 1;
          totalFilled++;
        }
      }
    }
  }

  // Handle clicking sticker
  const handleGenericStickerClick = (faceId: string, index: number) => {
    setGenericPuzzleState(prev => {
      const nextFace = [...(prev[faceId] || Array(puzzleDef.stickersPerFace).fill(null))];
      nextFace[index] = selectedColor;
      return {
        ...prev,
        [faceId]: nextFace,
      };
    });
  };

  const handle3x3StickerClick = (face: FaceId, index: number) => {
    if (index === 4) return; // preserve center
    setStickerColor(face, index, selectedColor);
  };

  const handleReset = () => {
    if (is3x3) {
      resetToSolved();
    } else {
      const initial: Record<string, (CubeColor | null)[]> = {};
      for (const face of puzzleDef.faceNames) {
        initial[face.id] = Array(puzzleDef.stickersPerFace).fill(face.defaultColor);
      }
      setGenericPuzzleState(initial);
    }
  };

  const handleClear = () => {
    if (is3x3) {
      clearCube(true);
    } else {
      const initial: Record<string, (CubeColor | null)[]> = {};
      for (const face of puzzleDef.faceNames) {
        initial[face.id] = Array(puzzleDef.stickersPerFace).fill(null);
      }
      setGenericPuzzleState(initial);
    }
  };

  // Render 3x3 face
  const render3x3Face = (face: FaceId, label: string) => {
    const isHighlighted = activeFace === face;

    return (
      <div 
        onClick={() => setActiveFace(face)}
        className={`p-2 rounded-2xl transition-all cursor-pointer ${
          isHighlighted 
            ? 'bg-slate-900 border-2 border-cyan-500 shadow-lg shadow-cyan-500/10' 
            : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1 mb-1.5">
          <span>{label}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 aspect-square w-28 sm:w-32">
          {cubeState[face].map((color: CubeColor | null, idx: number) => {
            const isCenter = idx === 4;
            const colorDef = color ? CUBE_COLORS[color] : null;

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handle3x3StickerClick(face, idx);
                }}
                title={isCenter ? 'Center (fixed)' : `Paint with ${selectedColor}`}
                className={`w-full h-full rounded-md border transition-all flex items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                  isCenter ? 'ring-1 ring-cyan-400/40 cursor-default' : ''
                }`}
                style={{
                  backgroundColor: colorDef ? colorDef.hex : '#334155',
                  borderColor: colorDef ? colorDef.borderHex : '#475569',
                  color: colorDef ? colorDef.textColor : '#ffffff',
                }}
              >
                {isCenter ? '●' : ''}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render generic puzzle face (e.g., 2x2, 4x4, Pyraminx, Skewb, Megaminx)
  const renderGenericFaceCard = (face: { id: string; name: string; defaultColor: CubeColor }) => {
    const stickers = genericPuzzleState[face.id] || Array(puzzleDef.stickersPerFace).fill(null);

    // Layout configuration depending on geometry
    let gridCols = 'grid-cols-2';
    if (selectedPuzzle === '4x4') gridCols = 'grid-cols-4';
    else if (selectedPuzzle === 'pyraminx') gridCols = 'grid-cols-3';
    else if (selectedPuzzle === 'skewb') gridCols = 'grid-cols-3';
    else if (selectedPuzzle === 'megaminx') gridCols = 'grid-cols-3';

    return (
      <div 
        key={face.id}
        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all"
      >
        <div className="flex items-center justify-between text-xs font-bold text-white mb-2.5">
          <span>{face.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">Face {face.id}</span>
        </div>

        <div className={`grid ${gridCols} gap-1.5 aspect-square max-w-[140px] mx-auto`}>
          {stickers.map((color, idx) => {
            const colorDef = color ? CUBE_COLORS[color] : null;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleGenericStickerClick(face.id, idx)}
                title={`Sticker #${idx + 1} - Click to paint with ${selectedColor}`}
                className="w-full h-full rounded-md border transition-all flex items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: colorDef ? colorDef.hex : '#334155',
                  borderColor: colorDef ? colorDef.borderHex : '#475569',
                  color: colorDef ? colorDef.textColor : '#ffffff',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`Manual Color Painter • ${puzzleDef.name}`}
        subtitle={`Select a color from the calibrated palette, then tap stickers to configure all ${puzzleDef.totalStickers} facelets on this ${puzzleDef.dimensionsLabel} ${puzzleDef.geometryType} puzzle.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="select"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (is3x3) scrambleCube(20);
              }}
              disabled={!is3x3}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Random Scramble</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Solved</span>
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Faces</span>
            </button>
          </div>
        }
      />

      {/* Solver status alert banner if puzzle is unsupported */}
      {!puzzleDef.supported && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-300 block mb-0.5">
              Solver Not Yet Available for {puzzleDef.name} ({puzzleDef.geometryType})
            </strong>
            You can interactively paint and map all {puzzleDef.facesCount} faces and {puzzleDef.totalStickers} stickers. Automated solving algorithms for this puzzle geometry are in active development.
          </div>
        </div>
      )}

      {/* Palette Toolbar & Sticker Counter */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              1. Select Paint Color ({puzzleDef.colorSet.length} colors):
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {puzzleDef.colorSet.map((color) => {
                const colorDef = CUBE_COLORS[color] || { label: color, hex: '#ffffff', borderHex: '#cbd5e1' };
                const isSelected = selectedColor === color;
                const count = colorCounts[color] || 0;
                const target = Math.round(puzzleDef.totalStickers / puzzleDef.colorSet.length);

                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg scale-105'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-md border shadow-sm"
                      style={{ backgroundColor: colorDef.hex, borderColor: colorDef.borderHex }}
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block capitalize">
                        {colorDef.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {count}/{target}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400 block">Stickers Painted</span>
              <span className="text-lg font-extrabold text-white">
                {totalFilled} <span className="text-slate-500 font-normal">/ {puzzleDef.totalStickers}</span>
              </span>
            </div>

            <button
              onClick={() => setView('validate')}
              className="py-3 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validate Puzzle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Unfolded Faces Net */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>{puzzleDef.name} Face Net Layout</span>
              </h3>
              <p className="text-xs text-slate-400">
                Tap stickers to paint with <strong>{selectedColor}</strong>.
              </p>
            </div>

            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {puzzleDef.facesCount} Faces
            </span>
          </div>

          {/* If standard 3x3: Cross Layout */}
          {is3x3 ? (
            <div className="flex flex-col items-center gap-2 py-4 overflow-x-auto">
              <div className="flex justify-center">
                {render3x3Face('U', 'Up (U)')}
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {render3x3Face('L', 'Left (L)')}
                {render3x3Face('F', 'Front (F)')}
                {render3x3Face('R', 'Right (R)')}
                {render3x3Face('B', 'Back (B)')}
              </div>
              <div className="flex justify-center">
                {render3x3Face('D', 'Down (D)')}
              </div>
            </div>
          ) : (
            /* Non-3x3 puzzles: Grid of all puzzle faces */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {puzzleDef.faceNames.map(renderGenericFaceCard)}
            </div>
          )}
        </div>

        {/* Right: Live 3D Model & Puzzle Information */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Representative 3D Model</span>
              </h3>
              <span className="text-[10px] text-slate-400 bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {puzzleDef.geometryType}
              </span>
            </div>

            <div className="h-[340px] w-full rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden">
              {is3x3 ? (
                <RubiksCube3D
                  cubeState={cubeState}
                  onStickerClick={handle3x3StickerClick}
                  interactive={true}
                  autoRotate={false}
                  highlightFace={activeFace}
                />
              ) : (
                <PuzzlePreview3D puzzleId={selectedPuzzle} autoRotate={true} className="w-full h-full" />
              )}
            </div>

            {/* Puzzle Engine Specs */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Compatible Engine:</span>
                <span className="text-white font-bold">{puzzleDef.engineName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Methodology:</span>
                <span className="text-slate-200">{puzzleDef.algorithmSupport}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Solver Status:</span>
                <span className={puzzleDef.supported ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {puzzleDef.supported ? 'Fully Available' : 'In Active Development'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInputView;
