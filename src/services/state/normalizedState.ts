import type { CubeColor, CubeState3x3, FaceId, PuzzleTypeId } from '../../types/cube';
import { FACE_NAMES } from '../../types/cube';
import { PUZZLE_DEFINITIONS } from '../puzzles';
import { decomposePieces, extractCenters, computeStateStats } from './decomposer';
import type { 
  GenericFaceletsState, 
  InputSource, 
  NormalizedPuzzleState, 
  PuzzleSpecificMetadata 
} from './types';

/**
 * Creates a fully validated, normalized puzzle state preserving:
 * - Puzzle type
 * - Sticker colors & facelets
 * - Physical piece identities, slots, and orientations
 * - Center orientation anchors
 * - Quantitative metrics & completion statistics
 * - Input source & provenance metadata
 */
export function createNormalizedPuzzleState(
  puzzleType: PuzzleTypeId,
  source: InputSource,
  facelets: GenericFaceletsState,
  metadata?: Partial<PuzzleSpecificMetadata>
): NormalizedPuzzleState {
  const clonedFacelets: GenericFaceletsState = {};
  for (const [faceId, stickers] of Object.entries(facelets)) {
    clonedFacelets[faceId] = [...stickers];
  }

  const centers = extractCenters(puzzleType, clonedFacelets);
  const pieces = decomposePieces(puzzleType, clonedFacelets);
  const stats = computeStateStats(puzzleType, clonedFacelets);

  return {
    schemaVersion: 1,
    puzzleType,
    source,
    timestamp: Date.now(),
    facelets: clonedFacelets,
    centers,
    pieces,
    stats,
    metadata: {
      source,
      timestamp: Date.now(),
      ...metadata,
    },
  };
}

/**
 * Converts a classic 3x3 CubeState (Record<FaceId, (CubeColor | null)[]>) to a NormalizedPuzzleState.
 */
export function cubeStateToNormalized(
  cubeState: CubeState3x3,
  source: InputSource = 'manual',
  metadata?: Partial<PuzzleSpecificMetadata>
): NormalizedPuzzleState {
  const facelets: GenericFaceletsState = {
    U: [...cubeState.U],
    R: [...cubeState.R],
    F: [...cubeState.F],
    D: [...cubeState.D],
    L: [...cubeState.L],
    B: [...cubeState.B],
  };

  return createNormalizedPuzzleState('3x3', source, facelets, metadata);
}

/**
 * Converts a generic facelet dictionary to a NormalizedPuzzleState.
 */
export function genericStateToNormalized(
  puzzleType: PuzzleTypeId,
  genericState: GenericFaceletsState,
  source: InputSource = 'manual',
  metadata?: Partial<PuzzleSpecificMetadata>
): NormalizedPuzzleState {
  return createNormalizedPuzzleState(puzzleType, source, genericState, metadata);
}

/**
 * Extracts standard CubeState3x3 from a NormalizedPuzzleState.
 */
export function normalizedToCubeState(normalized: NormalizedPuzzleState): CubeState3x3 {
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState3x3> = {};

  for (const face of faces) {
    const stickers = normalized.facelets[face];
    if (stickers && stickers.length >= 9) {
      state[face] = stickers.slice(0, 9);
    } else {
      state[face] = Array(9).fill(FACE_NAMES[face].standardColor);
    }
  }

  return state as CubeState3x3;
}

/**
 * Extracts generic facelet dictionary from a NormalizedPuzzleState.
 */
export function normalizedToGenericState(
  normalized: NormalizedPuzzleState
): Record<string, (CubeColor | null)[]> {
  const result: Record<string, (CubeColor | null)[]> = {};
  for (const [faceId, stickers] of Object.entries(normalized.facelets)) {
    result[faceId] = [...stickers];
  }
  return result;
}

/**
 * Creates a solved NormalizedPuzzleState for any supported puzzle type.
 */
export function createDefaultSolvedNormalizedState(
  puzzleType: PuzzleTypeId = '3x3',
  source: InputSource = 'manual'
): NormalizedPuzzleState {
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType) || PUZZLE_DEFINITIONS[1];
  const facelets: GenericFaceletsState = {};

  for (const face of puzzleDef.faceNames) {
    facelets[face.id] = Array(puzzleDef.stickersPerFace).fill(face.defaultColor);
  }

  return createNormalizedPuzzleState(puzzleType, source, facelets, {
    notes: `Initial solved ${puzzleDef.name} configuration`,
  });
}

/**
 * Creates an empty NormalizedPuzzleState with unpainted stickers.
 */
export function createEmptyNormalizedState(
  puzzleType: PuzzleTypeId = '3x3',
  preserveCenters = true,
  source: InputSource = 'manual'
): NormalizedPuzzleState {
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType) || PUZZLE_DEFINITIONS[1];
  const facelets: GenericFaceletsState = {};

  for (const face of puzzleDef.faceNames) {
    const stickers = Array(puzzleDef.stickersPerFace).fill(null);
    if (preserveCenters && puzzleType === '3x3') {
      stickers[4] = face.defaultColor;
    } else if (preserveCenters && puzzleType === 'skewb') {
      stickers[0] = face.defaultColor;
    }
    facelets[face.id] = stickers;
  }

  return createNormalizedPuzzleState(puzzleType, source, facelets);
}

/**
 * Deep clones a NormalizedPuzzleState immutably.
 */
export function cloneNormalizedState(state: NormalizedPuzzleState): NormalizedPuzzleState {
  const clonedFacelets: GenericFaceletsState = {};
  for (const [k, v] of Object.entries(state.facelets)) {
    clonedFacelets[k] = [...v];
  }

  return {
    ...state,
    facelets: clonedFacelets,
    centers: { ...state.centers },
    pieces: state.pieces.map(p => ({
      ...p,
      stickers: p.stickers.map(s => ({ ...s })),
    })),
    stats: {
      ...state.stats,
      colorDistribution: { ...state.stats.colorDistribution },
    },
    metadata: {
      ...state.metadata,
      scrambleMoves: state.metadata.scrambleMoves ? [...state.metadata.scrambleMoves] : undefined,
      scannedFaces: state.metadata.scannedFaces ? [...state.metadata.scannedFaces] : undefined,
    },
  };
}

/**
 * Verifies whether two NormalizedPuzzleStates are mathematically equivalent
 * in their facelet sticker colors, centers, and piece configurations.
 */
export function areNormalizedStatesEquivalent(
  a: NormalizedPuzzleState,
  b: NormalizedPuzzleState
): boolean {
  if (a.puzzleType !== b.puzzleType) return false;

  const aFaces = Object.keys(a.facelets).sort();
  const bFaces = Object.keys(b.facelets).sort();
  if (aFaces.length !== bFaces.length) return false;

  for (let i = 0; i < aFaces.length; i++) {
    const face = aFaces[i];
    if (face !== bFaces[i]) return false;
    const aStickers = a.facelets[face] || [];
    const bStickers = b.facelets[face] || [];
    if (aStickers.length !== bStickers.length) return false;
    for (let j = 0; j < aStickers.length; j++) {
      if (aStickers[j] !== bStickers[j]) return false;
    }
  }

  return true;
}
