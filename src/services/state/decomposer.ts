import type { CubeColor, PuzzleTypeId } from '../../types/cube';
import { PUZZLE_DEFINITIONS } from '../puzzles';
import type { GenericFaceletsState, PieceSlot, PieceState } from './types';

// Canonical 3x3 slots
const CORNERS_3X3_SLOTS: { id: string; slots: [string, number, string, number, string, number] }[] = [
  { id: 'UFL', slots: ['U', 6, 'F', 0, 'L', 2] },
  { id: 'UFR', slots: ['U', 8, 'R', 0, 'F', 2] },
  { id: 'UBR', slots: ['U', 2, 'B', 0, 'R', 2] },
  { id: 'UBL', slots: ['U', 0, 'L', 0, 'B', 2] },
  { id: 'DFL', slots: ['D', 0, 'L', 8, 'F', 6] },
  { id: 'DFR', slots: ['D', 2, 'F', 8, 'R', 6] },
  { id: 'DBR', slots: ['D', 8, 'R', 8, 'B', 6] },
  { id: 'DBL', slots: ['D', 6, 'B', 8, 'L', 6] },
];

const EDGES_3X3_SLOTS: { id: string; slots: [string, number, string, number]; primaryFace: string }[] = [
  { id: 'UF', slots: ['U', 7, 'F', 1], primaryFace: 'U' },
  { id: 'UR', slots: ['U', 5, 'R', 1], primaryFace: 'U' },
  { id: 'UB', slots: ['U', 1, 'B', 1], primaryFace: 'U' },
  { id: 'UL', slots: ['U', 3, 'L', 1], primaryFace: 'U' },
  { id: 'DF', slots: ['D', 1, 'F', 7], primaryFace: 'D' },
  { id: 'DR', slots: ['D', 5, 'R', 7], primaryFace: 'D' },
  { id: 'DB', slots: ['D', 7, 'B', 7], primaryFace: 'D' },
  { id: 'DL', slots: ['D', 3, 'L', 7], primaryFace: 'D' },
  { id: 'FR', slots: ['F', 5, 'R', 3], primaryFace: 'F' },
  { id: 'FL', slots: ['F', 3, 'L', 5], primaryFace: 'F' },
  { id: 'BR', slots: ['B', 3, 'R', 5], primaryFace: 'B' },
  { id: 'BL', slots: ['B', 5, 'L', 3], primaryFace: 'B' },
];

// Canonical 2x2 slots
const CORNERS_2X2_SLOTS: { id: string; slots: [string, number, string, number, string, number] }[] = [
  { id: 'UFL', slots: ['U', 2, 'F', 0, 'L', 1] },
  { id: 'UFR', slots: ['U', 3, 'R', 0, 'F', 1] },
  { id: 'UBR', slots: ['U', 1, 'B', 0, 'R', 1] },
  { id: 'UBL', slots: ['U', 0, 'L', 0, 'B', 1] },
  { id: 'DFL', slots: ['D', 0, 'L', 3, 'F', 2] },
  { id: 'DFR', slots: ['D', 1, 'F', 3, 'R', 2] },
  { id: 'DBR', slots: ['D', 3, 'R', 3, 'B', 2] },
  { id: 'DBL', slots: ['D', 2, 'B', 3, 'L', 2] },
];

// Canonical Pyraminx slots
const PYRAMINX_TIPS: { id: string; slots: [string, number, string, number, string, number] }[] = [
  { id: 'tip_U', slots: ['U', 0, 'L', 0, 'R', 0] },
  { id: 'tip_L', slots: ['U', 6, 'L', 6, 'B', 8] },
  { id: 'tip_R', slots: ['U', 8, 'R', 6, 'B', 6] },
  { id: 'tip_B', slots: ['L', 8, 'R', 8, 'B', 0] },
];

const PYRAMINX_CENTERS: { id: string; slots: [string, number, string, number, string, number] }[] = [
  { id: 'center_U', slots: ['U', 4, 'L', 1, 'R', 2] },
  { id: 'center_L', slots: ['U', 1, 'L', 4, 'B', 5] },
  { id: 'center_R', slots: ['U', 2, 'R', 4, 'B', 4] },
  { id: 'center_B', slots: ['L', 5, 'R', 5, 'B', 1] },
];

const PYRAMINX_EDGES: { id: string; slots: [string, number, string, number]; primaryFace: string }[] = [
  { id: 'UL', slots: ['U', 3, 'L', 2], primaryFace: 'U' },
  { id: 'UR', slots: ['U', 5, 'R', 1], primaryFace: 'U' },
  { id: 'LR', slots: ['L', 3, 'R', 3], primaryFace: 'L' },
  { id: 'UB', slots: ['U', 7, 'B', 2], primaryFace: 'U' },
  { id: 'LB', slots: ['L', 7, 'B', 7], primaryFace: 'L' },
  { id: 'RB', slots: ['R', 7, 'B', 3], primaryFace: 'R' },
];

/**
 * Extracts center colors for any twisty puzzle.
 */
export function extractCenters(
  puzzleType: PuzzleTypeId,
  facelets: GenericFaceletsState
): Record<string, CubeColor | null> {
  const centers: Record<string, CubeColor | null> = {};
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType) || PUZZLE_DEFINITIONS[1];

  for (const face of puzzleDef.faceNames) {
    const stickers = facelets[face.id] || [];
    if (puzzleType === '3x3') {
      centers[face.id] = stickers[4] ?? null;
    } else if (puzzleType === 'skewb') {
      centers[face.id] = stickers[0] ?? null;
    } else if (puzzleType === 'megaminx') {
      // Megaminx has center sticker at index 0 (or default)
      centers[face.id] = stickers[0] ?? null;
    } else {
      // For 2x2, 4x4, Pyraminx (which have virtual or quad centers), assign default or primary
      centers[face.id] = face.defaultColor;
    }
  }

  return centers;
}

/**
 * Decomposes puzzle state into structured physical pieces with position & orientation.
 */
export function decomposePieces(
  puzzleType: PuzzleTypeId,
  facelets: GenericFaceletsState
): PieceState[] {
  const pieces: PieceState[] = [];

  const getSlot = (face: string, index: number): PieceSlot => {
    const color = facelets[face]?.[index] ?? null;
    return { face, index, color };
  };

  switch (puzzleType) {
    case '3x3': {
      // 1. Centers
      for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
        const slot = getSlot(face, 4);
        pieces.push({
          id: `center_${face}`,
          type: 'center',
          stickers: [slot],
          homeId: `center_${face}`,
          position: face,
          orientation: 0,
        });
      }

      // 2. Corners
      for (const corner of CORNERS_3X3_SLOTS) {
        const s1 = getSlot(corner.slots[0], corner.slots[1]);
        const s2 = getSlot(corner.slots[2], corner.slots[3]);
        const s3 = getSlot(corner.slots[4], corner.slots[5]);
        const stickers = [s1, s2, s3];

        // Determine orientation based on U/D color position
        let orientation = 0;
        if (s1.color === 'white' || s1.color === 'yellow') {
          orientation = 0;
        } else if (s2.color === 'white' || s2.color === 'yellow') {
          orientation = 1;
        } else if (s3.color === 'white' || s3.color === 'yellow') {
          orientation = 2;
        }

        const colorsSet = [s1.color, s2.color, s3.color].filter(Boolean).sort().join('-');

        pieces.push({
          id: corner.id,
          type: 'corner',
          stickers,
          homeId: colorsSet || corner.id,
          position: corner.id,
          orientation,
        });
      }

      // 3. Edges
      for (const edge of EDGES_3X3_SLOTS) {
        const s1 = getSlot(edge.slots[0], edge.slots[1]);
        const s2 = getSlot(edge.slots[2], edge.slots[3]);
        const stickers = [s1, s2];

        let orientation = 0;
        // Primary color: white or yellow
        if (s1.color === 'white' || s1.color === 'yellow') {
          orientation = s1.face === edge.primaryFace ? 0 : 1;
        } else if (s2.color === 'white' || s2.color === 'yellow') {
          orientation = s2.face === edge.primaryFace ? 0 : 1;
        } else if (s1.color === 'green' || s1.color === 'blue') {
          orientation = s1.face === edge.primaryFace ? 0 : 1;
        } else if (s2.color === 'green' || s2.color === 'blue') {
          orientation = s2.face === edge.primaryFace ? 0 : 1;
        }

        const colorsSet = [s1.color, s2.color].filter(Boolean).sort().join('-');

        pieces.push({
          id: edge.id,
          type: 'edge',
          stickers,
          homeId: colorsSet || edge.id,
          position: edge.id,
          orientation,
        });
      }
      break;
    }

    case '2x2': {
      for (const corner of CORNERS_2X2_SLOTS) {
        const s1 = getSlot(corner.slots[0], corner.slots[1]);
        const s2 = getSlot(corner.slots[2], corner.slots[3]);
        const s3 = getSlot(corner.slots[4], corner.slots[5]);
        const stickers = [s1, s2, s3];

        let orientation = 0;
        if (s1.color === 'white' || s1.color === 'yellow') {
          orientation = 0;
        } else if (s2.color === 'white' || s2.color === 'yellow') {
          orientation = 1;
        } else if (s3.color === 'white' || s3.color === 'yellow') {
          orientation = 2;
        }

        const colorsSet = [s1.color, s2.color, s3.color].filter(Boolean).sort().join('-');

        pieces.push({
          id: corner.id,
          type: 'corner',
          stickers,
          homeId: colorsSet || corner.id,
          position: corner.id,
          orientation,
        });
      }
      break;
    }

    case 'pyraminx': {
      // 4 Tips
      for (const tip of PYRAMINX_TIPS) {
        const s1 = getSlot(tip.slots[0], tip.slots[1]);
        const s2 = getSlot(tip.slots[2], tip.slots[3]);
        const s3 = getSlot(tip.slots[4], tip.slots[5]);
        pieces.push({
          id: tip.id,
          type: 'tip',
          stickers: [s1, s2, s3],
          homeId: tip.id,
          position: tip.id,
          orientation: s1.color === s2.color && s2.color === s3.color ? 0 : 1,
        });
      }

      // 4 Centers
      for (const center of PYRAMINX_CENTERS) {
        const s1 = getSlot(center.slots[0], center.slots[1]);
        const s2 = getSlot(center.slots[2], center.slots[3]);
        const s3 = getSlot(center.slots[4], center.slots[5]);
        pieces.push({
          id: center.id,
          type: 'center',
          stickers: [s1, s2, s3],
          homeId: center.id,
          position: center.id,
          orientation: 0,
        });
      }

      // 6 Edges
      for (const edge of PYRAMINX_EDGES) {
        const s1 = getSlot(edge.slots[0], edge.slots[1]);
        const s2 = getSlot(edge.slots[2], edge.slots[3]);
        pieces.push({
          id: edge.id,
          type: 'edge',
          stickers: [s1, s2],
          homeId: edge.id,
          position: edge.id,
          orientation: s1.face === edge.primaryFace ? 0 : 1,
        });
      }
      break;
    }

    case 'skewb': {
      // 6 Centers
      for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
        const slot = getSlot(face, 0);
        pieces.push({
          id: `center_${face}`,
          type: 'center',
          stickers: [slot],
          homeId: `center_${face}`,
          position: face,
          orientation: 0,
        });
      }

      // 8 Corners
      for (let i = 0; i < 8; i++) {
        pieces.push({
          id: `corner_${i}`,
          type: 'corner',
          stickers: [],
          position: `corner_${i}`,
          orientation: 0,
        });
      }
      break;
    }

    default: {
      // Generic decomposition for other geometries (4x4, Megaminx)
      const def = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType);
      if (def) {
        for (const face of def.faceNames) {
          const stickers = facelets[face.id] || [];
          stickers.forEach((col, idx) => {
            pieces.push({
              id: `${face.id}_${idx}`,
              type: idx === 0 ? 'center' : 'wing',
              stickers: [{ face: face.id, index: idx, color: col }],
              position: `${face.id}_${idx}`,
              orientation: 0,
            });
          });
        }
      }
      break;
    }
  }

  return pieces;
}

/**
 * Computes color statistics across all facelets of the puzzle.
 */
export function computeStateStats(
  puzzleType: PuzzleTypeId,
  facelets: GenericFaceletsState
) {
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === puzzleType) || PUZZLE_DEFINITIONS[1];
  const colorDistribution: Record<string, number> = {};
  let filledStickers = 0;
  let totalStickers = 0;

  for (const face of puzzleDef.faceNames) {
    const stickers = facelets[face.id] || [];
    totalStickers += puzzleDef.stickersPerFace;
    for (const color of stickers) {
      if (color) {
        filledStickers++;
        colorDistribution[color] = (colorDistribution[color] || 0) + 1;
      }
    }
  }

  return {
    totalStickers,
    filledStickers,
    colorDistribution,
    isComplete: filledStickers === totalStickers && totalStickers > 0,
  };
}
