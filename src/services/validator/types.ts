import type { PuzzleTypeId } from '../../types/cube.ts';

export type ValidationCategory =
  | 'MISSING_STICKERS'
  | 'INCORRECT_COLOR_COUNT'
  | 'INVALID_COLOR_ARRANGEMENT'
  | 'IMPOSSIBLE_PUZZLE_STATE'
  | 'INCOMPLETE_SCANNING'
  | 'UNSUPPORTED_CONFIGURATION';

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: ValidationCategory;
  title: string;
  message: string;
  face?: string;
  stickerIndex?: number;
  pieceDescription?: string;
}

export interface ValidationResult {
  isValid: boolean;
  puzzleId: PuzzleTypeId;
  issues: ValidationIssue[];
  colorCounts: Record<string, number>;
  expectedCountPerColor: number;
  missingFaces?: string[];
  completedFaceCount?: number;
  totalFaceCount?: number;
  summary: string;
}
