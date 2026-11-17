import type { CubeColor, FaceId } from '../../types/cube.ts';
import { FACE_NAMES } from '../../types/cube.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

interface CornerDef2x2 {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

const CORNERS_2X2: CornerDef2x2[] = [
  { id: 'UFL', name: 'Up-Front-Left', slots: ['U', 2, 'F', 0, 'L', 1], colors: ['orange', 'white', 'green'] },
  { id: 'UFR', name: 'Up-Front-Right', slots: ['U', 3, 'R', 0, 'F', 1], colors: ['orange', 'blue', 'white'] },
  { id: 'UBR', name: 'Up-Back-Right', slots: ['U', 1, 'B', 0, 'R', 1], colors: ['orange', 'yellow', 'blue'] },
  { id: 'UBL', name: 'Up-Back-Left', slots: ['U', 0, 'L', 0, 'B', 1], colors: ['orange', 'green', 'yellow'] },
  { id: 'DFL', name: 'Down-Front-Left', slots: ['D', 0, 'L', 3, 'F', 2], colors: ['red', 'green', 'white'] },
  { id: 'DFR', name: 'Down-Front-Right', slots: ['D', 1, 'F', 3, 'R', 2], colors: ['red', 'white', 'blue'] },
  { id: 'DBR', name: 'Down-Back-Right', slots: ['D', 3, 'R', 3, 'B', 2], colors: ['red', 'blue', 'yellow'] },
  { id: 'DBL', name: 'Down-Back-Left', slots: ['D', 2, 'B', 3, 'L', 2], colors: ['red', 'yellow', 'green'] },
];

const REQUIRED_COLORS_2X2: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

const OPPOSITE_PAIRS_2X2: [CubeColor, CubeColor][] = [
  ['orange', 'red'],
  ['white', 'yellow'],
  ['blue', 'green'],
];

export function validateCube2x2(state: Record<string, (CubeColor | null)[]>): ValidationResult {
  const issues: ValidationIssue[] = [];
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  // 1. Missing stickers
  let unassignedCount = 0;
  for (const face of faces) {
    const stickers = state[face] || [];
    for (let i = 0; i < 4; i++) {
      if (!stickers[i]) {
        unassignedCount++;
        issues.push({
          type: 'error',
          category: 'MISSING_STICKERS',
          face,
          stickerIndex: i,
          title: `Unpainted Sticker on ${FACE_NAMES[face].name}`,
          message: `${FACE_NAMES[face].name} face has an uncolored sticker at slot #${i + 1}.`,
        });
      }
    }
  }

  // 2. Count stickers
  const colorCounts: Record<string, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  for (const face of faces) {
    for (let i = 0; i < 4; i++) {
      const color = state[face]?.[i];
      if (color) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
  }

  if (unassignedCount > 0) {
    return {
      isValid: false,
      puzzleId: '2x2',
      issues,
      colorCounts,
      expectedCountPerColor: 4,
      totalFaceCount: 6,
      completedFaceCount: faces.filter(f => state[f]?.slice(0, 4).every(s => s !== null)).length,
      summary: `Incomplete 2×2 configuration: ${unassignedCount} sticker(s) must be colored.`,
    };
  }

  // 3. Exactly 4 of each color
  for (const color of REQUIRED_COLORS_2X2) {
    const count = colorCounts[color] || 0;
    if (count !== 4) {
      issues.push({
        type: 'error',
        category: 'INCORRECT_COLOR_COUNT',
        title: `Incorrect Count for ${color.toUpperCase()}`,
        message: `Expected exactly 4 ${color} stickers for 2×2, but found ${count} (${count > 4 ? `+${count - 4} excess` : `${4 - count} missing`}).`,
      });
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: '2x2',
      issues,
      colorCounts,
      expectedCountPerColor: 4,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `Validation failed with ${issues.length} color distribution errors.`,
    };
  }

  // 4. Validate Corner pieces (8 corners)
  const cornerPerm: number[] = [];
  let totalTwist = 0;
  const seenCorners = new Set<number>();

  for (let slotIdx = 0; slotIdx < CORNERS_2X2.length; slotIdx++) {
    const cornerDef = CORNERS_2X2[slotIdx];
    const [f1, i1, f2, i2, f3, i3] = cornerDef.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;
    const c3 = state[f3][i3]!;

    // Duplicate colors on corner
    if (c1 === c2 || c1 === c3 || c2 === c3) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Duplicate Colors on 2×2 Corner',
        message: `Corner at ${cornerDef.name} has duplicate colors (${c1}, ${c2}, ${c3}). All 3 colors must be distinct.`,
      });
      continue;
    }

    // Opposite colors on corner
    const colors = [c1, c2, c3];
    const hasOpposites = OPPOSITE_PAIRS_2X2.some(
      ([op1, op2]) => colors.includes(op1) && colors.includes(op2)
    );

    if (hasOpposites) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Impossible 2×2 Corner Colors',
        message: `Corner at ${cornerDef.name} contains opposite colors (${colors.join(', ')}).`,
      });
      continue;
    }

    // Match corner
    let matchedIdx = -1;
    let twist = 0;

    for (let targetIdx = 0; targetIdx < CORNERS_2X2.length; targetIdx++) {
      const target = CORNERS_2X2[targetIdx];
      const targetSet = new Set(target.colors);
      if (targetSet.has(c1) && targetSet.has(c2) && targetSet.has(c3)) {
        matchedIdx = targetIdx;
        const udColor = target.colors[0]; // white or yellow
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
        title: 'Unrecognized 2×2 Corner Piece',
        message: `Corner with colors ${c1}-${c2}-${c3} at ${cornerDef.name} does not match any valid pocket cube piece.`,
      });
    } else {
      if (seenCorners.has(matchedIdx)) {
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face: f1,
          title: 'Duplicate 2×2 Corner Piece',
          message: `The corner piece ${c1}-${c2}-${c3} (${CORNERS_2X2[matchedIdx].name}) appears multiple times.`,
        });
      }
      seenCorners.add(matchedIdx);
      cornerPerm.push(matchedIdx);
      totalTwist += twist;
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: '2x2',
      issues,
      colorCounts,
      expectedCountPerColor: 4,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `2×2 validation failed with ${issues.length} physical corner errors.`,
    };
  }

  // 5. Corner Orientation Parity (twist sum must be a multiple of 3)
  if (totalTwist % 3 !== 0) {
    issues.push({
      type: 'error',
      category: 'IMPOSSIBLE_PUZZLE_STATE',
      title: '2×2 Corner Orientation Parity Error',
      message: `Single twisted corner detected on 2×2 (twist sum ≡ ${totalTwist % 3} mod 3). One or more corner pieces have been physically twisted out of parity.`,
    });
  }

  // Note: On a 2×2 Pocket Cube, corner permutation parity is NOT restricted to even permutations.
  // A single quarter turn (e.g. U, R, F) is a 4-cycle of corners (an odd permutation) with no edges,
  // making all permutations in S8 with twist sum ≡ 0 (mod 3) physically reachable and solvable.

  return {
    isValid: issues.length === 0,
    puzzleId: '2x2',
    issues,
    colorCounts,
    expectedCountPerColor: 4,
    totalFaceCount: 6,
    completedFaceCount: 6,
    summary:
      issues.length === 0
        ? '2×2 Pocket Cube state is valid and solvable.'
        : `2×2 configuration has ${issues.length} parity/invariant errors.`,
  };
}
