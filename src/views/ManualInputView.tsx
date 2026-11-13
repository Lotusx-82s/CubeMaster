import React from 'react';
import { 
  Palette, 
  RotateCcw, 
  Trash2, 
  Shuffle, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { useCube } from '../context';
import type { CubeColor, FaceId } from '../types/cube';
import { CUBE_COLORS, FACE_NAMES } from '../types/cube';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PageHeader from '../components/common/PageHeader';

export const ManualInputView: React.FC = () => {
  const { 
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

  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let totalFilled = 0;

  for (const face of faces) {
    for (const sticker of cubeState[face]) {
      if (sticker && sticker in colorCounts) {
        colorCounts[sticker] += 1;
        totalFilled++;
      }
    }
  }

  const handleStickerClick = (face: FaceId, index: number) => {
    if (index === 4) {
      return;
    }
    setStickerColor(face, index, selectedColor);
  };

  const paletteColors: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

  const renderFaceGrid = (face: FaceId, label: string) => {
    const isHighlighted = activeFace === face;
    const centerColor = FACE_NAMES[face].standardColor;

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
          <span className="text-[10px] text-slate-400 capitalize">{centerColor}</span>
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
                  handleStickerClick(face, idx);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="Manual Cube Sticker Painter"
        subtitle="Select a color from the palette, then tap on the 2D net or interactive 3D virtual cube to paint each sticker."
        badge="3D Interactive"
        backTo="select"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => scrambleCube(20)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Random Scramble</span>
            </button>
            <button
              onClick={resetToSolved}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Solved</span>
            </button>
            <button
              onClick={() => clearCube(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Faces</span>
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              1. Select Paint Color:
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {paletteColors.map((color) => {
                const colorDef = CUBE_COLORS[color];
                const isSelected = selectedColor === color;
                const count = colorCounts[color];
                const isComplete = count === 9;

                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg scale-105'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-md border shadow-sm"
                      style={{ backgroundColor: colorDef.hex, borderColor: colorDef.borderHex }}
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block capitalize">
                        {colorDef.label}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        isComplete ? 'text-emerald-400' : count > 9 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {count}/9
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
                {totalFilled} <span className="text-slate-500 font-normal">/ 54</span>
              </span>
            </div>

            <button
              onClick={() => setView('validate')}
              className="py-3 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validate & Solve</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Unfolded 2D Cube Net</span>
              </h3>
              <p className="text-xs text-slate-400">
                Tap any sticker to paint with <strong>{selectedColor}</strong>.
              </p>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
              Centers are fixed
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 py-4 overflow-x-auto">
            <div className="flex justify-center">
              {renderFaceGrid('U', 'Up (U)')}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {renderFaceGrid('L', 'Left (L)')}
              {renderFaceGrid('F', 'Front (F)')}
              {renderFaceGrid('R', 'Right (R)')}
              {renderFaceGrid('B', 'Back (B)')}
            </div>

            <div className="flex justify-center">
              {renderFaceGrid('D', 'Down (D)')}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>3D Virtual Cube Preview</span>
              </h3>
              <span className="text-[10px] text-slate-400 bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Interactive
              </span>
            </div>

            <div className="h-[360px] w-full">
              <RubiksCube3D
                cubeState={cubeState}
                onStickerClick={handleStickerClick}
                interactive={true}
                autoRotate={false}
                highlightFace={activeFace}
              />
            </div>

            <div className="text-xs text-slate-400 text-center">
              Rotate in 3D to inspect sides, or click directly on stickers to paint!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInputView;
