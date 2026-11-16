import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  Edit3, 
  Camera,
  Sparkles, 
  Info, 
  Layers,
  Loader2,
  Globe
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import type { FaceId, ValidationCategory, ValidationIssue } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import PageHeader from '../components/common/PageHeader';
import { solvePuzzle } from '../services/solvers';

const CATEGORY_STYLES: Record<ValidationCategory, { label: string; badgeClass: string }> = {
  MISSING_STICKERS: {
    label: 'Missing Stickers',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  INCORRECT_COLOR_COUNT: {
    label: 'Incorrect Color Count',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  INVALID_COLOR_ARRANGEMENT: {
    label: 'Invalid Color Arrangement',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  IMPOSSIBLE_PUZZLE_STATE: {
    label: 'Impossible Puzzle State',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  INCOMPLETE_SCANNING: {
    label: 'Incomplete Scanning',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  UNSUPPORTED_CONFIGURATION: {
    label: 'Unsupported Configuration',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
};

export const CubeValidationView: React.FC = () => {
  const { 
    selectedPuzzle,
    setSelectedPuzzle,
    cubeState, 
    runValidation, 
    validationResult, 
    resetToSolved, 
    setView,
    setActiveFace,
    loadSolution,
    genericPuzzleState,
    normalizedPuzzleState,
    inputMode,
  } = useCube();

  const [isSolving, setIsSolving] = useState(false);
  const [solverError, setSolverError] = useState<string | null>(null);

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];
  const is3x3 = selectedPuzzle === '3x3';

  // Automatically execute validation whenever this view mounts or puzzle state updates
  useEffect(() => {
    runValidation();
  }, [runValidation]);

  const isValid = validationResult?.isValid ?? false;
  const issues = validationResult?.issues ?? [];
  const colorCounts = validationResult?.colorCounts ?? {};
  const targetPerColor = puzzleDef.totalStickers / puzzleDef.colorSet.length;

  const handleProceedToSolution = async () => {
    if (!isValid || isSolving) return;

    setIsSolving(true);
    setSolverError(null);

    try {
      // Dispatch via unified solving engine using normalizedPuzzleState
      const result = await solvePuzzle(normalizedPuzzleState);

      if (result.success) {
        loadSolution(
          result.steps, 
          is3x3 ? cubeState : undefined, 
          !is3x3 ? genericPuzzleState : undefined,
          normalizedPuzzleState
        );
        setView('solution');
      } else {
        setSolverError(result.error || `Failed to calculate a valid solution for ${puzzleDef.name}.`);
      }
    } catch (err: unknown) {
      setSolverError(err instanceof Error ? err.message : 'Unknown solver error occurred during search.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleEditFace = (faceId?: string) => {
    if (faceId && is3x3) {
      setActiveFace(faceId as FaceId);
    }
    setView('manual');
  };

  const handleRescanFace = (faceId?: string) => {
    if (faceId && is3x3) {
      setActiveFace(faceId as FaceId);
    }
    setView('scan');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`Integrity Validation • ${puzzleDef.name}`}
        subtitle={`Every puzzle must satisfy geometric invariants, piece legality, color distribution, and parity constraints across all ${puzzleDef.facesCount} faces.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="manual"
        actions={
          <button
            onClick={() => runValidation()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Re-run Validation</span>
          </button>
        }
      />

      {/* Main Status Banner */}
      <div className={`p-8 rounded-3xl border mb-8 transition-all duration-300 ${
        isValid
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border-emerald-500/40 shadow-2xl shadow-emerald-500/10'
          : 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border-rose-500/40 shadow-2xl shadow-rose-500/10'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isValid
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {isValid ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-extrabold text-white">
                  {isValid ? `${puzzleDef.name} State Validated Successfully!` : 'Validation Issues Detected'}
                </h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {isValid ? 'SOLVABLE STATE' : `${issues.length} ISSUE${issues.length > 1 ? 'S' : ''}`}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                {isValid
                  ? `All ${puzzleDef.totalStickers} stickers, centers, edge/corner pieces, and parity constraints passed without conflicts. Your puzzle is physically solvable.`
                  : validationResult?.summary || `Found ${issues.length} conflict${issues.length > 1 ? 's' : ''} that must be resolved before proceeding.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isValid ? (
              puzzleDef.supported ? (
                <button
                  onClick={handleProceedToSolution}
                  disabled={isSolving}
                  className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isSolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Solving {puzzleDef.name}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Launch 3D Solution</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    Engine in development for {puzzleDef.name}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPuzzle('3x3');
                      setView('solution');
                    }}
                    className="py-3 px-5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Try 3×3 Solver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditFace(issues[0]?.face)}
                  className="py-3.5 px-5 rounded-2xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Colors Manually</span>
                </button>
                <button
                  onClick={() => handleRescanFace(issues[0]?.face)}
                  className="py-3.5 px-5 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Rescan via Camera</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Solver Calculation Error Banner */}
      {solverError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 mb-8">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{solverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Diagnostics breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Unified Architecture Pipeline Metadata Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {inputMode === 'camera' ? (
                  <Camera className="w-5 h-5" />
                ) : inputMode === 'url' ? (
                  <Globe className="w-5 h-5" />
                ) : (
                  <Edit3 className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Normalized State Vector
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {inputMode === 'camera' ? 'Camera Scanner' : inputMode === 'url' ? 'URL Import' : 'Manual Painter'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {inputMode === 'url' && normalizedPuzzleState.metadata.sourceUrl
                    ? `Imported from: ${normalizedPuzzleState.metadata.simulatorName || 'Simulator'} (${normalizedPuzzleState.metadata.scrambleMoves?.length || 0} moves)`
                    : inputMode === 'camera'
                    ? `Captured ${normalizedPuzzleState.metadata.scannedFaceCount || puzzleDef.facesCount} faces with ${normalizedPuzzleState.metadata.averageConfidence || 92}% confidence`
                    : `Interactive palette input • ${puzzleDef.totalStickers} stickers decomposed`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-cyan-400 font-bold">{normalizedPuzzleState.pieces.length}</span>
              <span>Pieces Decomposed</span>
            </div>
          </div>

          {/* Color Distribution Checklist for Selected Puzzle */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Color Sticker Distribution ({puzzleDef.name})</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Target: Exactly {targetPerColor} of each color
              </span>
            </div>

            <div className={`grid gap-3 ${
              puzzleDef.colorSet.length > 6 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
                : 'grid-cols-2 sm:grid-cols-3'
            }`}>
              {puzzleDef.colorSet.map((color) => {
                const colorDef = CUBE_COLORS[color];
                const count = colorCounts[color] || 0;
                const isExact = count === targetPerColor;

                return (
                  <div
                    key={color}
                    className={`p-3 rounded-2xl border transition-all ${
                      isExact
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-md border"
                          style={{ 
                            backgroundColor: colorDef?.hex || '#ffffff', 
                            borderColor: colorDef?.borderHex || '#cccccc' 
                          }}
                        />
                        <span className="text-xs font-bold text-white capitalize">
                          {color}
                        </span>
                      </div>
                      {isExact ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isExact ? 'bg-emerald-400' : count > targetPerColor ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (count / targetPerColor) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Count: <strong className="text-white">{count}</strong> / {targetPerColor}</span>
                      <span>{isExact ? 'Exact' : count > targetPerColor ? `+${count - targetPerColor} extra` : `${targetPerColor - count} missing`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categorized Issues List */}
          {issues.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Validation Conflicts Detected ({issues.length})</span>
                </h4>
                <span className="text-xs text-rose-400 font-semibold">Must resolve before solving</span>
              </div>

              <div className="space-y-3">
                {issues.map((issue: ValidationIssue, idx: number) => {
                  const categoryMeta = issue.category 
                    ? CATEGORY_STYLES[issue.category] 
                    : { label: 'Validation Issue', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-rose-200">
                              {issue.title}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryMeta.badgeClass}`}>
                              {categoryMeta.label}
                            </span>
                            {issue.face && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                Face {issue.face}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-rose-300/80 leading-relaxed">
                            {issue.message}
                          </p>
                        </div>
                      </div>

                      {/* Quick Return to Face Buttons */}
                      {issue.face && (
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleEditFace(issue.face)}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Edit ${issue.face} face in manual color painter`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit {issue.face}</span>
                          </button>
                          <button
                            onClick={() => handleRescanFace(issue.face)}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Rescan ${issue.face} face using camera`}
                          >
                            <Camera className="w-3 h-3 text-cyan-400" />
                            <span>Rescan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Geometric Invariant Guidance Card */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-200 block mb-0.5">Physical Invariant Verification</strong>
              Sticker counts alone do not prove a twisty puzzle is solvable. CubeMaster verifies center uniqueness, edge-pairing integrity, corner orientations (mod 3), edge orientations (mod 2), and permutation parities to prevent impossible states.
            </div>
          </div>
        </div>

        {/* Right Column: 3D Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>3D Geometric Model</span>
              </h4>
              <span className="text-xs text-slate-400">{puzzleDef.dimensionsLabel}</span>
            </div>

            <div className="h-[360px] w-full rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden">
              {is3x3 ? (
                <RubiksCube3D
                  cubeState={cubeState}
                  interactive={false}
                  autoRotate={isValid}
                  autoRotateSpeed={0.8}
                />
              ) : (
                <PuzzlePreview3D 
                  puzzleId={selectedPuzzle} 
                  puzzleState={genericPuzzleState}
                  autoRotate={true} 
                  className="w-full h-full" 
                />
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (is3x3) resetToSolved();
                }}
                disabled={!is3x3}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset to Solved State</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeValidationView;
