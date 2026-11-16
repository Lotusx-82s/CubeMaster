import type { CubeColor, CubeState3x3, PuzzleTypeId } from '../../types/cube';

export type SimulatorErrorCode = 
  | 'INVALID_URL'
  | 'UNSUPPORTED_SIMULATOR'
  | 'NO_CUBE_STATE_FOUND'
  | 'UNSUPPORTED_PUZZLE_TYPE'
  | 'INVALID_CUBE_CONFIGURATION'
  | 'EXTRACTION_FAILURE';

export interface SimulatorParseResult {
  success: boolean;
  simulatorName: string;
  puzzleType?: PuzzleTypeId;
  scrambleMoves?: string[];
  normalizedMovesStr?: string;
  cubeState3x3?: CubeState3x3;
  genericPuzzleState?: Record<string, (CubeColor | null)[]>;
  error?: string;
  errorCode?: SimulatorErrorCode;
  metadata?: {
    rawParam?: string;
    description?: string;
    moveCount?: number;
  };
}

export interface SimulatorAdapter {
  id: string;
  name: string;
  domains: string[];
  description: string;
  exampleUrl: string;
  supportedPuzzles: PuzzleTypeId[];
  matchesUrl(url: URL): boolean;
  parse(url: URL): SimulatorParseResult;
}
