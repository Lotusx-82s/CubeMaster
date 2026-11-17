import type { CubeColor, FaceId } from '../../types/cube.ts';
import { FACE_NAMES } from '../../types/cube.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

const SKEWB_COLORS: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
const SKEWB_FACES: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

interface SkewbCornerDef {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

// 8 Corners of Skewb (Orange Top, White Front)
const SKEWB_CORNERS: SkewbCornerDef[] = [
  { id: 'UFL', name: 'Up-Front-Left', slots: ['U', 4, 'F', 1, 'L', 2], colors: ['orange', 'white', 'green'] },
  { id: 'UFR', name: 'Up-Front-Right', slots: ['U', 3, 'R', 1, 'F', 2], colors: ['orange', 'blue', 'white'] },
  { id: 'UBR', name: 'Up-Back-Right', slots: ['U', 2, 'B', 1, 'R', 2], colors: ['orange', 'yellow', 'blue'] },
  { id: 'UBL', name: 'Up-Back-Left', slots: ['U', 1, 'L', 1, 'B', 2], colors: ['orange', 'green', 'yellow'] },
  { id: 'DFL', name: 'Down-Front-Left', slots: ['D', 1, 'L', 3, 'F', 4], colors: ['red', 'green', 'white'] },
  { id: 'DFR', name: 'Down-Front-Right', slots: ['D', 2, 'F', 3, 'R', 4], colors: ['red', 'white', 'blue'] },
  { id: 'DBR', name: 'Down-Back-Right', slots: ['D', 3, 'R', 3, 'B', 4], colors: ['red', 'blue', 'yellow'] },
  { id: 'DBL', name: 'Down-Back-Left', slots: ['D', 4, 'B', 3, 'L', 4], colors: ['red', 'yellow', 'green'] },
];

const OPPOSITE_PAIRS_SKEWB: [CubeColor, CubeColor][] = [
  ['orange', 'red'],
  ['white', 'yellow'],
  ['blue', 'green'],
];

export function validateSkewb(state: Record<string, (CubeColor | null)[]>): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Missing stickers
  let unassignedCount = 0;
  for (const face of SKEWB_FACES) {
    const stickers = state[face] || [];
    for (let i = 0; i < 5; i++) {
      if (!stickers[i]) {
        unassignedCount++;
        issues.push({
          type: 'error',
          category: 'MISSING_STICKERS',
          face,
          stickerIndex: i,
          title: `Unpainted Skewb Sticker on ${FACE_NAMES[face].name}`,
          message: `${FACE_NAMES[face].name} face has an unpainted sticker at slot #${i + 1}.`,
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

  for (const face of SKEWB_FACES) {
    for (let i = 0; i < 5; i++) {
      const c = state[face]?.[i];
      if (c) {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      }
    }
  }

  if (unassignedCount > 0) {
    return {
      isValid: false,
      puzzleId: 'skewb',
      issues,
      colorCounts,
      expectedCountPerColor: 5,
      totalFaceCount: 6,
      completedFaceCount: SKEWB_FACES.filter(f => state[f]?.slice(0, 5).every(s => s !== null)).length,
      summary: `Incomplete Skewb configuration: ${unassignedCount} sticker(s) unpainted.`,
    };
  }

  // 3. Exactly 5 of each color
  for (const color of SKEWB_COLORS) {
    const count = colorCounts[color] || 0;
    if (count !== 5) {
      issues.push({
        type: 'error',
        category: 'INCORRECT_COLOR_COUNT',
        title: `Incorrect Count for ${color.toUpperCase()} on Skewb`,
        message: `Expected exactly 5 ${color} stickers for Skewb, but found ${count}.`,
      });
    }
  }

  // 4. Center pieces check (6 centers, index 0 on each face)
  const centerColors = new Map<CubeColor, FaceId>();
  for (const face of SKEWB_FACES) {
    const center = state[face]?.[0];
    if (center) {
      if (centerColors.has(center)) {
        const otherFace = centerColors.get(center)!;
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face,
          title: 'Duplicate Center on Skewb',
          message: `${FACE_NAMES[face].name} and ${FACE_NAMES[otherFace].name} share center color ${center}. Centers must all have unique colors.`,
        });
      } else {
        centerColors.set(center, face);
      }
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: 'skewb',
      issues,
      colorCounts,
      expectedCountPerColor: 5,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `Skewb validation failed with ${issues.length} distribution/center errors.`,
    };
  }

  // 5. Corners check (8 corners)
  const seenCorners = new Set<string>();
  let totalCornerTwist = 0;

  for (let slotIdx = 0; slotIdx < SKEWB_CORNERS.length; slotIdx++) {
    const cornerDef = SKEWB_CORNERS[slotIdx];
    const [f1, i1, f2, i2, f3, i3] = cornerDef.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;
    const c3 = state[f3][i3]!;

    if (c1 === c2 || c1 === c3 || c2 === c3) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Duplicate Colors on Skewb Corner',
        message: `Corner at ${cornerDef.name} has duplicate colors (${c1}, ${c2}, ${c3}).`,
      });
      continue;
    }

    const colors = [c1, c2, c3];
    const hasOpposites = OPPOSITE_PAIRS_SKEWB.some(
      ([op1, op2]) => colors.includes(op1) && colors.includes(op2)
    );

    if (hasOpposites) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Impossible Skewb Corner Colors',
        message: `Corner at ${cornerDef.name} contains opposite face colors (${colors.join(', ')}).`,
      });
      continue;
    }

    let matchedIdx = -1;
    let twist = 0;

    for (let targetIdx = 0; targetIdx < SKEWB_CORNERS.length; targetIdx++) {
      const target = SKEWB_CORNERS[targetIdx];
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
        title: 'Unrecognized Skewb Corner',
        message: `Corner ${c1}-${c2}-${c3} is not a valid corner combination on Skewb.`,
      });
    } else {
      const key = SKEWB_CORNERS[matchedIdx].id;
      if (seenCorners.has(key)) {
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face: f1,
          title: 'Duplicate Skewb Corner Piece',
          message: `Corner piece (${SKEWB_CORNERS[matchedIdx].name}) appears multiple times.`,
        });
      }
      seenCorners.add(key);
      totalCornerTwist += twist;
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: 'skewb',
      issues,
      colorCounts,
      expectedCountPerColor: 5,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `Skewb validation failed with ${issues.length} piece errors.`,
    };
  }

  // 6. Corner Orientation Parity (Sum of twists mod 3 === 0)
  if (totalCornerTwist % 3 !== 0) {
    issues.push({
      type: 'error',
      category: 'IMPOSSIBLE_PUZZLE_STATE',
      title: 'Skewb Corner Orientation Parity Error',
      message: `Single twisted corner detected on Skewb (twist sum ≡ ${totalCornerTwist % 3} mod 3). Corners can only twist in pairs or triplets during legal moves.`,
    });
  }

  return {
    isValid: issues.length === 0,
    puzzleId: 'skewb',
    issues,
    colorCounts,
    expectedCountPerColor: 5,
    totalFaceCount: 6,
    completedFaceCount: 6,
    summary:
      issues.length === 0
        ? 'Skewb state is physically valid and solvable.'
        : `Skewb configuration has ${issues.length} parity errors.`,
  };
}
