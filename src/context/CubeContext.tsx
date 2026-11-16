import React, { useState, useCallback, useMemo } from 'react';
import type { 
  CubeColor, 
  CubeState3x3, 
  FaceId, 
  InputMode, 
  PuzzleTypeId, 
  SolutionStep, 
  ValidationResult 
} from '../types/cube';
import type { AppView } from '../types/navigation';
import { 
  applyMove, 
  applyMoves, 
  cloneCubeState,
  createEmptyCubeState, 
  createSolvedCubeState, 
  generateScramble 
} from '../services/cubeState';
import { validatePuzzleState } from '../services/validator';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import { 
  createDefaultSolvedNormalizedState, 
  createEmptyNormalizedState, 
  cubeStateToNormalized, 
  genericStateToNormalized, 
  normalizedToCubeState, 
  normalizedToGenericState,
  cloneNormalizedState
} from '../services/state';
import type { NormalizedPuzzleState } from '../services/state/types';
import { CubeContext } from './cubeContextInstance';
import type { CubeContextType } from './cubeContextInstance';

function createInitialGenericState(puzzleId: PuzzleTypeId): Record<string, (CubeColor | null)[]> {
  const def = PUZZLE_DEFINITIONS.find(p => p.id === puzzleId) || PUZZLE_DEFINITIONS[1];
  const state: Record<string, (CubeColor | null)[]> = {};
  for (const face of def.faceNames) {
    state[face.id] = Array(def.stickersPerFace).fill(face.defaultColor);
  }
  return state;
}

function createEmptyGenericState(puzzleId: PuzzleTypeId): Record<string, (CubeColor | null)[]> {
  const def = PUZZLE_DEFINITIONS.find(p => p.id === puzzleId) || PUZZLE_DEFINITIONS[1];
  const state: Record<string, (CubeColor | null)[]> = {};
  for (const face of def.faceNames) {
    state[face.id] = Array(def.stickersPerFace).fill(null);
  }
  return state;
}

export const CubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setView] = useState<AppView>('home');
  const [selectedPuzzle, setSelectedPuzzleState] = useState<PuzzleTypeId>('3x3');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  
  const [cubeState, setCubeState] = useState<CubeState3x3>(() => createSolvedCubeState());
  const [initialCubeState, setInitialCubeState] = useState<CubeState3x3 | null>(null);
  const [initialGenericState, setInitialGenericState] = useState<Record<string, (CubeColor | null)[]> | null>(null);
  const [selectedColor, setSelectedColor] = useState<CubeColor>('white');
  const [activeFace, setActiveFace] = useState<FaceId>('F');
  
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlayingSolution, setIsPlayingSolution] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000);
  const [scrambleMoves, setScrambleMoves] = useState<string[]>([]);

  const [genericPuzzleState, setGenericPuzzleState] = useState<Record<string, (CubeColor | null)[]>>(() =>
    createInitialGenericState('3x3')
  );

  // Normalized Puzzle State Architecture
  const [normalizedPuzzleState, setNormalizedPuzzleState] = useState<NormalizedPuzzleState>(() =>
    createDefaultSolvedNormalizedState('3x3', 'manual')
  );
  const [initialNormalizedState, setInitialNormalizedState] = useState<NormalizedPuzzleState | null>(null);

  const setSelectedPuzzle = useCallback((puzzle: PuzzleTypeId) => {
    setSelectedPuzzleState(puzzle);
    const nextSolved = createDefaultSolvedNormalizedState(puzzle, inputMode);
    setNormalizedPuzzleState(nextSolved);
    if (puzzle === '3x3') {
      setCubeState(createSolvedCubeState());
    }
    setGenericPuzzleState(createInitialGenericState(puzzle));
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, [inputMode]);

  const commitNormalizedState = useCallback((state: NormalizedPuzzleState) => {
    setNormalizedPuzzleState(state);
    setSelectedPuzzleState(state.puzzleType);
    setInputMode(state.source);
    if (state.puzzleType === '3x3') {
      setCubeState(normalizedToCubeState(state));
    }
    setGenericPuzzleState(normalizedToGenericState(state));
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, []);

  const setGenericStickerColor = useCallback((faceId: string, index: number, color: CubeColor | null) => {
    setGenericPuzzleState(prev => {
      const currentFace = prev[faceId] || [];
      const updated = [...currentFace];
      updated[index] = color;
      const next = {
        ...prev,
        [faceId]: updated,
      };
      setNormalizedPuzzleState(normPrev => 
        genericStateToNormalized(normPrev.puzzleType, next, normPrev.source, normPrev.metadata)
      );
      return next;
    });
    setValidationResult(null);
  }, []);

  const resetGenericPuzzle = useCallback(() => {
    const next = createInitialGenericState(selectedPuzzle);
    setGenericPuzzleState(next);
    setNormalizedPuzzleState(createDefaultSolvedNormalizedState(selectedPuzzle, inputMode));
    setValidationResult(null);
  }, [selectedPuzzle, inputMode]);

  const clearGenericPuzzle = useCallback(() => {
    const next = createEmptyGenericState(selectedPuzzle);
    setGenericPuzzleState(next);
    setNormalizedPuzzleState(createEmptyNormalizedState(selectedPuzzle, false, inputMode));
    setValidationResult(null);
  }, [selectedPuzzle, inputMode]);

  const setStickerColor = useCallback((face: FaceId, index: number, color: CubeColor | null) => {
    setCubeState(prev => {
      const nextFace = [...prev[face]];
      nextFace[index] = color;
      const nextCubeState = {
        ...prev,
        [face]: nextFace,
      };
      setNormalizedPuzzleState(normPrev => 
        cubeStateToNormalized(nextCubeState, normPrev.source, normPrev.metadata)
      );
      return nextCubeState;
    });
    setValidationResult(null);
  }, []);

  const setFaceColors = useCallback((face: FaceId, colors: (CubeColor | null)[]) => {
    setCubeState(prev => {
      const nextCubeState = {
        ...prev,
        [face]: [...colors],
      };
      setNormalizedPuzzleState(normPrev => 
        cubeStateToNormalized(nextCubeState, normPrev.source, normPrev.metadata)
      );
      return nextCubeState;
    });
    setValidationResult(null);
  }, []);

  const resetToSolved = useCallback(() => {
    setCubeState(createSolvedCubeState());
    setGenericPuzzleState(createInitialGenericState(selectedPuzzle));
    setNormalizedPuzzleState(createDefaultSolvedNormalizedState(selectedPuzzle, inputMode));
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, [selectedPuzzle, inputMode]);

  const clearCube = useCallback((preserveCenters = true) => {
    setCubeState(createEmptyCubeState(preserveCenters));
    setNormalizedPuzzleState(createEmptyNormalizedState('3x3', preserveCenters, inputMode));
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, [inputMode]);

  const scrambleCube = useCallback((length = 20) => {
    const moves = generateScramble(length);
    setScrambleMoves(moves);
    setCubeState(prev => {
      const nextState = applyMoves(prev, moves);
      setNormalizedPuzzleState(cubeStateToNormalized(nextState, 'manual', { scrambleMoves: moves }));
      return nextState;
    });
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
    return moves;
  }, []);

  const applySingleMove = useCallback((move: string) => {
    setCubeState(prev => {
      const next = applyMove(prev, move);
      setNormalizedPuzzleState(cubeStateToNormalized(next, 'manual'));
      return next;
    });
  }, []);

  const runValidation = useCallback((): ValidationResult => {
    // Validate through the unified engine using normalizedPuzzleState
    const result = validatePuzzleState(normalizedPuzzleState);
    setValidationResult(result);
    return result;
  }, [normalizedPuzzleState]);

  const loadSolution = useCallback((
    steps: SolutionStep[], 
    initial3x3?: CubeState3x3, 
    initialGeneric?: Record<string, (CubeColor | null)[]>,
    initialNormalized?: NormalizedPuzzleState
  ) => {
    setSolutionSteps(steps);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
    if (initialNormalized) {
      setInitialNormalizedState(cloneNormalizedState(initialNormalized));
    }
    if (initial3x3) {
      setInitialCubeState(cloneCubeState(initial3x3));
      setCubeState(cloneCubeState(initial3x3));
      if (!initialNormalized) {
        setInitialNormalizedState(cubeStateToNormalized(initial3x3));
      }
    }
    if (initialGeneric) {
      setInitialGenericState({ ...initialGeneric });
      setGenericPuzzleState({ ...initialGeneric });
      if (!initialNormalized) {
        setInitialNormalizedState(genericStateToNormalized(selectedPuzzle, initialGeneric));
      }
    }
  }, [selectedPuzzle]);

  const value = useMemo<CubeContextType>(() => ({
    currentView,
    setView,
    selectedPuzzle,
    setSelectedPuzzle,
    inputMode,
    setInputMode,
    cubeState,
    setCubeState,
    setStickerColor,
    setFaceColors,
    selectedColor,
    setSelectedColor,
    activeFace,
    setActiveFace,
    resetToSolved,
    clearCube,
    scrambleCube,
    applySingleMove,
    genericPuzzleState,
    setGenericPuzzleState,
    setGenericStickerColor,
    resetGenericPuzzle,
    clearGenericPuzzle,
    normalizedPuzzleState,
    setNormalizedPuzzleState,
    commitNormalizedState,
    initialNormalizedState,
    validationResult,
    runValidation,
    solutionSteps,
    activeStepIndex,
    setActiveStepIndex,
    isPlayingSolution,
    setIsPlayingSolution,
    playbackSpeed,
    setPlaybackSpeed,
    loadSolution,
    initialCubeState,
    initialGenericState,
    scrambleMoves,
  }), [
    currentView,
    selectedPuzzle,
    setSelectedPuzzle,
    inputMode,
    cubeState,
    selectedColor,
    activeFace,
    resetToSolved,
    clearCube,
    scrambleCube,
    applySingleMove,
    genericPuzzleState,
    setGenericPuzzleState,
    setGenericStickerColor,
    resetGenericPuzzle,
    clearGenericPuzzle,
    normalizedPuzzleState,
    commitNormalizedState,
    initialNormalizedState,
    validationResult,
    runValidation,
    solutionSteps,
    activeStepIndex,
    isPlayingSolution,
    playbackSpeed,
    loadSolution,
    initialCubeState,
    initialGenericState,
    scrambleMoves,
    setStickerColor,
    setFaceColors,
  ]);

  return (
    <CubeContext.Provider value={value}>
      {children}
    </CubeContext.Provider>
  );
};

export default CubeProvider;
