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
  createEmptyCubeState, 
  createSolvedCubeState, 
  generateScramble 
} from '../services/cubeState';
import { validateCubeState3x3, validatePuzzleState } from '../services/validator';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
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
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleTypeId>('3x3');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  
  const [cubeState, setCubeState] = useState<CubeState3x3>(() => createSolvedCubeState());
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

  const setGenericStickerColor = useCallback((faceId: string, index: number, color: CubeColor | null) => {
    setGenericPuzzleState(prev => {
      const currentFace = prev[faceId] || [];
      const updated = [...currentFace];
      updated[index] = color;
      return {
        ...prev,
        [faceId]: updated,
      };
    });
  }, []);

  const resetGenericPuzzle = useCallback(() => {
    setGenericPuzzleState(createInitialGenericState(selectedPuzzle));
  }, [selectedPuzzle]);

  const clearGenericPuzzle = useCallback(() => {
    setGenericPuzzleState(createEmptyGenericState(selectedPuzzle));
  }, [selectedPuzzle]);

  const setStickerColor = useCallback((face: FaceId, index: number, color: CubeColor | null) => {
    setCubeState(prev => {
      const nextFace = [...prev[face]];
      nextFace[index] = color;
      return {
        ...prev,
        [face]: nextFace,
      };
    });
    setValidationResult(null);
  }, []);

  const setFaceColors = useCallback((face: FaceId, colors: (CubeColor | null)[]) => {
    setCubeState(prev => ({
      ...prev,
      [face]: [...colors],
    }));
    setValidationResult(null);
  }, []);

  const resetToSolved = useCallback(() => {
    setCubeState(createSolvedCubeState());
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, []);

  const clearCube = useCallback((preserveCenters = true) => {
    setCubeState(createEmptyCubeState(preserveCenters));
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, []);

  const scrambleCube = useCallback((length = 20) => {
    const moves = generateScramble(length);
    setScrambleMoves(moves);
    setCubeState(prev => applyMoves(prev, moves));
    setValidationResult(null);
    setSolutionSteps([]);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
    return moves;
  }, []);

  const applySingleMove = useCallback((move: string) => {
    setCubeState(prev => applyMove(prev, move));
  }, []);

  const runValidation = useCallback((): ValidationResult => {
    let result: ValidationResult;
    if (selectedPuzzle === '3x3') {
      result = validateCubeState3x3(cubeState);
    } else {
      result = validatePuzzleState(selectedPuzzle, genericPuzzleState);
    }
    setValidationResult(result);
    return result;
  }, [selectedPuzzle, cubeState, genericPuzzleState]);

  const loadSolution = useCallback((steps: SolutionStep[]) => {
    setSolutionSteps(steps);
    setActiveStepIndex(0);
    setIsPlayingSolution(false);
  }, []);

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
    scrambleMoves,
  }), [
    currentView,
    selectedPuzzle,
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
    validationResult,
    runValidation,
    solutionSteps,
    activeStepIndex,
    isPlayingSolution,
    playbackSpeed,
    loadSolution,
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
