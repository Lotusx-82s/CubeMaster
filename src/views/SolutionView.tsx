import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import PageHeader from '../components/common/PageHeader';
import { isCubeSolved, createSolvedCubeState, applyMoves } from '../services/cubeState';
import { solvePuzzle } from '../services/solvers';
import InteractivePuzzle3D, { type AnimatingMove } from '../components/3d/InteractivePuzzle3D';
import type { CubeColor } from '../types/cube';

type SpeedPreset = 'slow' | 'normal' | 'fast';

const SPEED_CONFIG: Record<SpeedPreset, { label: string; durationMs: number; pauseMs: number }> = {
  slow: { label: 'Slow (0.5x)', durationMs: 650, pauseMs: 90 },
  normal: { label: 'Normal (1x)', durationMs: 320, pauseMs: 40 },
  fast: { label: 'Fast (2x)', durationMs: 150, pauseMs: 15 },
};

function isGenericStateSolved(state: Record<string, (CubeColor | null)[]>): boolean {
  const faces = Object.keys(state);
  if (faces.length === 0) return false;
  for (const face of faces) {
    const stickers = state[face];
    if (!stickers || stickers.length === 0) return false;
    const first = stickers[0];
    if (!first) return false;
    if (stickers.some((s) => s !== first)) return false;
  }
  return true;
}

export const SolutionView: React.FC = () => {
  const { 
    selectedPuzzle,
    setSelectedPuzzle,
    cubeState, 
    setCubeState,
    genericPuzzleState,
    setGenericPuzzleState,
    solutionSteps, 
    activeStepIndex, 
    setActiveStepIndex, 
    isPlayingSolution, 
    setIsPlayingSolution, 
    scrambleCube,
    loadSolution,
    initialCubeState,
    initialGenericState,
  } = useCube();

  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('normal');
  const [animatingMove, setAnimatingMove] = useState<AnimatingMove | null>(null);
  const activeTimelineRef = useRef<HTMLButtonElement>(null);

  const puzzleDef = PUZZLE_DEFINITIONS.find((p) => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];
  const is3x3 = selectedPuzzle === '3x3';
  const totalSteps = solutionSteps.length;

  // Determine whether the current state is mathematically solved
  const isSolved = is3x3
    ? isCubeSolved(cubeState)
    : (activeStepIndex >= totalSteps && totalSteps > 0 && isGenericStateSolved(genericPuzzleState));

  const currentStep = totalSteps > 0 && activeStepIndex < totalSteps ? solutionSteps[activeStepIndex] : null;

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'],
      });
    } catch {
      // fallback
    }
  }, []);

  // Trigger celebration upon entering solved state
  useEffect(() => {
    if (isSolved && totalSteps > 0 && activeStepIndex === totalSteps) {
      triggerCelebration();
    }
  }, [isSolved, totalSteps, activeStepIndex, triggerCelebration]);

  // Ensure initial snapshot is preserved if not already set
  useEffect(() => {
    if (!initialCubeState && is3x3 && cubeState) {
      loadSolution(solutionSteps, cubeState);
    } else if (!initialGenericState && !is3x3 && genericPuzzleState) {
      loadSolution(solutionSteps, undefined, genericPuzzleState);
    }
  }, [initialCubeState, initialGenericState, is3x3, cubeState, genericPuzzleState, loadSolution, solutionSteps]);

  // Auto-scroll timeline to keep active move visible
  useEffect(() => {
    if (activeTimelineRef.current) {
      activeTimelineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeStepIndex]);

  // Execute Next Move with smooth layer rotation
  const handleNextStep = useCallback(() => {
    if (animatingMove !== null || activeStepIndex >= totalSteps) return;

    const step = solutionSteps[activeStepIndex];
    const durationMs = SPEED_CONFIG[speedPreset].durationMs;

    setAnimatingMove({
      move: step.move,
      isReverse: false,
      durationMs,
      startTime: performance.now(),
      onComplete: () => {
        const nextIndex = activeStepIndex + 1;
        if (is3x3 && step.stateSnapshot) {
          setCubeState(step.stateSnapshot);
        } else if (!is3x3 && step.genericSnapshot) {
          setGenericPuzzleState(step.genericSnapshot);
        }
        setActiveStepIndex(nextIndex);
        setAnimatingMove(null);

        if (nextIndex >= totalSteps) {
          setIsPlayingSolution(false);
          triggerCelebration();
        }
      },
    });
  }, [
    animatingMove,
    activeStepIndex,
    totalSteps,
    solutionSteps,
    speedPreset,
    is3x3,
    setCubeState,
    setGenericPuzzleState,
    setActiveStepIndex,
    setIsPlayingSolution,
    triggerCelebration,
  ]);

  // Execute Previous Move in reverse layer rotation
  const handlePrevStep = useCallback(() => {
    if (animatingMove !== null || activeStepIndex <= 0) return;

    const prevStep = solutionSteps[activeStepIndex - 1];
    const durationMs = SPEED_CONFIG[speedPreset].durationMs;

    setAnimatingMove({
      move: prevStep.move,
      isReverse: true,
      durationMs,
      startTime: performance.now(),
      onComplete: () => {
        const prevIndex = activeStepIndex - 1;
        if (prevIndex === 0) {
          if (is3x3 && initialCubeState) setCubeState(initialCubeState);
          if (!is3x3 && initialGenericState) setGenericPuzzleState(initialGenericState);
        } else {
          const targetStep = solutionSteps[prevIndex - 1];
          if (is3x3 && targetStep.stateSnapshot) setCubeState(targetStep.stateSnapshot);
          if (!is3x3 && targetStep.genericSnapshot) setGenericPuzzleState(targetStep.genericSnapshot);
        }
        setActiveStepIndex(prevIndex);
        setAnimatingMove(null);
      },
    });
  }, [
    animatingMove,
    activeStepIndex,
    solutionSteps,
    speedPreset,
    is3x3,
    initialCubeState,
    initialGenericState,
    setCubeState,
    setGenericPuzzleState,
    setActiveStepIndex,
  ]);

  // Restart playback to step 0
  const handleRestart = useCallback(() => {
    setIsPlayingSolution(false);
    setAnimatingMove(null);
    setActiveStepIndex(0);
    if (is3x3 && initialCubeState) setCubeState(initialCubeState);
    if (!is3x3 && initialGenericState) setGenericPuzzleState(initialGenericState);
  }, [
    is3x3,
    initialCubeState,
    initialGenericState,
    setCubeState,
    setGenericPuzzleState,
    setActiveStepIndex,
    setIsPlayingSolution,
  ]);

  // Jump to a specific step in the sequence
  const handleJumpToStep = useCallback((targetIndex: number) => {
    setIsPlayingSolution(false);
    setAnimatingMove(null);
    setActiveStepIndex(targetIndex);

    if (targetIndex === 0) {
      if (is3x3 && initialCubeState) setCubeState(initialCubeState);
      if (!is3x3 && initialGenericState) setGenericPuzzleState(initialGenericState);
    } else {
      const targetStep = solutionSteps[targetIndex - 1];
      if (is3x3 && targetStep?.stateSnapshot) setCubeState(targetStep.stateSnapshot);
      if (!is3x3 && targetStep?.genericSnapshot) setGenericPuzzleState(targetStep.genericSnapshot);
    }
  }, [
    is3x3,
    initialCubeState,
    initialGenericState,
    solutionSteps,
    setCubeState,
    setGenericPuzzleState,
    setActiveStepIndex,
    setIsPlayingSolution,
  ]);

  // Solve Automatically continuous playback
  const handleSolveAutomatically = useCallback(() => {
    if (activeStepIndex >= totalSteps) {
      handleRestart();
      setTimeout(() => setIsPlayingSolution(true), 80);
    } else {
      setIsPlayingSolution(true);
    }
  }, [activeStepIndex, totalSteps, handleRestart, setIsPlayingSolution]);

  // Auto-play loop driven by state transitions
  useEffect(() => {
    if (!isPlayingSolution || animatingMove !== null) return;

    if (activeStepIndex < totalSteps) {
      const timer = setTimeout(() => {
        handleNextStep();
      }, SPEED_CONFIG[speedPreset].pauseMs);
      return () => clearTimeout(timer);
    } else {
      setIsPlayingSolution(false);
    }
  }, [isPlayingSolution, animatingMove, activeStepIndex, totalSteps, speedPreset, handleNextStep, setIsPlayingSolution]);

  // Scramble and Solve Demo (uses Herbert Kociemba Two-Phase engine)
  const handleScrambleAndSolve = async () => {
    if (!is3x3) return;
    setIsPlayingSolution(false);
    setAnimatingMove(null);
    const moves = scrambleCube(16);
    const scrambledState = applyMoves(createSolvedCubeState(), moves);
    const result = await solvePuzzle('3x3', scrambledState);
    if (result.success) {
      loadSolution(result.steps, scrambledState);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <PageHeader
        title={`Interactive 3D Solution Visualizer • ${puzzleDef.name}`}
        subtitle={`Real-time 3D layer animation with Singmaster notation explanations, scrubber timeline, and orbital drag controls.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="validate"
        actions={
          is3x3 ? (
            <button
              onClick={handleScrambleAndSolve}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer flex items-center gap-2 shadow-md hover:border-cyan-500/40"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>New Demo Scramble & Solve</span>
            </button>
          ) : undefined
        }
      />

      {/* Unsupported Puzzle Notice */}
      {!puzzleDef.supported && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border-2 border-amber-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">
                Solver in Development for {puzzleDef.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                The {puzzleDef.geometryType} engine ({puzzleDef.engineName}) is in active development. To prevent inaccurate moves, step-by-step solving is reserved for the upcoming algorithm release.
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

      {/* Solved celebration banner */}
      {isSolved && totalSteps > 0 && activeStepIndex === totalSteps && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white">
                  Puzzle Solved & Mathematically Verified!
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED STATE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Completed in {totalSteps} optimal moves using {puzzleDef.algorithmSupport}. All geometric invariants and facelet arrangements are verified uniform.
              </p>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-2 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Replay Solution</span>
          </button>
        </div>
      )}

      {/* Main 3D Viewport & Side Control Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Animated Canvas with Scrubber */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[460px] sm:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
            <InteractivePuzzle3D
              puzzleId={selectedPuzzle}
              cubeState={cubeState}
              genericPuzzleState={genericPuzzleState}
              animatingMove={animatingMove}
              className="w-full h-full"
            />
          </div>

          {/* Interactive Move Sequence Filmstrip (Scrubber) */}
          {totalSteps > 0 && (
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive Move Sequence</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  Step {activeStepIndex} / {totalSteps} ({Math.max(0, totalSteps - activeStepIndex)} remaining)
                </span>
              </div>

              {/* Scrollable Move Pills */}
              <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-1 scrollbar-thin">
                {/* Step 0 (Start state) */}
                <button
                  onClick={() => handleJumpToStep(0)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeStepIndex === 0
                      ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                  title="Jump to initial scrambled state"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Start</span>
                </button>

                {solutionSteps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isCurrent = activeStepIndex === stepNum;
                  const isPassed = activeStepIndex > stepNum;

                  return (
                    <button
                      key={idx}
                      ref={isCurrent ? activeTimelineRef : undefined}
                      onClick={() => handleJumpToStep(stepNum)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/30 scale-105 z-10'
                          : isPassed
                          ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-950/50'
                          : 'bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title={`Jump to step ${stepNum}: ${step.move}`}
                    >
                      <span className="text-[10px] opacity-60">#{stepNum}</span>
                      <span>{step.move}</span>
                      {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Move Explanation Studio */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Move Instruction Studio</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {totalSteps > 0 ? `Move ${Math.min(activeStepIndex + 1, totalSteps)} of ${totalSteps}` : 'Ready'}
              </span>
            </div>

            {/* Current Move Card */}
            {currentStep ? (
              <div className="space-y-4">
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black font-mono text-3xl shadow-xl shadow-cyan-500/20 shrink-0">
                    {currentStep.move}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {currentStep.description}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {currentStep.explanation}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Solution Progress</span>
                    <span className="font-mono font-bold text-slate-200">
                      {Math.round((activeStepIndex / totalSteps) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${(activeStepIndex / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : isSolved && totalSteps > 0 ? (
              <div className="text-center py-6 space-y-2 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Full Solution Complete!</h4>
                <p className="text-xs text-slate-300">
                  All {totalSteps} moves have been executed in 3D. The puzzle is in its fully verified solved state.
                </p>
              </div>
            ) : totalSteps === 0 ? (
              <div className="text-center py-6 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">No Active Solution Loaded</h4>
                <p className="text-xs text-slate-400">
                  Scramble the puzzle or input stickers in the validation view to calculate a solution.
                </p>
              </div>
            ) : null}

            {/* Playback Controls Toolbar */}
            {totalSteps > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-5">
                {/* Primary Button Controls */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {/* Restart */}
                  <button
                    onClick={handleRestart}
                    title="Restart to Beginning"
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Previous Move */}
                  <button
                    onClick={handlePrevStep}
                    disabled={activeStepIndex === 0 || animatingMove !== null}
                    title="Previous Move"
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-35 transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play / Pause Toggle */}
                  <button
                    onClick={() => {
                      if (isPlayingSolution) {
                        setIsPlayingSolution(false);
                      } else {
                        if (activeStepIndex >= totalSteps) handleRestart();
                        setIsPlayingSolution(true);
                      }
                    }}
                    className="py-3 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isPlayingSolution ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlayingSolution ? 'Pause' : 'Play'}</span>
                  </button>

                  {/* Next Move */}
                  <button
                    onClick={handleNextStep}
                    disabled={activeStepIndex >= totalSteps || animatingMove !== null}
                    title="Next Move"
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-35 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Solve Automatically */}
                  <button
                    onClick={handleSolveAutomatically}
                    className="py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Run all moves continuously to solved state"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto-Solve</span>
                  </button>
                </div>

                {/* Animation Speed Presets */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Animation Speed</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['slow', 'normal', 'fast'] as SpeedPreset[]).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSpeedPreset(preset)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                          speedPreset === preset
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notation Reference Guide */}
          <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-3">
            <h5 className="font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{puzzleDef.name} Notation & Layer Map</span>
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard Singmaster notation: Letters denote clockwise turns (90°). An apostrophe (<span className="text-cyan-300 font-mono font-bold">'</span>) denotes counter-clockwise, and <span className="text-cyan-300 font-mono font-bold">2</span> denotes a 180° half-turn.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {puzzleDef.moveNotation.map((move) => (
                <span
                  key={move}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-xs font-bold"
                >
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
