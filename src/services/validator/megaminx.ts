import type { CubeColor } from '../../types/cube.ts';
import type { ValidationIssue, ValidationResult } from './types.ts';

const MEGAMINX_COLORS: CubeColor[] = [
  'white',
  'yellow',
  'green',
  'blue',
  'red',
  'orange',
  'purple',
  'pink',
  'lightgreen',
  'lightblue',
  'grey',
  'cream',
];

const MEGAMINX_FACES = [
  'U', 'F', 'L', 'BL', 'BR', 'R',
  'D', 'DF', 'DL', 'DBL', 'DBR', 'DR',
];

export function validateMegaminx(state: Record<string, (CubeColor | null)[]>): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Missing stickers
  let unassignedCount = 0;
  for (const face of MEGAMINX_FACES) {
    const stickers = state[face] || [];
    for (let i = 0; i < 11; i++) {
      if (!stickers[i]) {
        unassignedCount++;
        issues.push({
          type: 'error',
          category: 'MISSING_STICKERS',
          face,
          stickerIndex: i,
          title: `Unpainted Sticker on Megaminx Face ${face}`,
          message: `Face ${face} has an unpainted sticker at position #${i + 1}.`,
        });
      }
    }
  }

  // 2. Count stickers
  const colorCounts: Record<string, number> = {};
  for (const c of MEGAMINX_COLORS) {
    colorCounts[c] = 0;
  }

  for (const face of MEGAMINX_FACES) {
    for (let i = 0; i < 11; i++) {
      const c = state[face]?.[i];
      if (c) {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      }
    }
  }

  if (unassignedCount > 0) {
    return {
      isValid: false,
      puzzleId: 'megaminx',
      issues,
      colorCounts,
      expectedCountPerColor: 11,
      totalFaceCount: 12,
      completedFaceCount: MEGAMINX_FACES.filter(f => state[f]?.slice(0, 11).every(s => s !== null)).length,
      summary: `Incomplete Megaminx configuration: ${unassignedCount} sticker(s) unpainted.`,
    };
  }

  // 3. Exactly 11 of each color
  for (const color of MEGAMINX_COLORS) {
    const count = colorCounts[color] || 0;
    if (count !== 11) {
      issues.push({
        type: 'error',
        category: 'INCORRECT_COLOR_COUNT',
        title: `Incorrect Count for ${color.toUpperCase()} on Megaminx`,
        message: `Expected exactly 11 ${color} stickers for Megaminx, but found ${count} (${count > 11 ? `+${count - 11} excess` : `${11 - count} missing`}).`,
      });
    }
  }

  // 4. Center pieces check (12 centers, index 0 on each face)
  const centerColors = new Map<CubeColor, string>();
  for (const face of MEGAMINX_FACES) {
    const center = state[face]?.[0];
    if (center) {
      if (centerColors.has(center)) {
        const otherFace = centerColors.get(center)!;
        issues.push({
          type: 'error',
          category: 'INVALID_COLOR_ARRANGEMENT',
          face,
          title: 'Duplicate Center on Megaminx',
          message: `Faces ${face} and ${otherFace} both have a ${center} center. Centers must all have unique colors across the 12 pentagonal faces.`,
        });
      } else {
        centerColors.set(center, face);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    puzzleId: 'megaminx',
    issues,
    colorCounts,
    expectedCountPerColor: 11,
    totalFaceCount: 12,
    completedFaceCount: 12,
    summary:
      issues.length === 0
        ? 'Megaminx state is valid across all 12 faces and 132 stickers.'
        : `Megaminx configuration has ${issues.length} conflicts.`,
  };
}
