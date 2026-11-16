import type { CubeColor, CubeState3x3, PuzzleTypeId } from '../../types/cube.ts';
import { PUZZLE_DEFINITIONS } from '../puzzles.ts';
import { validateCube3x3 } from './cube3x3.ts';
import { validateCube2x2 } from './cube2x2.ts';
import { validateCube4x4 } from './cube4x4.ts';
import { validatePyraminx } from './pyraminx.ts';
import { validateSkewb } from './skewb.ts';
import { validateMegaminx } from './megaminx.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

export * from './types.ts';
export { validateCube3x3 } from './cube3x3.ts';
export { validateCube2x2 } from './cube2x2.ts';
export { validateCube4x4 } from './cube4x4.ts';
export { validatePyraminx } from './pyraminx.ts';
export { validateSkewb } from './skewb.ts';
export { validateMegaminx } from './megaminx.ts';

export interface ValidationOptions {
  scannedFaceIds?: string[];
  totalExpectedFaces?: number;
}

/**
 * Universal Puzzle State Validation Engine.
 * Supports all 6 twisty puzzles: 3×3, 2×2, 4×4, Pyraminx, Skewb, Megaminx.
 * Handles checks across all input vectors: Camera scanning, Manual color input, and URL import.
 */
export function validatePuzzleState(
  puzzleId: PuzzleTypeId,
  state: CubeState3x3 | Record<string, (CubeColor | null)[]>,
  options?: ValidationOptions
): ValidationResult {
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleId) || PUZZLE_DEFINITIONS[1];

  // 1. Incomplete scanning check if scanning metadata is provided
  if (options?.scannedFaceIds) {
    const requiredFaceIds = puzzleDef.faceNames.map(f => f.id);
    const scannedSet = new Set(options.scannedFaceIds);
    const missingFaces = requiredFaceIds.filter(f => !scannedSet.has(f));

    if (missingFaces.length > 0) {
      const missingNames = missingFaces
        .map(id => puzzleDef.faceNames.find(f => f.id === id)?.name || id)
        .join(', ');

      const issues: ValidationIssue[] = [
        {
          type: 'error',
          category: 'INCOMPLETE_SCANNING',
          title: 'Incomplete Puzzle Scanning',
          message: `Only ${scannedSet.size} of ${requiredFaceIds.length} faces have been captured. Missing faces: ${missingNames}. Please capture or upload all faces before proceeding to solve.`,
        },
      ];

      return {
        isValid: false,
        puzzleId,
        issues,
        colorCounts: {},
        expectedCountPerColor: puzzleDef.totalStickers / puzzleDef.colorSet.length,
        missingFaces,
        completedFaceCount: scannedSet.size,
        totalFaceCount: requiredFaceIds.length,
        summary: `Scanning incomplete: ${missingFaces.length} face(s) remaining.`,
      };
    }
  }

  // 2. Dispatch to the puzzle-specific validation engine
  switch (puzzleId) {
    case '3x3':
      return validateCube3x3(state as CubeState3x3);

    case '2x2':
      return validateCube2x2(state as Record<string, (CubeColor | null)[]>);

    case '4x4':
      return validateCube4x4(state as Record<string, (CubeColor | null)[]>);

    case 'pyraminx':
      return validatePyraminx(state as Record<string, (CubeColor | null)[]>);

    case 'skewb':
      return validateSkewb(state as Record<string, (CubeColor | null)[]>);

    case 'megaminx':
      return validateMegaminx(state as Record<string, (CubeColor | null)[]>);

    default:
      return {
        isValid: false,
        puzzleId,
        issues: [
          {
            type: 'error',
            category: 'UNSUPPORTED_CONFIGURATION',
            title: 'Unsupported Puzzle Configuration',
            message: `Puzzle type '${puzzleId}' does not have an active validation profile registered.`,
          },
        ],
        colorCounts: {},
        expectedCountPerColor: 0,
        summary: `Validation engine not available for puzzle '${puzzleId}'.`,
      };
  }
}

/**
 * Backward-compatible 3x3 validator wrapper.
 */
export function validateCubeState3x3(state: CubeState3x3): ValidationResult {
  return validateCube3x3(state);
}
