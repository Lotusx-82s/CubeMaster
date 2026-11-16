import type { CubeColor, CubeState3x3, PuzzleTypeId } from '../../types/cube';

export type InputSource = 'camera' | 'manual' | 'url';

export type PieceType = 'center' | 'edge' | 'corner' | 'tip' | 'wing';

export interface PieceSlot {
  face: string;
  index: number;
  color: CubeColor | null;
}

export interface PieceState {
  id: string; // Slot position identifier, e.g. "UFL", "UF", "center_U", "tip_U"
  type: PieceType;
  stickers: PieceSlot[];
  homeId?: string; // Resolved identity based on colors, e.g. "UFR"
  position: string; // Current physical slot
  orientation: number; // 0: canonical orientation, 1: flipped/twisted CW, 2: twisted CCW
}

export interface PuzzleSpecificMetadata {
  source: InputSource;
  scrambleMoves?: string[];
  sourceUrl?: string;
  simulatorName?: string;
  scannedFaceCount?: number;
  scannedFaces?: string[];
  averageConfidence?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface NormalizedPuzzleState {
  schemaVersion: 1;
  puzzleType: PuzzleTypeId;
  source: InputSource;
  timestamp: number;
  
  // Canonical facelet array representation (faceId -> sticker colors)
  facelets: Record<string, (CubeColor | null)[]>;
  
  // Center sticker colors for orientation reference
  centers: Record<string, CubeColor | null>;
  
  // Physical piece decomposition (positions and orientations)
  pieces: PieceState[];
  
  // Quantitative metrics
  stats: {
    totalStickers: number;
    filledStickers: number;
    colorDistribution: Record<string, number>;
    isComplete: boolean;
  };
  
  // Input vector & puzzle provenance metadata
  metadata: PuzzleSpecificMetadata;
}

export type GenericFaceletsState = Record<string, (CubeColor | null)[]>;
export type AnyPuzzleState = CubeState3x3 | GenericFaceletsState | NormalizedPuzzleState;
