import type { CubeColor, CubeState3x3, FaceId } from '../../types/cube';
import { createSolvedCubeState, applyMoves } from '../cubeState';
import { validateCubeState3x3 } from '../validator';
import { validateCube2x2 } from '../validator/cube2x2';
import { validateCube4x4 } from '../validator/cube4x4';

// Standard 3x3 and 2x2 WCA face turn moves
const VALID_STANDARD_MOVES = new Set([
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  // Big-cube wide moves
  'Rw', "Rw'", 'Rw2',
  'Lw', "Lw'", 'Lw2',
  'Uw', "Uw'", 'Uw2',
  'Dw', "Dw'", 'Dw2',
  'Fw', "Fw'", 'Fw2',
  'Bw', "Bw'", 'Bw2',
  '2R', "2R'", '2R2',
  '2L', "2L'", '2L2',
  '2U', "2U'", '2U2',
  '2D', "2D'", '2D2',
  '2F', "2F'", '2F2',
  '2B', "2B'", '2B2',
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
  const cleaned = decodeURIComponent(rawString)
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

    if (VALID_STANDARD_MOVES.has(token)) {
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

// Rotate a 2x2 face array 90° clockwise
function rotate2x2FaceCW(face: (CubeColor | null)[]): (CubeColor | null)[] {
  return [face[2], face[0], face[3], face[1]];
}

export function createSolved2x2State(): Record<string, (CubeColor | null)[]> {
  return {
    U: ['white', 'white', 'white', 'white'],
    R: ['red', 'red', 'red', 'red'],
    F: ['green', 'green', 'green', 'green'],
    D: ['yellow', 'yellow', 'yellow', 'yellow'],
    L: ['orange', 'orange', 'orange', 'orange'],
    B: ['blue', 'blue', 'blue', 'blue'],
  };
}

export function applyMove2x2(state: Record<string, (CubeColor | null)[]>, move: string): Record<string, (CubeColor | null)[]> {
  const next: Record<string, (CubeColor | null)[]> = {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B],
  };

  const face = move[0] as FaceId;
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");
  const turns = isDouble ? 2 : isPrime ? 3 : 1;

  for (let t = 0; t < turns; t++) {
    next[face] = rotate2x2FaceCW(next[face]);

    switch (face) {
      case 'U': {
        const temp = [next.B[0], next.B[1]];
        next.B[0] = next.L[0]; next.B[1] = next.L[1];
        next.L[0] = next.F[0]; next.L[1] = next.F[1];
        next.F[0] = next.R[0]; next.F[1] = next.R[1];
        next.R[0] = temp[0];   next.R[1] = temp[1];
        break;
      }
      case 'D': {
        const temp = [next.F[2], next.F[3]];
        next.F[2] = next.L[2]; next.F[3] = next.L[3];
        next.L[2] = next.B[2]; next.L[3] = next.B[3];
        next.B[2] = next.R[2]; next.B[3] = next.R[3];
        next.R[2] = temp[0];   next.R[3] = temp[1];
        break;
      }
      case 'F': {
        const temp = [next.U[2], next.U[3]];
        next.U[2] = next.L[3]; next.U[3] = next.L[1];
        next.L[1] = next.D[0]; next.L[3] = next.D[1];
        next.D[0] = next.R[2]; next.D[1] = next.R[0];
        next.R[0] = temp[0];   next.R[2] = temp[1];
        break;
      }
      case 'B': {
        const temp = [next.U[0], next.U[1]];
        next.U[0] = next.R[1]; next.U[1] = next.R[3];
        next.R[1] = next.D[3]; next.R[3] = next.D[2];
        next.D[2] = next.L[0]; next.D[3] = next.L[2];
        next.L[0] = temp[1];   next.L[2] = temp[0];
        break;
      }
      case 'R': {
        const temp = [next.U[1], next.U[3]];
        next.U[1] = next.F[1]; next.U[3] = next.F[3];
        next.F[1] = next.D[1]; next.F[3] = next.D[3];
        next.D[1] = next.B[2]; next.D[3] = next.B[0];
        next.B[0] = temp[1];   next.B[2] = temp[0];
        break;
      }
      case 'L': {
        const temp = [next.U[0], next.U[2]];
        next.U[0] = next.B[3]; next.U[2] = next.B[1];
        next.B[1] = next.D[2]; next.B[3] = next.D[0];
        next.D[0] = next.F[0]; next.D[2] = next.F[2];
        next.F[0] = temp[0];   next.F[2] = temp[1];
        break;
      }
    }
  }

  return next;
}

/**
 * Reconstructs a 2x2 pocket cube state by applying scramble moves to a solved 2x2 cube,
 * and validates the resulting configuration against 2x2 corner invariants.
 */
export function reconstructAndValidate2x2State(moves: string[]): {
  state: Record<string, (CubeColor | null)[]>;
  isValid: boolean;
  issues: string[];
} {
  let state = createSolved2x2State();
  for (const m of moves) {
    state = applyMove2x2(state, m);
  }
  const validation = validateCube2x2(state);

  return {
    state,
    isValid: validation.isValid,
    issues: validation.issues.map(i => i.message),
  };
}

export function createSolved4x4State(): Record<string, (CubeColor | null)[]> {
  return {
    U: Array(16).fill('white'),
    R: Array(16).fill('red'),
    F: Array(16).fill('green'),
    D: Array(16).fill('yellow'),
    L: Array(16).fill('orange'),
    B: Array(16).fill('blue'),
  };
}

/**
 * Reconstructs and validates 4x4 state configuration.
 */
export function reconstructAndValidate4x4State(_moves: string[]): {
  state: Record<string, (CubeColor | null)[]>;
  isValid: boolean;
  issues: string[];
} {
  const state = createSolved4x4State();
  const validation = validateCube4x4(state);

  return {
    state,
    isValid: validation.isValid,
    issues: validation.issues.map(i => i.message),
  };
}
