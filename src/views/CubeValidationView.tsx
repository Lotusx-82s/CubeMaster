import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight, 
  RotateCcw, 
  Edit3, 
  Sparkles,
  Info,
  Layers
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import type { CubeColor, ValidationIssue } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import PageHeader from '../components/common/PageHeader';
import { parseMoveToStep } from '../services/solvers/rubiks3x3';

export const CubeValidationView: React.FC = () => {
  const { 
    selectedPuzzle,
    setSelectedPuzzle,
    cubeState, 
    runValidation, 
    validationResult, 
    resetToSolved, 
    setView,
    loadSolution,
    scrambleMoves,
    genericPuzzleState
  } = useCube();

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];
  const is3x3 = selectedPuzzle === '3x3';

  useEffect(() => {
    if (is3x3) {
      runValidation();
    }
  }, [is3x3, runValidation]);

  const paletteColors: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
  const isValid = is3x3 ? (validationResult?.isValid ?? false) : false;
  const issues = is3x3 ? (validationResult?.issues ?? []) : [];
  const colorCounts = validationResult?.colorCounts ?? {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  const handleProceedToSolution = () => {
    if (!is3x3) return;

    if (scrambleMoves && scrambleMoves.length > 0) {
      const solution = [...scrambleMoves].reverse().map(m => {
        if (m.includes("'")) return m.replace("'", "");
        if (m.includes("2")) return m;
        return `${m}'`;
      });
      loadSolution(solution.map(parseMoveToStep));
    } else {
      loadSolution([]);
    }
    setView('solution');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`Integrity Validation • ${puzzleDef.name}`}
        subtitle={`Every puzzle must satisfy geometric invariants and color distribution parity across all ${puzzleDef.facesCount} faces.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="manual"
        actions={
          is3x3 ? (
            <button
              onClick={() => runValidation()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Re-run Validation
            </button>
          ) : undefined
        }
      />

      {/* Non-3x3 Notice Banner */}
      {!puzzleDef.supported ? (
        <div className="p-8 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">
                Solver Engine In Active Development for {puzzleDef.name}
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                The {puzzleDef.dimensionsLabel} ({puzzleDef.geometryType}) puzzle requires its dedicated <strong>{puzzleDef.engineName}</strong> ({puzzleDef.algorithmSupport}). Rather than generating an incorrect or hardcoded solution, automated solving for this puzzle is currently in active development.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPuzzle('3x3');
              setView('solution');
            }}
            className="py-3.5 px-6 rounded-2xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try 3×3 Rubik's Solver</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* 3x3 Validation Status Banner */
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
                <h3 className="text-2xl font-extrabold text-white">
                  {isValid ? '3×3 Cube State Validated Successfully!' : 'Validation Issues Detected'}
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">
                  {isValid
                    ? 'All 54 stickers, 6 centers, and edge parity checks passed without conflicts. Your cube state is physically valid and ready for the 3D solving engine.'
                    : `Found ${issues.length} issue${issues.length > 1 ? 's' : ''} that must be resolved before calculating an optimal solution.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isValid ? (
                <button
                  onClick={handleProceedToSolution}
                  className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch 3D Solution</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setView('manual')}
                  className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Fix in Manual Painter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Diagnostics breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Color Distribution Checklist for 3x3 */}
          {is3x3 ? (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Color Sticker Distribution</span>
                </h4>
                <span className="text-xs text-slate-400">Target: Exactly 9 of each color</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paletteColors.map((color) => {
                  const colorDef = CUBE_COLORS[color];
                  const count = colorCounts[color] || 0;
                  const isExact = count === 9;

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
                            style={{ backgroundColor: colorDef.hex, borderColor: colorDef.borderHex }}
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
                            isExact ? 'bg-emerald-400' : count > 9 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, (count / 9) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Count: <strong className="text-white">{count}</strong></span>
                        <span>{isExact ? 'Exact' : count > 9 ? `+${count - 9} extra` : `${9 - count} missing`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Non-3x3 Puzzle Specs Card */
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Puzzle Geometric Configuration</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Puzzle Name</span>
                  <span className="text-white font-bold">{puzzleDef.name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Dimensions</span>
                  <span className="text-cyan-400 font-bold">{puzzleDef.dimensionsLabel}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Faces & Facelets</span>
                  <span className="text-white font-bold">{puzzleDef.facesCount} Faces ({puzzleDef.totalStickers} stickers)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Compatible Engine</span>
                  <span className="text-amber-400 font-bold">{puzzleDef.engineName}</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 leading-relaxed">
                Move notation: {puzzleDef.moveNotation.join(', ')}
              </div>
            </div>
          )}

          {/* Issues List for 3x3 */}
          {issues.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Detected Validation Conflicts ({issues.length})</span>
              </h4>

              <div className="space-y-3">
                {issues.map((issue: ValidationIssue, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3"
                  >
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-200">
                        {issue.title}
                      </div>
                      <p className="text-xs text-rose-300/80 mt-0.5">
                        {issue.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-200 block mb-0.5">WCA Integrity Rules</strong>
              Only solvable geometric states are routed to solving algorithms. When parity errors occur, our engine pinpoints identical edges, duplicate centers, or count mismatches.
            </div>
          </div>
        </div>

        {/* Right Column: 3D Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">3D Geometric Model</h4>
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
                <span>Reset Solved State</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeValidationView;
