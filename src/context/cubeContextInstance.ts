import { createContext } from 'react';
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
import type { NormalizedPuzzleState } from '../services/state/types';

export interface CubeContextType {
  currentView: AppView;
  setView: (view: AppView) => void;
  selectedPuzzle: PuzzleTypeId;
  setSelectedPuzzle: (puzzle: PuzzleTypeId) => void;
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  
  cubeState: CubeState3x3;
  setCubeState: React.Dispatch<React.SetStateAction<CubeState3x3>>;
  setStickerColor: (face: FaceId, index: number, color: CubeColor | null) => void;
  setFaceColors: (face: FaceId, colors: (CubeColor | null)[]) => void;
  selectedColor: CubeColor;
  setSelectedColor: (color: CubeColor) => void;
  activeFace: string;
  setActiveFace: (face: string) => void;
  
  resetToSolved: () => void;
  clearCube: (preserveCenters?: boolean) => void;
  scrambleCube: (length?: number) => string[];
  applySingleMove: (move: string) => void;
  
  genericPuzzleState: Record<string, (CubeColor | null)[]>;
  setGenericPuzzleState: React.Dispatch<React.SetStateAction<Record<string, (CubeColor | null)[]>>>;
  setGenericStickerColor: (faceId: string, index: number, color: CubeColor | null) => void;
  resetGenericPuzzle: () => void;
  clearGenericPuzzle: () => void;

  // Unified Normalized State Architecture
  normalizedPuzzleState: NormalizedPuzzleState;
  setNormalizedPuzzleState: React.Dispatch<React.SetStateAction<NormalizedPuzzleState>>;
  commitNormalizedState: (state: NormalizedPuzzleState) => void;
  initialNormalizedState?: NormalizedPuzzleState | null;
  
  validationResult: ValidationResult | null;
  runValidation: () => ValidationResult;
  
  solutionSteps: SolutionStep[];
  activeStepIndex: number;
  setActiveStepIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlayingSolution: boolean;
  setIsPlayingSolution: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  loadSolution: (
    steps: SolutionStep[], 
    initial3x3?: CubeState3x3, 
    initialGeneric?: Record<string, (CubeColor | null)[]>,
    initialNormalized?: NormalizedPuzzleState
  ) => void;
  initialCubeState?: CubeState3x3 | null;
  initialGenericState?: Record<string, (CubeColor | null)[]> | null;
  scrambleMoves: string[];
}

export const CubeContext = createContext<CubeContextType | undefined>(undefined);
