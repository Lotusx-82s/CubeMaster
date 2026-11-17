import React, { useState, useEffect, useCallback } from 'react';
import { 
  Palette, 
  RotateCcw, 
  Trash2, 
  Shuffle, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Undo2, 
  Eraser, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  HelpCircle 
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import { parseManualInput } from '../services/state';
import { useNotification } from '../context/NotificationContext';
import type { CubeColor, FaceId, StandardFaceId } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import PageHeader from '../components/common/PageHeader';

interface UndoAction {
  faceId: string;
  index: number;
  prevColor: CubeColor | null;
  newColor: CubeColor | null;
}

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
    genericPuzzleState,
    setGenericStickerColor,
    resetGenericPuzzle,
    clearGenericPuzzle,
    commitNormalizedState,
    setInputMode,
    setView 
  } = useCube();
  const { success, info } = useNotification();

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];
  const is3x3 = selectedPuzzle === '3x3';

  // Eraser mode toggle (when true, clicking a sticker clears it back to null)
  const [isEraserActive, setIsEraserActive] = useState<boolean>(false);

  // Highlight incomplete stickers toggle
  const [highlightIncomplete, setHighlightIncomplete] = useState<boolean>(false);

  // Incomplete validation warning toast
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Undo history stack
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Count stickers per color and total filled
  const colorCounts: Record<string, number> = {};
  for (const color of puzzleDef.colorSet) {
    colorCounts[color] = 0;
  }

  let totalFilled = 0;
  let unpaintedCount = 0;

  if (is3x3) {
    const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (const face of faces) {
      for (const sticker of cubeState[face]) {
        if (sticker && sticker in colorCounts) {
          colorCounts[sticker] += 1;
          totalFilled++;
        } else {
          unpaintedCount++;
        }
      }
    }
  } else {
    for (const face of puzzleDef.faceNames) {
      const stickers = genericPuzzleState[face.id] || [];
      for (let i = 0; i < puzzleDef.stickersPerFace; i++) {
        const sticker = stickers[i];
        if (sticker && sticker in colorCounts) {
          colorCounts[sticker] += 1;
          totalFilled++;
        } else {
          unpaintedCount++;
        }
      }
    }
  }

  const targetPerColor = Math.round(puzzleDef.totalStickers / puzzleDef.colorSet.length);
  const isFullyPainted = unpaintedCount === 0;

  // Apply paint or erase to a 3x3 sticker
  const handle3x3StickerClick = useCallback((face: FaceId, index: number) => {
    // Preserve center stickers in 3x3
    if (index === 4) return;

    const prevColor = cubeState[face][index];
    const newColor: CubeColor | null = isEraserActive ? null : selectedColor;

    if (prevColor === newColor) return;

    setUndoStack(prev => [...prev, { faceId: face, index, prevColor, newColor }]);
    setStickerColor(face, index, newColor);
    setValidationWarning(null);
  }, [cubeState, isEraserActive, selectedColor, setStickerColor, setUndoStack, setValidationWarning]);

  // Apply paint or erase to a generic puzzle sticker
  const handleGenericStickerClick = useCallback((faceId: string, index: number) => {
    const currentFace = genericPuzzleState[faceId] || [];
    const prevColor = currentFace[index] ?? null;
    const newColor: CubeColor | null = isEraserActive ? null : selectedColor;

    if (prevColor === newColor) return;

    setUndoStack(prev => [...prev, { faceId, index, prevColor, newColor }]);
    setGenericStickerColor(faceId, index, newColor);
    setValidationWarning(null);
  }, [genericPuzzleState, isEraserActive, selectedColor, setGenericStickerColor, setUndoStack, setValidationWarning]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));

    if (is3x3) {
      setStickerColor(lastAction.faceId as FaceId, lastAction.index, lastAction.prevColor);
    } else {
      setGenericStickerColor(lastAction.faceId, lastAction.index, lastAction.prevColor);
    }
  }, [undoStack, is3x3, setStickerColor, setGenericStickerColor, setUndoStack]);

  // Keyboard shortcut listener (Ctrl+Z / Cmd+Z for undo, number/color keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Quick palette hotkeys: W, Y, R, O, B, G, E
      const key = e.key.toLowerCase();
      if (key === 'e') {
        setIsEraserActive(prev => !prev);
      } else if (key === 'w' && puzzleDef.colorSet.includes('white')) {
        setSelectedColor('white');
        setIsEraserActive(false);
      } else if (key === 'y' && puzzleDef.colorSet.includes('yellow')) {
        setSelectedColor('yellow');
        setIsEraserActive(false);
      } else if (key === 'g' && puzzleDef.colorSet.includes('green')) {
        setSelectedColor('green');
        setIsEraserActive(false);
      } else if (key === 'b' && puzzleDef.colorSet.includes('blue')) {
        setSelectedColor('blue');
        setIsEraserActive(false);
      } else if (key === 'r' && puzzleDef.colorSet.includes('red')) {
        setSelectedColor('red');
        setIsEraserActive(false);
      } else if (key === 'o' && puzzleDef.colorSet.includes('orange')) {
        setSelectedColor('orange');
        setIsEraserActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, puzzleDef.colorSet, setSelectedColor]);

  // Reset entire puzzle to solved
  const handleResetSolved = () => {
    setUndoStack([]);
    setValidationWarning(null);
    if (is3x3) {
      resetToSolved();
    } else {
      resetGenericPuzzle();
    }
    success('Puzzle reset to solved state.', 'Reset Solved');
  };

  // Clear entire cube to empty stickers
  const handleClearAll = () => {
    setUndoStack([]);
    setValidationWarning(null);
    if (is3x3) {
      clearCube(true);
    } else {
      clearGenericPuzzle();
    }
    info('Cleared all stickers for fresh manual coloring.', 'Palette Cleared');
  };

  // Validate Cube button handler
  const handleValidateCube = () => {
    if (!isFullyPainted) {
      setHighlightIncomplete(true);
      setValidationWarning(
        `Cannot validate: ${unpaintedCount} sticker${unpaintedCount > 1 ? 's are' : ' is'} still unpainted. Please color every sticker.`
      );
      return;
    }

    setValidationWarning(null);

    // 1. Parse through input-specific manual parser to produce NormalizedPuzzleState
    const normalized = parseManualInput(
      selectedPuzzle, 
      is3x3 ? cubeState : genericPuzzleState
    );

    // 2. Commit normalized state to context
    commitNormalizedState(normalized);
    setInputMode('manual');
    success('Stickers captured! Checking physical parity...', 'Validation');

    // 3. Proceed to Validation view
    setView('validate');
  };

  // ==========================================
  // 1. RENDER 2×2 / 3×3 / 4×4 SQUARE GRIDS
  // ==========================================
  const renderSquareFace = (faceId: string, label: string, size: number) => {
    const isHighlighted = activeFace === faceId;
    const stickers = is3x3 
      ? cubeState[faceId as FaceId] 
      : (genericPuzzleState[faceId] || Array(size * size).fill(null));

    const gridCols = size === 2 ? 'grid-cols-2' : size === 4 ? 'grid-cols-4' : 'grid-cols-3';

    return (
      <div 
        onClick={() => setActiveFace(faceId as FaceId)}
        className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
          isHighlighted 
            ? 'bg-slate-900 border-2 border-cyan-500 shadow-lg shadow-cyan-500/10' 
            : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1 mb-1.5">
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">Face {faceId}</span>
        </div>

        <div className={`grid ${gridCols} gap-1.5 aspect-square ${size === 4 ? 'w-36 sm:w-40' : 'w-28 sm:w-32'}`}>
          {stickers.map((color: CubeColor | null, idx: number) => {
            const isCenter = is3x3 && idx === 4;
            const isEmpty = color === null;
            const colorDef = color ? CUBE_COLORS[color] : null;

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (is3x3) {
                    handle3x3StickerClick(faceId as FaceId, idx);
                  } else {
                    handleGenericStickerClick(faceId, idx);
                  }
                }}
                title={isCenter ? 'Fixed Center' : `Sticker #${idx + 1}`}
                className={`w-full h-full rounded-md border transition-all flex items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                  isCenter ? 'ring-1 ring-cyan-400/40 cursor-default' : ''
                } ${
                  isEmpty && highlightIncomplete 
                    ? 'animate-pulse ring-2 ring-amber-400 bg-amber-500/20 border-amber-400' 
                    : ''
                }`}
                style={{
                  backgroundColor: colorDef ? colorDef.hex : '#1e293b',
                  borderColor: colorDef ? colorDef.borderHex : '#475569',
                  color: colorDef ? colorDef.textColor : '#94a3b8',
                }}
              >
                {isCenter ? '●' : isEmpty ? '?' : idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ==========================================
  // 2. RENDER PYRAMINX TRIANGULAR FACE (SVG)
  // ==========================================
  const renderPyraminxFace = (faceId: string, label: string) => {
    const stickers = genericPuzzleState[faceId] || Array(9).fill(null);

    // 9 equilateral triangles arranged in 3 tiers:
    // Tier 0: 1 apex triangle
    // Tier 1: 3 middle triangles
    // Tier 2: 5 base triangles
    const trianglePolygons = [
      // 0: Apex upward
      { points: '100,10 70,62 130,62', textX: 100, textY: 45 },
      // 1: Tier 1 left upward
      { points: '70,62 40,114 100,114', textX: 70, textY: 97 },
      // 2: Tier 1 center inverted
      { points: '100,114 70,62 130,62', textX: 100, textY: 79 },
      // 3: Tier 1 right upward
      { points: '130,62 100,114 160,114', textX: 130, textY: 97 },
      // 4: Tier 2 left upward
      { points: '40,114 10,166 70,166', textX: 40, textY: 149 },
      // 5: Tier 2 inverted
      { points: '70,166 40,114 100,114', textX: 70, textY: 131 },
      // 6: Tier 2 center upward
      { points: '100,114 70,166 130,166', textX: 100, textY: 149 },
      // 7: Tier 2 inverted
      { points: '130,166 100,114 160,114', textX: 130, textY: 131 },
      // 8: Tier 2 right upward
      { points: '160,114 130,166 190,166', textX: 160, textY: 149 },
    ];

    return (
      <div 
        key={faceId} 
        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col items-center"
      >
        <div className="flex items-center justify-between text-xs font-bold text-white w-full mb-2 px-1">
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">Face {faceId}</span>
        </div>

        <svg viewBox="0 0 200 176" className="w-44 h-40 filter drop-shadow">
          {trianglePolygons.map((poly, idx) => {
            const color = stickers[idx];
            const isEmpty = color === null;
            const colorDef = color ? CUBE_COLORS[color] : null;

            return (
              <g 
                key={idx}
                onClick={() => handleGenericStickerClick(faceId, idx)}
                className="cursor-pointer transition-transform hover:opacity-90"
              >
                <polygon
                  points={poly.points}
                  fill={colorDef ? colorDef.hex : '#1e293b'}
                  stroke={isEmpty && highlightIncomplete ? '#f59e0b' : colorDef ? colorDef.borderHex : '#475569'}
                  strokeWidth={isEmpty && highlightIncomplete ? 3 : 2}
                  strokeLinejoin="round"
                />
                <text
                  x={poly.textX}
                  y={poly.textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill={colorDef ? colorDef.textColor : '#94a3b8'}
                  className="pointer-events-none select-none"
                >
                  {isEmpty ? '?' : idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // ==========================================
  // 3. RENDER SKEWB CORNER-TURNING FACE (SVG)
  // ==========================================
  const renderSkewbFace = (faceId: string, label: string) => {
    const stickers = genericPuzzleState[faceId] || Array(5).fill(null);

    // 5 stickers in a square: 1 center diamond + 4 corner triangles
    const skewbPolygons = [
      // 0: Center Diamond
      { points: '70,10 130,70 70,130 10,70', textX: 70, textY: 70 },
      // 1: Top-Left Corner
      { points: '10,10 70,10 10,70', textX: 28, textY: 28 },
      // 2: Top-Right Corner
      { points: '70,10 130,10 130,70', textX: 112, textY: 28 },
      // 3: Bottom-Right Corner
      { points: '130,70 130,130 70,130', textX: 112, textY: 112 },
      // 4: Bottom-Left Corner
      { points: '10,70 70,130 10,130', textX: 28, textY: 112 },
    ];

    return (
      <div 
        key={faceId} 
        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col items-center"
      >
        <div className="flex items-center justify-between text-xs font-bold text-white w-full mb-2 px-1">
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">Face {faceId}</span>
        </div>

        <svg viewBox="0 0 140 140" className="w-36 h-36 filter drop-shadow">
          {skewbPolygons.map((poly, idx) => {
            const color = stickers[idx];
            const isEmpty = color === null;
            const colorDef = color ? CUBE_COLORS[color] : null;

            return (
              <g 
                key={idx}
                onClick={() => handleGenericStickerClick(faceId, idx)}
                className="cursor-pointer transition-transform hover:opacity-90"
              >
                <polygon
                  points={poly.points}
                  fill={colorDef ? colorDef.hex : '#1e293b'}
                  stroke={isEmpty && highlightIncomplete ? '#f59e0b' : colorDef ? colorDef.borderHex : '#475569'}
                  strokeWidth={isEmpty && highlightIncomplete ? 3 : 2}
                  strokeLinejoin="round"
                />
                <text
                  x={poly.textX}
                  y={poly.textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill={colorDef ? colorDef.textColor : '#94a3b8'}
                  className="pointer-events-none select-none"
                >
                  {isEmpty ? '?' : idx === 0 ? 'C' : idx}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // ==========================================
  // 4. RENDER MEGAMINX PENTAGONAL FACE (SVG)
  // ==========================================
  const renderMegaminxFace = (faceId: string, label: string) => {
    const stickers = genericPuzzleState[faceId] || Array(11).fill(null);

    // Center pentagon + 10 outer wedge/corner polygons
    const cx = 80;
    const cy = 80;
    const rIn = 28;
    const rOut = 68;

    // Generate center regular pentagon vertices
    const centerPts: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      centerPts.push([cx + rIn * Math.cos(angle), cy + rIn * Math.sin(angle)]);
    }
    const centerPointsStr = centerPts.map(p => `${Math.round(p[0])},${Math.round(p[1])}`).join(' ');

    // Generate outer 10 star points
    const outerPolys = [];
    for (let i = 0; i < 10; i++) {
      const a1 = (i * 2 * Math.PI) / 10 - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / 10 - Math.PI / 2;
      const p1 = `${Math.round(cx + rOut * Math.cos(a1))},${Math.round(cy + rOut * Math.sin(a1))}`;
      const p2 = `${Math.round(cx + rOut * Math.cos(a2))},${Math.round(cy + rOut * Math.sin(a2))}`;
      const inP = `${Math.round(cx + rIn * Math.cos((a1 + a2) / 2))},${Math.round(cy + rIn * Math.sin((a1 + a2) / 2))}`;
      const midAngle = (a1 + a2) / 2;
      outerPolys.push({
        points: `${p1} ${p2} ${inP}`,
        textX: cx + (rOut * 0.7) * Math.cos(midAngle),
        textY: cy + (rOut * 0.7) * Math.sin(midAngle),
      });
    }

    return (
      <div 
        key={faceId} 
        className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col items-center"
      >
        <div className="flex items-center justify-between text-xs font-bold text-white w-full mb-1.5 px-1">
          <span className="truncate">{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">F{faceId}</span>
        </div>

        <svg viewBox="0 0 160 160" className="w-36 h-36 filter drop-shadow">
          {/* Central Pentagon (Sticker 0) */}
          {(() => {
            const color = stickers[0];
            const isEmpty = color === null;
            const colorDef = color ? CUBE_COLORS[color] : null;
            return (
              <g onClick={() => handleGenericStickerClick(faceId, 0)} className="cursor-pointer">
                <polygon
                  points={centerPointsStr}
                  fill={colorDef ? colorDef.hex : '#1e293b'}
                  stroke={isEmpty && highlightIncomplete ? '#f59e0b' : colorDef ? colorDef.borderHex : '#475569'}
                  strokeWidth={isEmpty && highlightIncomplete ? 3 : 2}
                  strokeLinejoin="round"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fontWeight="bold"
                  fill={colorDef ? colorDef.textColor : '#94a3b8'}
                  className="pointer-events-none select-none"
                >
                  {isEmpty ? '?' : 'C'}
                </text>
              </g>
            );
          })()}

          {/* Surrounding 10 Star Stickers */}
          {outerPolys.map((poly, idx) => {
            const stickerIdx = idx + 1;
            const color = stickers[stickerIdx];
            const isEmpty = color === null;
            const colorDef = color ? CUBE_COLORS[color] : null;

            return (
              <g 
                key={stickerIdx}
                onClick={() => handleGenericStickerClick(faceId, stickerIdx)}
                className="cursor-pointer transition-transform hover:opacity-90"
              >
                <polygon
                  points={poly.points}
                  fill={colorDef ? colorDef.hex : '#1e293b'}
                  stroke={isEmpty && highlightIncomplete ? '#f59e0b' : colorDef ? colorDef.borderHex : '#475569'}
                  strokeWidth={isEmpty && highlightIncomplete ? 2.5 : 1.5}
                  strokeLinejoin="round"
                />
                <text
                  x={poly.textX}
                  y={poly.textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="8"
                  fontWeight="bold"
                  fill={colorDef ? colorDef.textColor : '#94a3b8'}
                  className="pointer-events-none select-none"
                >
                  {isEmpty ? '?' : stickerIdx}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`Interactive Manual Color Input • ${puzzleDef.name}`}
        subtitle={`Select a color from the palette, then tap stickers to configure all ${puzzleDef.totalStickers} facelets on this ${puzzleDef.dimensionsLabel} ${puzzleDef.geometryType} puzzle.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="select"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                scrambleCube(20);
                success(`Generated random scramble for ${puzzleDef.name}.`, 'Random Scramble');
              }}
              disabled={!puzzleDef.supported}
              title={puzzleDef.supported ? 'Generate legal random scramble' : 'Scramble in development for this geometry'}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Random Scramble</span>
            </button>
            <button
              onClick={handleResetSolved}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Solved</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cube</span>
            </button>
          </div>
        }
      />

      {/* Solver status alert banner if puzzle solver is in active development */}
      {!puzzleDef.supported && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-300 block mb-0.5">
              Solver Engine In Active Development for {puzzleDef.name} ({puzzleDef.geometryType})
            </strong>
            You can interactively paint, validate, and store all {puzzleDef.facesCount} faces and {puzzleDef.totalStickers} stickers. Automated solving algorithms for this puzzle geometry are in active development.
          </div>
        </div>
      )}

      {/* Validation Warning Alert if user tries to validate with unpainted stickers */}
      {validationWarning && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-rose-300 block mb-0.5">Incomplete Configuration</strong>
              <span>{validationWarning}</span>
            </div>
          </div>
          <button
            onClick={() => setValidationWarning(null)}
            className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Palette Toolbar, Tools, Undo & Status Counter */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Color Swatches */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Paint Palette ({puzzleDef.colorSet.length} colors):
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {puzzleDef.colorSet.map((color) => {
                const colorDef = CUBE_COLORS[color] || { label: color, hex: '#ffffff', borderHex: '#cbd5e1' };
                const isSelected = !isEraserActive && selectedColor === color;
                const count = colorCounts[color] || 0;
                const isBalanced = count === targetPerColor;
                const isExcess = count > targetPerColor;

                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setIsEraserActive(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg scale-105 bg-slate-900'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-md border shadow-sm shrink-0"
                      style={{ backgroundColor: colorDef.hex, borderColor: colorDef.borderHex }}
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block capitalize">
                        {colorDef.label}
                      </span>
                      <span className={`text-[10px] font-mono ${
                        isBalanced 
                          ? 'text-emerald-400 font-bold' 
                          : isExcess 
                          ? 'text-rose-400 font-bold' 
                          : 'text-slate-400'
                      }`}>
                        {count}/{targetPerColor}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Eraser Tool */}
              <button
                onClick={() => setIsEraserActive(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                  isEraserActive
                    ? 'border-rose-400 ring-2 ring-rose-400/30 shadow-lg scale-105 bg-rose-950/30 text-rose-300'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-400'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <div className="text-left">
                  <span className="text-xs font-bold block">Eraser</span>
                  <span className="text-[10px] text-slate-500">Unpaint</span>
                </div>
              </button>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo last sticker paint (Ctrl+Z)"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Undo</span>
                {undoStack.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                    {undoStack.length}
                  </span>
                )}
              </button>

              {/* Highlight Incomplete Toggle */}
              <button
                onClick={() => setHighlightIncomplete(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  highlightIncomplete 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Highlight Empty ({unpaintedCount})</span>
              </button>
            </div>
          </div>

          {/* Stickers Painted Progress & Validate Button */}
          <div className="flex items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Stickers Filled</span>
              <span className="text-lg font-extrabold text-white">
                {totalFilled} <span className="text-slate-500 font-normal">/ {puzzleDef.totalStickers}</span>
              </span>
              <span className={`text-[10px] block font-semibold ${
                isFullyPainted ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isFullyPainted ? 'All Stickers Complete' : `${unpaintedCount} remaining to paint`}
              </span>
            </div>

            <button
              onClick={handleValidateCube}
              className={`py-3.5 px-6 rounded-2xl font-bold text-xs shadow-xl transition-all cursor-pointer flex items-center gap-2 ${
                isFullyPainted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40'
              }`}
            >
              {isFullyPainted ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Validate Cube</span>
            </button>
          </div>
        </div>

        {/* Linear Completion Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isFullyPainted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${Math.round((totalFilled / puzzleDef.totalStickers) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Unfolded Face Net Layout */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>{puzzleDef.name} Interactive Face Layout</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isEraserActive ? (
                  <span className="text-rose-400 font-semibold">Eraser Active: Click any sticker to unpaint.</span>
                ) : (
                  <span>Click stickers to paint with <strong>{selectedColor}</strong>.</span>
                )}
              </p>
            </div>

            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {puzzleDef.facesCount} Faces • {puzzleDef.geometryType}
            </span>
          </div>

          {/* 1. Standard 3×3 Rubik's Cube Cross Layout */}
          {selectedPuzzle === '3x3' && (
            <div className="flex flex-col items-center gap-2 py-4 overflow-x-auto">
              <div className="flex justify-center">
                {renderSquareFace('U', 'Up (White)', 3)}
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {renderSquareFace('L', 'Left (Orange)', 3)}
                {renderSquareFace('F', 'Front (Green)', 3)}
                {renderSquareFace('R', 'Right (Red)', 3)}
                {renderSquareFace('B', 'Back (Blue)', 3)}
              </div>
              <div className="flex justify-center">
                {renderSquareFace('D', 'Down (Yellow)', 3)}
              </div>
            </div>
          )}

          {/* 2. 2×2 Pocket Cube Cross Layout */}
          {selectedPuzzle === '2x2' && (
            <div className="flex flex-col items-center gap-2 py-4 overflow-x-auto">
              <div className="flex justify-center">
                {renderSquareFace('U', 'Up (White)', 2)}
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {renderSquareFace('L', 'Left (Orange)', 2)}
                {renderSquareFace('F', 'Front (Green)', 2)}
                {renderSquareFace('R', 'Right (Red)', 2)}
                {renderSquareFace('B', 'Back (Blue)', 2)}
              </div>
              <div className="flex justify-center">
                {renderSquareFace('D', 'Down (Yellow)', 2)}
              </div>
            </div>
          )}

          {/* 3. 4×4 Rubik's Revenge Cross Layout */}
          {selectedPuzzle === '4x4' && (
            <div className="flex flex-col items-center gap-2 py-4 overflow-x-auto">
              <div className="flex justify-center">
                {renderSquareFace('U', 'Up (White)', 4)}
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {renderSquareFace('L', 'Left (Orange)', 4)}
                {renderSquareFace('F', 'Front (Green)', 4)}
                {renderSquareFace('R', 'Right (Red)', 4)}
                {renderSquareFace('B', 'Back (Blue)', 4)}
              </div>
              <div className="flex justify-center">
                {renderSquareFace('D', 'Down (Yellow)', 4)}
              </div>
            </div>
          )}

          {/* 4. Pyraminx Tetrahedral Face Net */}
          {selectedPuzzle === 'pyraminx' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              {puzzleDef.faceNames.map(f => renderPyraminxFace(f.id, f.name))}
            </div>
          )}

          {/* 5. Skewb Corner-Turning Face Net */}
          {selectedPuzzle === 'skewb' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {puzzleDef.faceNames.map(f => renderSkewbFace(f.id, f.name))}
            </div>
          )}

          {/* 6. Megaminx Dodecahedral Face Net */}
          {selectedPuzzle === 'megaminx' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 py-2">
              {puzzleDef.faceNames.map(f => renderMegaminxFace(f.id, f.name))}
            </div>
          )}
        </div>

        {/* Right Column: Live 3D Model & Real-time Synchronization */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Live 3D Cube Preview</span>
              </h3>
              <span className="text-[10px] text-slate-400 bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Real-Time Updates
              </span>
            </div>

            <div className="h-[340px] w-full rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden relative">
              {is3x3 ? (
                <RubiksCube3D
                  cubeState={cubeState}
                  onStickerClick={handle3x3StickerClick}
                  interactive={true}
                  autoRotate={false}
                  highlightFace={activeFace as StandardFaceId}
                />
              ) : (
                <PuzzlePreview3D 
                  puzzleId={selectedPuzzle} 
                  puzzleState={genericPuzzleState}
                  autoRotate={true} 
                  className="w-full h-full" 
                />
              )}

              {is3x3 && (
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-[11px] text-slate-300 pointer-events-none flex items-center gap-1.5 shadow">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Tip: You can also tap stickers directly on the 3D cube!</span>
                </div>
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

            {/* Keyboard Shortcuts Card */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Keyboard Shortcuts:</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Ctrl+Z</kbd> Undo paint</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">E</kbd> Toggle Eraser</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">W</kbd> White</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Y</kbd> Yellow</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">G</kbd> Green</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">B</kbd> Blue</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">R</kbd> Red</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">O</kbd> Orange</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInputView;
