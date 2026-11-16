import type { CubeColor, CubeState3x3, PuzzleTypeId } from '../../types/cube';
import { PUZZLE_DEFINITIONS } from '../puzzles';
import { parseSimulatorUrl } from '../simulatorAdapters';
import type { ColorDetectionResult } from '../cvColorExtractor';
import { createNormalizedPuzzleState, cubeStateToNormalized } from './normalizedState';
import type { GenericFaceletsState, NormalizedPuzzleState } from './types';

export interface CameraScanParserOptions {
  scannedFaces?: string[];
  averageConfidence?: number;
  notes?: string;
}

export interface ManualInputParserOptions {
  notes?: string;
  sourceLabel?: string;
}

export interface UrlImportParserOptions {
  notes?: string;
}

/**
 * Input-Specific Parser 1: Camera / Photo Scanning.
 * Transforms raw camera detection results or uploaded photo samples into NormalizedPuzzleState.
 */
export function parseCameraScanInput(
  puzzleType: PuzzleTypeId,
  scannedFacesData: Record<string, ColorDetectionResult[] | (CubeColor | null)[]>,
  options?: CameraScanParserOptions
): NormalizedPuzzleState {
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType) || PUZZLE_DEFINITIONS[1];
  const facelets: GenericFaceletsState = {};
  let totalConfidence = 0;
  let confidenceCount = 0;
  const capturedFaces: string[] = [];

  for (const face of puzzleDef.faceNames) {
    const rawData = scannedFacesData[face.id];
    if (rawData && rawData.length > 0) {
      capturedFaces.push(face.id);
      facelets[face.id] = rawData.map(item => {
        if (item && typeof item === 'object' && 'color' in item) {
          const det = item as ColorDetectionResult;
          if (typeof det.confidence === 'number') {
            totalConfidence += det.confidence;
            confidenceCount++;
          }
          return det.color;
        }
        return (item as CubeColor) || null;
      });
    } else {
      facelets[face.id] = Array(puzzleDef.stickersPerFace).fill(null);
    }
  }

  const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : (options?.averageConfidence ?? 90);

  return createNormalizedPuzzleState(puzzleType, 'camera', facelets, {
    source: 'camera',
    scannedFaceCount: capturedFaces.length,
    scannedFaces: options?.scannedFaces || capturedFaces,
    averageConfidence: avgConfidence,
    notes: options?.notes || `Camera scan capture (${capturedFaces.length}/${puzzleDef.facesCount} faces)`,
  });
}

/**
 * Input-Specific Parser 2: Manual Color Input.
 * Transforms interactive sticker painter inputs into NormalizedPuzzleState.
 */
export function parseManualInput(
  puzzleType: PuzzleTypeId,
  inputState: CubeState3x3 | GenericFaceletsState,
  options?: ManualInputParserOptions
): NormalizedPuzzleState {
  if (puzzleType === '3x3' && 'U' in inputState && 'R' in inputState && Array.isArray((inputState as CubeState3x3).U)) {
    return cubeStateToNormalized(inputState as CubeState3x3, 'manual', {
      source: 'manual',
      notes: options?.notes || 'Interactive manual palette input',
    });
  }

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType) || PUZZLE_DEFINITIONS[1];
  const facelets: GenericFaceletsState = {};

  for (const face of puzzleDef.faceNames) {
    const stickers = (inputState as GenericFaceletsState)[face.id];
    if (stickers && Array.isArray(stickers)) {
      facelets[face.id] = stickers.slice(0, puzzleDef.stickersPerFace);
    } else {
      facelets[face.id] = Array(puzzleDef.stickersPerFace).fill(null);
    }
  }

  return createNormalizedPuzzleState(puzzleType, 'manual', facelets, {
    source: 'manual',
    notes: options?.notes || `Interactive manual color input for ${puzzleDef.name}`,
  });
}

/**
 * Input-Specific Parser 3: URL Import.
 * Parses external simulator URLs (Alg.cubing.net, CubeDB.net, RubiksCu.be, CubeMaster Native)
 * and extracts the scrambled puzzle configuration into NormalizedPuzzleState.
 */
export function parseUrlInput(
  rawUrlString: string,
  options?: UrlImportParserOptions
): { state: NormalizedPuzzleState | null; success: boolean; error?: string } {
  const result = parseSimulatorUrl(rawUrlString);

  if (!result.success) {
    return {
      state: null,
      success: false,
      error: result.error || 'Failed to parse simulator URL.',
    };
  }

  const puzzleType = result.puzzleType || '3x3';
  let facelets: GenericFaceletsState = {};

  if (result.cubeState3x3) {
    facelets = {
      U: [...result.cubeState3x3.U],
      R: [...result.cubeState3x3.R],
      F: [...result.cubeState3x3.F],
      D: [...result.cubeState3x3.D],
      L: [...result.cubeState3x3.L],
      B: [...result.cubeState3x3.B],
    };
  } else if (result.genericPuzzleState) {
    for (const [k, v] of Object.entries(result.genericPuzzleState)) {
      facelets[k] = [...v];
    }
  } else {
    return {
      state: null,
      success: false,
      error: 'Simulator URL was recognized, but no reconstructable puzzle configuration was produced.',
    };
  }

  const state = createNormalizedPuzzleState(puzzleType, 'url', facelets, {
    source: 'url',
    sourceUrl: rawUrlString,
    simulatorName: result.simulatorName,
    scrambleMoves: result.scrambleMoves || [],
    notes: options?.notes || `Imported via ${result.simulatorName} integration`,
  });

  return {
    state,
    success: true,
  };
}
