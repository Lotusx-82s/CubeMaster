import type { CubeColor, CubeState3x3, FaceId } from '../../types/cube';
import { createSolvedCubeState, applyMoves } from '../cubeState';
import { validateCubeState3x3 } from '../validator';

// Whitelist of valid standard 3x3 WCA moves
const VALID_3X3_MOVES = new Set([
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
]);

const COLOR_MAP: Record<string, CubeColor> = {
  U: 'white',
  W: 'white',
  WHITE: 'white',
  R: 'red',
  RED: 'red',
  F: 'green',
  G: 'green',
  GREEN: 'green',
  D: 'yellow',
  Y: 'yellow',
  YELLOW: 'yellow',
  L: 'orange',
  O: 'orange',
  ORANGE: 'orange',
  B: 'blue',
  BLUE: 'blue',
};

/**
 * Checks if a string represents a 54-facelet state (e.g. UUUUUUUUURRRRRRRRR... or DDFRUUFDRBLLDRULFF...)
 * in standard U, R, F, D, L, B order (used by rubikscu.be, ruwix, kociemba).
 */
export function parseFaceletString(str: string): CubeState3x3 | null {
  if (!str) return null;
  const cleaned = decodeURIComponent(str).replace(/[^A-Za-z]/g, '').toUpperCase();
  if (cleaned.length !== 54) return null;

  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState3x3> = {};

  for (let f = 0; f < 6; f++) {
    const faceId = faces[f];
    const segment = cleaned.slice(f * 9, f * 9 + 9);
    const colors: (CubeColor | null)[] = [];

    for (let i = 0; i < 9; i++) {
      const char = segment[i];
      const color = COLOR_MAP[char];
      if (!color) return null;
      colors.push(color);
    }

    state[faceId] = colors;
  }

  return state as CubeState3x3;
}

/**
 * Normalizes a raw move sequence string extracted from URL query parameters.
 * Handles URL representations:
 * - Hyphen '-' used as prime symbol in alg.cubing.net (e.g., 'R-' -> "R'")
 * - Underscore '_' or '+' used as move separators
 * - Unicode quotes: '’', '‘' -> "'"
 * - Parentheses or brackets from alg triggers: '(R U R\')' -> 'R U R\''
 */
export function normalizeMoveSequence(rawString: string): { moves: string[]; normalizedStr: string; invalidTokens: string[] } {
  if (!rawString) {
    return { moves: [], normalizedStr: '', invalidTokens: [] };
  }

  // 1. Replace separators and quotes
  let cleaned = decodeURIComponent(rawString)
    .replace(/[+_]/g, ' ')
    .replace(/[’‘`]/g, "'")
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Tokenize by space
  const tokens = cleaned.split(' ').filter(Boolean);
  const validMoves: string[] = [];
  const invalidTokens: string[] = [];

  for (let token of tokens) {
    // Convert trailing '-' to "'" (standard in alg.cubing.net)
    if (token.endsWith('-')) {
      token = token.slice(0, -1) + "'";
    }

    // Capitalize the face letter (e.g. 'u' -> 'U')
    if (token.length > 0) {
      const face = token[0].toUpperCase();
      const suffix = token.slice(1);
      token = face + suffix;
    }

    if (VALID_3X3_MOVES.has(token)) {
      validMoves.push(token);
    } else {
      invalidTokens.push(token);
    }
  }

  return {
    moves: validMoves,
    normalizedStr: validMoves.join(' '),
    invalidTokens,
  };
}

/**
 * Reconstructs the 3x3 cube state by applying the normalized moves to a solved cube,
 * and verifies that the resulting state satisfies all Rubik's cube physical invariants.
 */
export function reconstructAndValidate3x3State(moves: string[]): {
  state: CubeState3x3;
  isValid: boolean;
  issues: string[];
} {
  const solved = createSolvedCubeState();
  const state = applyMoves(solved, moves);
  const validation = validateCubeState3x3(state);

  return {
    state,
    isValid: validation.isValid,
    issues: validation.issues.map(i => i.message),
  };
}
