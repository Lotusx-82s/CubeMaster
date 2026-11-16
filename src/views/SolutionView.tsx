import React, { useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Shuffle, 
  CheckCircle2, 
  Sliders, 
  Compass, 
  BookOpen,
  Trophy,
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import PageHeader from '../components/common/PageHeader';
import { isCubeSolved, createSolvedCubeState, applyMoves } from '../services/cubeState';
import { solvePuzzle } from '../services/solvers';
import type { SolutionStep } from '../types/cube';

export const SolutionView: React.FC = () => {
  const { 
    selectedPuzzle,
    setSelectedPuzzle,
    cubeState, 
    applySingleMove, 
    solutionSteps, 
    activeStepIndex, 
    setActiveStepIndex, 
    isPlayingSolution, 
    setIsPlayingSolution, 
    playbackSpeed, 
    setPlaybackSpeed, 
    scrambleCube,
    loadSolution,
  } = useCube();

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];
  const is3x3 = selectedPuzzle === '3x3';

  const totalSteps = solutionSteps.length;
  const isSolved = is3x3 ? isCubeSolved(cubeState) : (totalSteps > 0 && activeStepIndex >= totalSteps);
  const currentStep = totalSteps > 0 && activeStepIndex < totalSteps ? solutionSteps[activeStepIndex] : null;

  const invertMove = (move: string): string => {
    if (move.includes("'")) return move.replace("'", "");
    if (move.includes("2")) return move;
    return `${move}'`;
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'],
      });
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (isSolved) {
      triggerCelebration();
    }
  }, [isSolved]);

  const handleNextStep = () => {
    if (activeStepIndex < totalSteps) {
      const step = solutionSteps[activeStepIndex];
      if (is3x3) {
        applySingleMove(step.move);
      }
      const nextIndex = activeStepIndex + 1;
      setActiveStepIndex(nextIndex);
      if (nextIndex === totalSteps) {
        setIsPlayingSolution(false);
        triggerCelebration();
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      const prevStep = solutionSteps[activeStepIndex - 1];
      if (is3x3) {
        const inverted = invertMove(prevStep.move);
        applySingleMove(inverted);
      }
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const handleResetPlayback = () => {
    setIsPlayingSolution(false);
    if (is3x3) {
      let currIdx = activeStepIndex;
      while (currIdx > 0) {
        const step = solutionSteps[currIdx - 1];
        applySingleMove(invertMove(step.move));
        currIdx--;
      }
    }
    setActiveStepIndex(0);
  };

  useEffect(() => {
    let interval: any = null;
    if (isPlayingSolution) {
      interval = setInterval(() => {
        if (activeStepIndex < totalSteps) {
          const step = solutionSteps[activeStepIndex];
          if (is3x3) {
            applySingleMove(step.move);
          }
          setActiveStepIndex((prev: number) => {
            const next = prev + 1;
            if (next >= totalSteps) {
              setIsPlayingSolution(false);
              triggerCelebration();
            }
            return next;
          });
        } else {
          setIsPlayingSolution(false);
        }
      }, playbackSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingSolution, is3x3, activeStepIndex, totalSteps, playbackSpeed, solutionSteps, applySingleMove, setActiveStepIndex, setIsPlayingSolution]);

  const handleScrambleAndSolve = async () => {
    if (!is3x3) return;
    setIsPlayingSolution(false);
    const moves = scrambleCube(16);
    const scrambledState = applyMoves(createSolvedCubeState(), moves);
    const result = await solvePuzzle('3x3', scrambledState);
    if (result.success) {
      loadSolution(result.steps);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`Interactive 3D Solution Visualizer • ${puzzleDef.name}`}
        subtitle={`Step through each move with 3D rotations, scrubber controls, and official Singmaster notations.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="validate"
        actions={
          is3x3 ? (
            <button
              onClick={handleScrambleAndSolve}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate Demo Scramble & Solution</span>
            </button>
          ) : undefined
        }
      />

      {/* Unsupported Puzzle Notice */}
      {!puzzleDef.supported && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border-2 border-amber-500/40 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">
                Solver Not Yet Available for {puzzleDef.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                The {puzzleDef.geometryType} solving engine ({puzzleDef.engineName}) is currently in development. To avoid generating false or non-solvable algorithms, this puzzle's step-by-step solver is reserved for the upcoming algorithm release.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPuzzle('3x3');
              handleScrambleAndSolve();
            }}
            className="px-6 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Switch to 3×3 Rubik's Cube Solver</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Solved celebration banner if 3x3 is solved */}
      {is3x3 && isSolved && totalSteps === 0 && (
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/40 shadow-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">
                This Cube is Already Solved!
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                All 6 faces are completely uniform. To practice 3D step-by-step playback, generate a scramble above.
              </p>
            </div>
          </div>

          <button
            onClick={handleScrambleAndSolve}
            className="px-6 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>Scramble to Practice</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Animated Rubik's Cube or Puzzle Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[440px] sm:h-[480px] w-full rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden">
            {is3x3 ? (
              <RubiksCube3D
                cubeState={cubeState}
                interactive={false}
                autoRotate={false}
              />
            ) : (
              <PuzzlePreview3D puzzleId={selectedPuzzle} autoRotate={true} className="w-full h-full" />
            )}
          </div>

          {/* Scrubber / Step Timeline for Solved Moves */}
          {totalSteps > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Solution Timeline</span>
                <span>Step {activeStepIndex} of {totalSteps}</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-thin">
                {solutionSteps.map((step: SolutionStep, idx: number) => {
                  const isCurrent = idx === activeStepIndex;
                  const isPassed = idx < activeStepIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsPlayingSolution(false);
                        if (is3x3) {
                          if (idx > activeStepIndex) {
                            for (let i = activeStepIndex; i < idx; i++) {
                              applySingleMove(solutionSteps[i].move);
                            }
                          } else if (idx < activeStepIndex) {
                            for (let i = activeStepIndex - 1; i >= idx; i--) {
                              applySingleMove(invertMove(solutionSteps[i].move));
                            }
                          }
                        }
                        setActiveStepIndex(idx);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                          : isPassed
                          ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                          : 'bg-slate-950/60 text-slate-500 border border-slate-800/80 hover:text-slate-300'
                      }`}
                    >
                      {step.move}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Step Explanation & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Move Instruction
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {totalSteps > 0 ? `Step ${Math.min(activeStepIndex + 1, totalSteps)} / ${totalSteps}` : 'Ready'}
              </span>
            </div>

            {currentStep ? (
              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cyan-500/20">
                    {currentStep.move}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {currentStep.description}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentStep.explanation}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${(activeStepIndex / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            ) : isSolved ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Solved State Reached!</h4>
                <p className="text-xs text-slate-400">
                  All faces have been restored to their standard solved colors.
                </p>
              </div>
            ) : !is3x3 ? (
              <div className="text-center py-6 space-y-3">
                <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-white">{puzzleDef.name} Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compatible engine: <strong>{puzzleDef.engineName}</strong>.<br />
                  Algorithms: {puzzleDef.algorithmSupport}.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">No Active Solution Loaded</h4>
                <p className="text-xs text-slate-400">
                  Scramble the cube or input stickers to calculate the step-by-step moves.
                </p>
              </div>
            )}

            {totalSteps > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleResetPlayback}
                    title="Reset to Start"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrevStep}
                    disabled={activeStepIndex === 0}
                    title="Previous Step"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlayingSolution(!isPlayingSolution)}
                    className="py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isPlayingSolution ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlayingSolution ? 'Pause' : 'Play Auto'}</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    disabled={activeStepIndex >= totalSteps}
                    title="Next Step"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Speed: {(1000 / playbackSpeed).toFixed(1)}x</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {[1500, 1000, 500].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                          playbackSpeed === speed
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {speed === 1500 ? '0.7x' : speed === 1000 ? '1x' : '2x'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
            <h5 className="font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{puzzleDef.name} Notation Guide</span>
            </h5>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {puzzleDef.moveNotation.map((move) => (
                <span key={move} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-xs font-bold">
                  {move}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionView;
