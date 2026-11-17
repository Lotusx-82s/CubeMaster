import type { CubeColor, FaceId } from '../../types/cube.ts';
import { FACE_NAMES } from '../../types/cube.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

interface CornerDef4x4 {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

const CORNERS_4X4: CornerDef4x4[] = [
  { id: 'UFL', name: 'Up-Front-Left', slots: ['U', 12, 'F', 0, 'L', 3], colors: ['orange', 'white', 'green'] },
  { id: 'UFR', name: 'Up-Front-Right', slots: ['U', 15, 'R', 0, 'F', 3], colors: ['orange', 'blue', 'white'] },
  { id: 'UBR', name: 'Up-Back-Right', slots: ['U', 3, 'B', 0, 'R', 3], colors: ['orange', 'yellow', 'blue'] },
  { id: 'UBL', name: 'Up-Back-Left', slots: ['U', 0, 'L', 0, 'B', 3], colors: ['orange', 'green', 'yellow'] },
  { id: 'DFL', name: 'Down-Front-Left', slots: ['D', 0, 'L', 15, 'F', 12], colors: ['red', 'green', 'white'] },
  { id: 'DFR', name: 'Down-Front-Right', slots: ['D', 3, 'F', 15, 'R', 12], colors: ['red', 'white', 'blue'] },
  { id: 'DBR', name: 'Down-Back-Right', slots: ['D', 15, 'R', 15, 'B', 12], colors: ['red', 'blue', 'yellow'] },
  { id: 'DBL', name: 'Down-Back-Left', slots: ['D', 12, 'B', 15, 'L', 12], colors: ['red', 'yellow', 'green'] },
];

// 24 Wing Edge Slots (2 wing edges per edge pair)
const WING_EDGES_4X4: [FaceId, number, FaceId, number, string][] = [
  ['U', 13, 'F', 1, 'UF-1'],
  ['U', 14, 'F', 2, 'UF-2'],
  ['U', 11, 'R', 1, 'UR-1'],
  ['U', 7, 'R', 2, 'UR-2'],
  ['U', 2, 'B', 1, 'UB-1'],
  ['U', 1, 'B', 2, 'UB-2'],
  ['U', 4, 'L', 1, 'UL-1'],
  ['U', 8, 'L', 2, 'UL-2'],
  ['D', 1, 'F', 13, 'DF-1'],
  ['D', 2, 'F', 14, 'DF-2'],
  ['D', 7, 'R', 13, 'DR-1'],
  ['D', 11, 'R', 14, 'DR-2'],
  ['D', 14, 'B', 13, 'DB-1'],
  ['D', 13, 'B', 14, 'DB-2'],
  ['D', 4, 'L', 14, 'DL-1'],
  ['D', 8, 'L', 13, 'DL-2'],
  ['F', 7, 'R', 4, 'FR-1'],
  ['F', 11, 'R', 8, 'FR-2'],
  ['F', 4, 'L', 7, 'FL-1'],
  ['F', 8, 'L', 11, 'FL-2'],
  ['B', 4, 'R', 7, 'BR-1'],
  ['B', 8, 'R', 11, 'BR-2'],
  ['B', 7, 'L', 4, 'BL-1'],
  ['B', 11, 'L', 8, 'BL-2'],
];

const CENTER_INDICES_4X4 = [5, 6, 9, 10];
const REQUIRED_COLORS_4X4: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

const OPPOSITE_PAIRS_4X4: [CubeColor, CubeColor][] = [
  ['orange', 'red'],
  ['white', 'yellow'],
  ['blue', 'green'],
];

export function validateCube4x4(state: Record<string, (CubeColor | null)[]>): ValidationResult {
  const issues: ValidationIssue[] = [];
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  // 1. Missing stickers
  let unassignedCount = 0;
  for (const face of faces) {
    const stickers = state[face] || [];
    for (let i = 0; i < 16; i++) {
      if (!stickers[i]) {
        unassignedCount++;
        issues.push({
          type: 'error',
          category: 'MISSING_STICKERS',
          face,
          stickerIndex: i,
          title: `Unpainted 4×4 Sticker on ${FACE_NAMES[face].name}`,
          message: `${FACE_NAMES[face].name} face has an uncolored sticker at slot #${i + 1}.`,
        });
      }
    }
  }

  // 2. Count overall stickers
  const colorCounts: Record<string, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  for (const face of faces) {
    for (let i = 0; i < 16; i++) {
      const color = state[face]?.[i];
      if (color) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
  }

  if (unassignedCount > 0) {
    return {
      isValid: false,
      puzzleId: '4x4',
      issues,
      colorCounts,
      expectedCountPerColor: 16,
      totalFaceCount: 6,
      completedFaceCount: faces.filter(f => state[f]?.slice(0, 16).every(s => s !== null)).length,
      summary: `Incomplete 4×4 configuration: ${unassignedCount} sticker(s) unpainted.`,
    };
  }

  // 3. Exactly 16 of each color
  for (const color of REQUIRED_COLORS_4X4) {
    const count = colorCounts[color] || 0;
    if (count !== 16) {
      issues.push({
        type: 'error',
        category: 'INCORRECT_COLOR_COUNT',
        title: `Incorrect Count for ${color.toUpperCase()} on 4×4`,
        message: `Expected exactly 16 ${color} stickers for 4×4, but found ${count} (${count > 16 ? `+${count - 16} excess` : `${16 - count} missing`}).`,
      });
    }
  }

  // 4. Center distribution (24 movable centers: exactly 4 of each color)
  const centerColorCounts: Record<string, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  for (const face of faces) {
    for (const idx of CENTER_INDICES_4X4) {
      const c = state[face]?.[idx];
      if (c) {
        centerColorCounts[c] = (centerColorCounts[c] || 0) + 1;
      }
    }
  }

  for (const color of REQUIRED_COLORS_4X4) {
    const count = centerColorCounts[color] || 0;
    if (count !== 4) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        title: `Invalid Center Distribution (${color.toUpperCase()})`,
        message: `Expected exactly 4 ${color} center stickers across all faces, but found ${count}. Centers cannot be solved with this configuration.`,
      });
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: '4x4',
      issues,
      colorCounts,
      expectedCountPerColor: 16,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `4×4 validation failed with ${issues.length} distribution/center conflicts.`,
    };
  }

  // 5. Corners validation (8 corners)
  const seenCorners = new Set<string>();
  let totalCornerTwist = 0;

  for (let slotIdx = 0; slotIdx < CORNERS_4X4.length; slotIdx++) {
    const cornerDef = CORNERS_4X4[slotIdx];
    const [f1, i1, f2, i2, f3, i3] = cornerDef.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;
    const c3 = state[f3][i3]!;

    if (c1 === c2 || c1 === c3 || c2 === c3) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Duplicate Colors on 4×4 Corner',
        message: `Corner at ${cornerDef.name} has duplicate colors.`,
      });
      continue;
    }

    const colors = [c1, c2, c3];
    const hasOpposites = OPPOSITE_PAIRS_4X4.some(
      ([op1, op2]) => colors.includes(op1) && colors.includes(op2)
    );

    if (hasOpposites) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Impossible 4×4 Corner Colors',
        message: `Corner at ${cornerDef.name} contains opposite face colors (${colors.join(', ')}).`,
      });
      continue;
    }

    let matchedIdx = -1;
    let twist = 0;

    for (let targetIdx = 0; targetIdx < CORNERS_4X4.length; targetIdx++) {
      const target = CORNERS_4X4[targetIdx];
      const targetSet = new Set(target.colors);
      if (targetSet.has(c1) && targetSet.has(c2) && targetSet.has(c3)) {
        matchedIdx = targetIdx;
        const udColor = target.colors[0];
        if (c1 === udColor) twist = 0;
        else if (c2 === udColor) twist = 1;
        else if (c3 === udColor) twist = 2;
        break;
      }
    }

    if (matchedIdx === -1) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Unrecognized 4×4 Corner',
        message: `Corner ${c1}-${c2}-${c3} is not a valid Rubik's corner combination.`,
      });
    } else {
      const cornerKey = CORNERS_4X4[matchedIdx].id;
      if (seenCorners.has(cornerKey)) {
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face: f1,
          title: 'Duplicate 4×4 Corner Piece',
          message: `Corner piece (${CORNERS_4X4[matchedIdx].name}) appears multiple times.`,
        });
      }
      seenCorners.add(cornerKey);
      totalCornerTwist += twist;
    }
  }

  // 6. Wing Edges validation (24 wing edges: exactly 2 of each of the 12 pairs)
  const edgePairCounts: Record<string, number> = {};

  for (const [f1, i1, f2, i2, wingName] of WING_EDGES_4X4) {
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;

    if (c1 === c2) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Monochromatic Wing Edge',
        message: `Wing edge ${wingName} between ${f1} and ${f2} has two identical colors (${c1}).`,
      });
      continue;
    }

    const hasOpposites = OPPOSITE_PAIRS_4X4.some(
      ([op1, op2]) => (c1 === op1 && c2 === op2) || (c1 === op2 && c2 === op1)
    );

    if (hasOpposites) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Impossible Wing Edge Colors',
        message: `Wing edge ${wingName} has opposite colors (${c1} and ${c2}).`,
      });
      continue;
    }

    const key = [c1, c2].sort().join('-');
    edgePairCounts[key] = (edgePairCounts[key] || 0) + 1;
  }

  for (const [pairKey, count] of Object.entries(edgePairCounts)) {
    if (count !== 2) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        title: `Invalid 4×4 Edge Pairing Count (${pairKey})`,
        message: `Expected exactly 2 wing edge pieces for color pair ${pairKey}, but found ${count}.`,
      });
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: '4x4',
      issues,
      colorCounts,
      expectedCountPerColor: 16,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `4×4 validation failed with ${issues.length} piece errors.`,
    };
  }

  // 7. Corner Orientation Parity
  if (totalCornerTwist % 3 !== 0) {
    issues.push({
      type: 'error',
      category: 'IMPOSSIBLE_PUZZLE_STATE',
      title: '4×4 Corner Orientation Parity Error',
      message: `Single twisted corner detected on 4×4 (twist sum ≡ ${totalCornerTwist % 3} mod 3).`,
    });
  }

  return {
    isValid: issues.length === 0,
    puzzleId: '4x4',
    issues,
    colorCounts,
    expectedCountPerColor: 16,
    totalFaceCount: 6,
    completedFaceCount: 6,
    summary:
      issues.length === 0
        ? '4×4 Rubik’s Revenge state is valid and solvable.'
        : `4×4 configuration has ${issues.length} parity errors.`,
  };
}
