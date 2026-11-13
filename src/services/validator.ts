import type { CubeColor, CubeState3x3, FaceId, ValidationIssue, ValidationResult } from '../types/cube';
import { FACE_NAMES } from '../types/cube';

export function validateCubeState3x3(state: CubeState3x3): ValidationResult {
  const issues: ValidationIssue[] = [];
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  // 1. Check for unassigned stickers
  let unassignedCount = 0;
  for (const face of faces) {
    const faceStickers = state[face];
    const missing = faceStickers.filter(s => s === null).length;
    if (missing > 0) {
      unassignedCount += missing;
      issues.push({
        type: 'error',
        face,
        title: `Incomplete ${FACE_NAMES[face].name} Face`,
        message: `${FACE_NAMES[face].name} face has ${missing} unpainted sticker${missing > 1 ? 's' : ''}.`,
      });
    }
  }

  // 2. Count total stickers of each color
  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  for (const face of faces) {
    for (const sticker of state[face]) {
      if (sticker) {
        colorCounts[sticker] = (colorCounts[sticker] || 0) + 1;
      }
    }
  }

  // If there are unassigned stickers, report early
  if (unassignedCount > 0) {
    return {
      isValid: false,
      issues,
      colorCounts,
      expectedCountPerColor: 9,
    };
  }

  // 3. Verify exactly 9 of each color
  const requiredColors: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
  for (const color of requiredColors) {
    const count = colorCounts[color];
    if (count !== 9) {
      issues.push({
        type: 'error',
        title: `Incorrect Count for ${color.toUpperCase()}`,
        message: `Expected exactly 9 ${color} stickers, but found ${count} (${count > 9 ? `+${count - 9} excess` : `${9 - count} missing`}).`,
      });
    }
  }

  // 4. Center pieces check
  const centerColors = new Set<CubeColor>();
  for (const face of faces) {
    const center = state[face][4];
    if (center) {
      if (centerColors.has(center)) {
        issues.push({
          type: 'error',
          face,
          title: 'Duplicate Center Color',
          message: `The center of ${FACE_NAMES[face].name} (${center}) is duplicated on another face. Centers must all have unique colors.`,
        });
      }
      centerColors.add(center);
    }
  }

  // 5. Check opposite centers consistency
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
        title: 'Opposite Centers Mismatch',
        message: `${FACE_NAMES[f1].name} and ${FACE_NAMES[f2].name} both have ${c1} center. Opposite faces cannot share colors.`,
      });
    }
  }

  // 6. Check edge piece legality (12 edges)
  const edges: [FaceId, number, FaceId, number][] = [
    ['U', 1, 'B', 1],
    ['U', 3, 'L', 1],
    ['U', 5, 'R', 1],
    ['U', 7, 'F', 1],
    ['D', 1, 'F', 7],
    ['D', 3, 'L', 7],
    ['D', 5, 'R', 7],
    ['D', 7, 'B', 7],
    ['F', 3, 'L', 5],
    ['F', 5, 'R', 3],
    ['B', 3, 'R', 5],
    ['B', 5, 'L', 3],
  ];

  for (const [f1, i1, f2, i2] of edges) {
    const c1 = state[f1][i1];
    const c2 = state[f2][i2];
    if (c1 && c2) {
      if (c1 === c2) {
        issues.push({
          type: 'error',
          title: 'Monochromatic Edge Piece',
          message: `Edge piece between ${FACE_NAMES[f1].name} and ${FACE_NAMES[f2].name} has two identical colors (${c1}).`,
        });
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    colorCounts,
    expectedCountPerColor: 9,
  };
}
