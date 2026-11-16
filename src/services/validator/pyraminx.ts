import type { CubeColor } from '../../types/cube.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

const PYRAMINX_COLORS: CubeColor[] = ['yellow', 'green', 'red', 'blue'];
const PYRAMINX_FACES = ['U', 'L', 'R', 'B'];

interface PyraminxTip {
  name: string;
  slots: [string, number, string, number, string, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

interface PyraminxEdge {
  name: string;
  slots: [string, number, string, number];
  colors: [CubeColor, CubeColor];
}

// 4 Tips (3 stickers each)
const PYRAMINX_TIPS: PyraminxTip[] = [
  { name: 'Top Apex Tip', slots: ['U', 0, 'L', 0, 'R', 0], colors: ['yellow', 'green', 'red'] },
  { name: 'Left Tip', slots: ['U', 4, 'L', 8, 'B', 4], colors: ['yellow', 'green', 'blue'] },
  { name: 'Right Tip', slots: ['U', 8, 'R', 4, 'B', 8], colors: ['yellow', 'red', 'blue'] },
  { name: 'Back/Base Tip', slots: ['L', 4, 'R', 8, 'B', 0], colors: ['green', 'red', 'blue'] },
];

// 6 Edges (2 stickers each)
const PYRAMINX_EDGES: PyraminxEdge[] = [
  { name: 'Up-Left Edge', slots: ['U', 2, 'L', 2], colors: ['yellow', 'green'] },
  { name: 'Up-Right Edge', slots: ['U', 7, 'R', 5], colors: ['yellow', 'red'] },
  { name: 'Up-Back Edge', slots: ['U', 5, 'B', 7], colors: ['yellow', 'blue'] },
  { name: 'Left-Right Edge', slots: ['L', 5, 'R', 2], colors: ['green', 'red'] },
  { name: 'Left-Back Edge', slots: ['L', 7, 'B', 2], colors: ['green', 'blue'] },
  { name: 'Right-Back Edge', slots: ['R', 7, 'B', 5], colors: ['red', 'blue'] },
];

function getPermutationParity(perm: number[]): number {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions % 2;
}

export function validatePyraminx(state: Record<string, (CubeColor | null)[]>): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Missing stickers
  let unassignedCount = 0;
  for (const face of PYRAMINX_FACES) {
    const stickers = state[face] || [];
    for (let i = 0; i < 9; i++) {
      if (!stickers[i]) {
        unassignedCount++;
        issues.push({
          type: 'error',
          category: 'MISSING_STICKERS',
          face,
          stickerIndex: i,
          title: `Unpainted Pyraminx Sticker on Face ${face}`,
          message: `Face ${face} has an unpainted sticker at position #${i + 1}.`,
        });
      }
    }
  }

  // 2. Color counts
  const colorCounts: Record<string, number> = {
    yellow: 0,
    green: 0,
    red: 0,
    blue: 0,
  };

  for (const face of PYRAMINX_FACES) {
    for (let i = 0; i < 9; i++) {
      const c = state[face]?.[i];
      if (c) {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      }
    }
  }

  if (unassignedCount > 0) {
    return {
      isValid: false,
      puzzleId: 'pyraminx',
      issues,
      colorCounts,
      expectedCountPerColor: 9,
      totalFaceCount: 4,
      completedFaceCount: PYRAMINX_FACES.filter(f => state[f]?.slice(0, 9).every(s => s !== null)).length,
      summary: `Incomplete Pyraminx configuration: ${unassignedCount} sticker(s) unpainted.`,
    };
  }

  // 3. Exactly 9 of each color
  for (const color of PYRAMINX_COLORS) {
    const count = colorCounts[color] || 0;
    if (count !== 9) {
      issues.push({
        type: 'error',
        category: 'INCORRECT_COLOR_COUNT',
        title: `Incorrect Count for ${color.toUpperCase()} on Pyraminx`,
        message: `Expected exactly 9 ${color} stickers for Pyraminx, but found ${count}.`,
      });
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: 'pyraminx',
      issues,
      colorCounts,
      expectedCountPerColor: 9,
      totalFaceCount: 4,
      completedFaceCount: 4,
      summary: `Pyraminx validation failed with ${issues.length} color distribution errors.`,
    };
  }

  // 4. Validate Tips (4 tips)
  for (const tip of PYRAMINX_TIPS) {
    const [f1, i1, f2, i2, f3, i3] = tip.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;
    const c3 = state[f3][i3]!;

    const tipColors = [c1, c2, c3].sort();
    const expectedColors = [...tip.colors].sort();

    if (tipColors.join('-') !== expectedColors.join('-')) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: `Invalid Colors on ${tip.name}`,
        message: `${tip.name} contains colors (${c1}, ${c2}, ${c3}) which do not match the expected vertex faces (${tip.colors.join(', ')}). Tips can only rotate in place.`,
      });
    }
  }

  // 5. Validate Edges (6 edges)
  const seenEdges = new Set<string>();
  const edgePerm: number[] = [];
  let totalEdgeFlips = 0;

  for (let slotIdx = 0; slotIdx < PYRAMINX_EDGES.length; slotIdx++) {
    const edgeDef = PYRAMINX_EDGES[slotIdx];
    const [f1, i1, f2, i2] = edgeDef.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;

    if (c1 === c2) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Monochromatic Pyraminx Edge',
        message: `Edge ${edgeDef.name} between ${f1} and ${f2} has two identical colors (${c1}).`,
      });
      continue;
    }

    let matchedIdx = -1;
    let isFlipped = false;

    for (let targetIdx = 0; targetIdx < PYRAMINX_EDGES.length; targetIdx++) {
      const target = PYRAMINX_EDGES[targetIdx];
      if (c1 === target.colors[0] && c2 === target.colors[1]) {
        matchedIdx = targetIdx;
        isFlipped = false;
        break;
      } else if (c1 === target.colors[1] && c2 === target.colors[0]) {
        matchedIdx = targetIdx;
        isFlipped = true;
        break;
      }
    }

    if (matchedIdx === -1) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Unrecognized Pyraminx Edge',
        message: `Edge ${c1}-${c2} does not match any valid Pyraminx edge piece.`,
      });
    } else {
      const key = PYRAMINX_EDGES[matchedIdx].name;
      if (seenEdges.has(key)) {
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face: f1,
          title: 'Duplicate Pyraminx Edge Piece',
          message: `The edge piece ${key} appears multiple times on the Pyraminx.`,
        });
      }
      seenEdges.add(key);
      edgePerm.push(matchedIdx);
      if (isFlipped) totalEdgeFlips++;
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: 'pyraminx',
      issues,
      colorCounts,
      expectedCountPerColor: 9,
      totalFaceCount: 4,
      completedFaceCount: 4,
      summary: `Pyraminx validation failed with ${issues.length} physical piece error(s).`,
    };
  }

  // 6. Pyraminx Edge Flip Parity (Sum of flips must be even)
  if (totalEdgeFlips % 2 !== 0) {
    issues.push({
      type: 'error',
      category: 'IMPOSSIBLE_PUZZLE_STATE',
      title: 'Pyraminx Edge Flip Parity Error',
      message: `Single flipped edge detected on Pyraminx (flip sum ≡ 1 mod 2). All Pyraminx turns flip edges in pairs; a single flipped edge is physically impossible.`,
    });
  }

  // 7. Pyraminx Edge Permutation Parity (Must be even)
  if (edgePerm.length === 6) {
    const parity = getPermutationParity(edgePerm);
    if (parity !== 0) {
      issues.push({
        type: 'error',
        category: 'IMPOSSIBLE_PUZZLE_STATE',
        title: 'Pyraminx Edge Permutation Parity Error',
        message: `Odd edge permutation detected on Pyraminx. All Pyraminx layer rotations produce 3-cycles (even permutations). An isolated swap of two edges is impossible.`,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    puzzleId: 'pyraminx',
    issues,
    colorCounts,
    expectedCountPerColor: 9,
    totalFaceCount: 4,
    completedFaceCount: 4,
    summary:
      issues.length === 0
        ? 'Pyraminx state is physically valid and solvable.'
        : `Pyraminx configuration has ${issues.length} parity errors.`,
  };
}
