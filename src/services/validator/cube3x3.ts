import type { CubeColor, CubeState3x3, FaceId } from '../../types/cube.ts';
import { FACE_NAMES } from '../../types/cube.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

interface CornerDefinition {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

interface EdgeDefinition {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor];
  primaryFace: FaceId;
}

// 8 Canonical Corner Positions and their clockwise sticker order (Orange Top, White Front)
const CORNERS_3X3: CornerDefinition[] = [
  { id: 'UFL', name: 'Up-Front-Left', slots: ['U', 6, 'F', 0, 'L', 2], colors: ['orange', 'white', 'green'] },
  { id: 'UFR', name: 'Up-Front-Right', slots: ['U', 8, 'R', 0, 'F', 2], colors: ['orange', 'blue', 'white'] },
  { id: 'UBR', name: 'Up-Back-Right', slots: ['U', 2, 'B', 0, 'R', 2], colors: ['orange', 'yellow', 'blue'] },
  { id: 'UBL', name: 'Up-Back-Left', slots: ['U', 0, 'L', 0, 'B', 2], colors: ['orange', 'green', 'yellow'] },
  { id: 'DFL', name: 'Down-Front-Left', slots: ['D', 0, 'L', 8, 'F', 6], colors: ['red', 'green', 'white'] },
  { id: 'DFR', name: 'Down-Front-Right', slots: ['D', 2, 'F', 8, 'R', 6], colors: ['red', 'white', 'blue'] },
  { id: 'DBR', name: 'Down-Back-Right', slots: ['D', 8, 'R', 8, 'B', 6], colors: ['red', 'blue', 'yellow'] },
  { id: 'DBL', name: 'Down-Back-Left', slots: ['D', 6, 'B', 8, 'L', 6], colors: ['red', 'yellow', 'green'] },
];

// 12 Canonical Edge Positions (Orange Top, White Front)
const EDGES_3X3: EdgeDefinition[] = [
  { id: 'UF', name: 'Up-Front', slots: ['U', 7, 'F', 1], colors: ['orange', 'white'], primaryFace: 'U' },
  { id: 'UR', name: 'Up-Right', slots: ['U', 5, 'R', 1], colors: ['orange', 'blue'], primaryFace: 'U' },
  { id: 'UB', name: 'Up-Back', slots: ['U', 1, 'B', 1], colors: ['orange', 'yellow'], primaryFace: 'U' },
  { id: 'UL', name: 'Up-Left', slots: ['U', 3, 'L', 1], colors: ['orange', 'green'], primaryFace: 'U' },
  { id: 'DF', name: 'Down-Front', slots: ['D', 1, 'F', 7], colors: ['red', 'white'], primaryFace: 'D' },
  { id: 'DR', name: 'Down-Right', slots: ['D', 5, 'R', 7], colors: ['red', 'blue'], primaryFace: 'D' },
  { id: 'DB', name: 'Down-Back', slots: ['D', 7, 'B', 7], colors: ['red', 'yellow'], primaryFace: 'D' },
  { id: 'DL', name: 'Down-Left', slots: ['D', 3, 'L', 7], colors: ['red', 'green'], primaryFace: 'D' },
  { id: 'FR', name: 'Front-Right', slots: ['F', 5, 'R', 3], colors: ['white', 'blue'], primaryFace: 'F' },
  { id: 'FL', name: 'Front-Left', slots: ['F', 3, 'L', 5], colors: ['white', 'green'], primaryFace: 'F' },
  { id: 'BR', name: 'Back-Right', slots: ['B', 3, 'R', 5], colors: ['yellow', 'blue'], primaryFace: 'B' },
  { id: 'BL', name: 'Back-Left', slots: ['B', 5, 'L', 3], colors: ['yellow', 'green'], primaryFace: 'B' },
];

const REQUIRED_COLORS: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

function getPermutationParity(perm: number[]): number {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions % 2;
}

export function validateCube3x3(state: CubeState3x3): ValidationResult {
  const issues: ValidationIssue[] = [];
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  // 1. Check for missing/unpainted stickers
  let unassignedCount = 0;
  for (const face of faces) {
    const faceStickers = state[face] || [];
    faceStickers.forEach((sticker, index) => {
      if (sticker === null) {
        unassignedCount++;
        issues.push({
          type: 'error',
          category: 'MISSING_STICKERS',
          face,
          stickerIndex: index,
          title: `Unpainted Sticker on ${FACE_NAMES[face].name}`,
          message: `${FACE_NAMES[face].name} face has an uncolored sticker at position #${index + 1}.`,
        });
      }
    });
  }

  // 2. Count stickers of each color
  const colorCounts: Record<string, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  for (const face of faces) {
    for (const sticker of state[face] || []) {
      if (sticker) {
        colorCounts[sticker] = (colorCounts[sticker] || 0) + 1;
      }
    }
  }

  // If stickers are missing, return early with missing stickers diagnostics
  if (unassignedCount > 0) {
    return {
      isValid: false,
      puzzleId: '3x3',
      issues,
      colorCounts,
      expectedCountPerColor: 9,
      totalFaceCount: 6,
      completedFaceCount: faces.filter(f => state[f]?.every(s => s !== null)).length,
      summary: `Incomplete cube configuration: ${unassignedCount} sticker(s) must be painted.`,
    };
  }

  // 3. Verify exactly 9 of each color
  for (const color of REQUIRED_COLORS) {
    const count = colorCounts[color] || 0;
    if (count !== 9) {
      issues.push({
        type: 'error',
        category: 'INCORRECT_COLOR_COUNT',
        title: `Incorrect Count for ${color.toUpperCase()}`,
        message: `Expected exactly 9 ${color} stickers, but found ${count} (${count > 9 ? `+${count - 9} excess` : `${9 - count} missing`}).`,
      });
    }
  }

  // 4. Center pieces check (6 centers)
  const centerColors = new Map<CubeColor, FaceId>();
  for (const face of faces) {
    const center = state[face][4];
    if (center) {
      if (centerColors.has(center)) {
        const otherFace = centerColors.get(center)!;
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face,
          title: 'Duplicate Center Color',
          message: `${FACE_NAMES[face].name} and ${FACE_NAMES[otherFace].name} both have a ${center} center. Center colors must be unique.`,
        });
      } else {
        centerColors.set(center, face);
      }
    }
  }

  // Check opposite centers consistency
  const oppositePairs: [FaceId, FaceId][] = [
    ['U', 'D'],
    ['F', 'B'],
    ['R', 'L'],
  ];

  for (const [f1, f2] of oppositePairs) {
    const c1 = state[f1][4];
    const c2 = state[f2][4];
    if (c1 && c2 && c1 === c2) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        title: 'Opposite Centers Conflict',
        message: `${FACE_NAMES[f1].name} and ${FACE_NAMES[f2].name} faces both share the center color ${c1}.`,
      });
    }
  }

  // If there are color count or center errors, stop before piece parity checks
  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: '3x3',
      issues,
      colorCounts,
      expectedCountPerColor: 9,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `Validation failed with ${issues.length} color distribution or center conflicts.`,
    };
  }

  // 5. Piece-level validation: Edges (12 edges)
  const edgePerm: number[] = [];
  let totalEdgeFlips = 0;
  const seenEdges = new Set<number>();

  for (let slotIdx = 0; slotIdx < EDGES_3X3.length; slotIdx++) {
    const edgeDef = EDGES_3X3[slotIdx];
    const [f1, i1, f2, i2] = edgeDef.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;

    // Check monochromatic edge
    if (c1 === c2) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Monochromatic Edge Piece',
        message: `Edge between ${FACE_NAMES[f1].name} and ${FACE_NAMES[f2].name} has two identical colors (${c1}).`,
      });
      continue;
    }

    // Check opposite colors on an edge
    const isOppositePair = oppositePairs.some(
      ([op1, op2]) =>
        (c1 === FACE_NAMES[op1].standardColor && c2 === FACE_NAMES[op2].standardColor) ||
        (c1 === FACE_NAMES[op2].standardColor && c2 === FACE_NAMES[op1].standardColor)
    );

    if (isOppositePair) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Impossible Edge Colors',
        message: `Edge piece at ${edgeDef.name} contains opposite colors (${c1} and ${c2}), which cannot share an edge.`,
      });
      continue;
    }

    // Match edge to one of the 12 canonical edge types
    let matchedEdgeIdx = -1;
    let isFlipped = false;

    for (let targetIdx = 0; targetIdx < EDGES_3X3.length; targetIdx++) {
      const target = EDGES_3X3[targetIdx];
      if (c1 === target.colors[0] && c2 === target.colors[1]) {
        matchedEdgeIdx = targetIdx;
        isFlipped = false;
        break;
      } else if (c1 === target.colors[1] && c2 === target.colors[0]) {
        matchedEdgeIdx = targetIdx;
        isFlipped = true;
        break;
      }
    }

    if (matchedEdgeIdx === -1) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Unrecognized Edge Piece',
        message: `Edge with colors ${c1}-${c2} at ${edgeDef.name} does not correspond to any valid Rubik's cube edge piece.`,
      });
    } else {
      if (seenEdges.has(matchedEdgeIdx)) {
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face: f1,
          title: 'Duplicate Edge Piece',
          message: `The edge piece ${c1}-${c2} (${EDGES_3X3[matchedEdgeIdx].name}) appears multiple times on the cube.`,
        });
      }
      seenEdges.add(matchedEdgeIdx);
      edgePerm.push(matchedEdgeIdx);
      if (isFlipped) totalEdgeFlips++;
    }
  }

  // 6. Piece-level validation: Corners (8 corners)
  const cornerPerm: number[] = [];
  let totalCornerTwists = 0;
  const seenCorners = new Set<number>();

  for (let slotIdx = 0; slotIdx < CORNERS_3X3.length; slotIdx++) {
    const cornerDef = CORNERS_3X3[slotIdx];
    const [f1, i1, f2, i2, f3, i3] = cornerDef.slots;
    const c1 = state[f1][i1]!;
    const c2 = state[f2][i2]!;
    const c3 = state[f3][i3]!;

    // Check duplicate colors on the corner
    if (c1 === c2 || c1 === c3 || c2 === c3) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Duplicate Colors on Corner Piece',
        message: `Corner at ${cornerDef.name} has duplicate colors (${c1}, ${c2}, ${c3}). All 3 colors must be distinct.`,
      });
      continue;
    }

    // Check opposite colors on the corner
    const cornerColors = [c1, c2, c3];
    const hasOpposites = oppositePairs.some(
      ([op1, op2]) =>
        cornerColors.includes(FACE_NAMES[op1].standardColor) &&
        cornerColors.includes(FACE_NAMES[op2].standardColor)
    );

    if (hasOpposites) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Impossible Corner Colors',
        message: `Corner at ${cornerDef.name} contains opposite face colors (${cornerColors.join(', ')}). Opposite colors cannot exist on the same corner.`,
      });
      continue;
    }

    // Match corner to one of the 8 canonical corner types
    let matchedCornerIdx = -1;
    let twist = 0;

    for (let targetIdx = 0; targetIdx < CORNERS_3X3.length; targetIdx++) {
      const target = CORNERS_3X3[targetIdx];
      const targetSet = new Set(target.colors);
      if (targetSet.has(c1) && targetSet.has(c2) && targetSet.has(c3)) {
        matchedCornerIdx = targetIdx;

        // Determine orientation twist (0 = U/D color on U/D face, 1 = clockwise, 2 = counter-clockwise)
        const udColor = target.colors[0]; // white or yellow
        if (c1 === udColor) twist = 0;
        else if (c2 === udColor) twist = 1;
        else if (c3 === udColor) twist = 2;
        break;
      }
    }

    if (matchedCornerIdx === -1) {
      issues.push({
        type: 'error',
        category: 'INVALID_COLOR_ARRANGEMENT',
        face: f1,
        title: 'Unrecognized Corner Piece',
        message: `Corner with colors ${c1}-${c2}-${c3} at ${cornerDef.name} does not match any valid Rubik's cube corner.`,
      });
    } else {
      if (seenCorners.has(matchedCornerIdx)) {
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face: f1,
          title: 'Duplicate Corner Piece',
          message: `The corner piece (${CORNERS_3X3[matchedCornerIdx].name}) appears multiple times on the cube.`,
        });
      }
      seenCorners.add(matchedCornerIdx);
      cornerPerm.push(matchedCornerIdx);
      totalCornerTwists += twist;
    }
  }

  // If there are piece configuration issues, return them before parity math
  if (issues.length > 0) {
    return {
      isValid: false,
      puzzleId: '3x3',
      issues,
      colorCounts,
      expectedCountPerColor: 9,
      totalFaceCount: 6,
      completedFaceCount: 6,
      summary: `Invalid piece arrangement: ${issues.length} physical piece error(s) detected.`,
    };
  }

  // 7. Check Edge Orientation Parity (Sum of flips must be even)
  if (totalEdgeFlips % 2 !== 0) {
    issues.push({
      type: 'error',
      category: 'IMPOSSIBLE_PUZZLE_STATE',
      title: 'Edge Orientation Parity Error',
      message: `Single flipped edge detected (edge flip sum ≡ 1 mod 2). On a genuine Rubik's cube, you cannot flip a single edge piece without physically taking the cube apart.`,
    });
  }

  // 8. Check Corner Orientation Parity (Sum of twists must be divisible by 3)
  if (totalCornerTwists % 3 !== 0) {
    issues.push({
      type: 'error',
      category: 'IMPOSSIBLE_PUZZLE_STATE',
      title: 'Corner Orientation Parity Error',
      message: `Single twisted corner detected (twist sum ≡ ${totalCornerTwists % 3} mod 3). On a genuine Rubik's cube, you cannot twist a single corner piece without physically rotating it.`,
    });
  }

  // 9. Check Permutation Parity (Corner permutation sign must equal Edge permutation sign)
  if (cornerPerm.length === 8 && edgePerm.length === 12) {
    const cornerParity = getPermutationParity(cornerPerm);
    const edgeParity = getPermutationParity(edgePerm);

    if (cornerParity !== edgeParity) {
      issues.push({
        type: 'error',
        category: 'IMPOSSIBLE_PUZZLE_STATE',
        title: 'Permutation Parity Error',
        message: `Corner permutation parity (${cornerParity === 0 ? 'even' : 'odd'}) does not match edge permutation parity (${edgeParity === 0 ? 'even' : 'odd'}). A single swap of two pieces is physically impossible.`,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    puzzleId: '3x3',
    issues,
    colorCounts,
    expectedCountPerColor: 9,
    totalFaceCount: 6,
    completedFaceCount: 6,
    summary:
      issues.length === 0
        ? '3×3 Cube state is physically valid and solvable.'
        : `Cube state failed physical invariant checks: ${issues.map(i => i.title).join(', ')}.`,
  };
}
