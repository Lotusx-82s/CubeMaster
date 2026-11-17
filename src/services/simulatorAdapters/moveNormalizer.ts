import type { CubeColor, CubeState3x3, FaceId } from '../../types/cube';
import { createSolvedCubeState, applyMoves } from '../cubeState';
import { validateCubeState3x3 } from '../validator';
import { validateCube2x2 } from '../validator/cube2x2';
import { validateCube4x4 } from '../validator/cube4x4';
import { validateMegaminx } from '../validator/megaminx';

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
    U: ['orange', 'orange', 'orange', 'orange'],
    R: ['blue', 'blue', 'blue', 'blue'],
    F: ['white', 'white', 'white', 'white'],
    D: ['red', 'red', 'red', 'red'],
    L: ['green', 'green', 'green', 'green'],
    B: ['yellow', 'yellow', 'yellow', 'yellow'],
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
    U: Array(16).fill('orange'),
    R: Array(16).fill('blue'),
    F: Array(16).fill('white'),
    D: Array(16).fill('red'),
    L: Array(16).fill('green'),
    B: Array(16).fill('yellow'),
  };
}

function rotate4x4FaceCW(face: (CubeColor | null)[]): (CubeColor | null)[] {
  const next = [...face];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      next[c * 4 + (3 - r)] = face[r * 4 + c];
    }
  }
  return next;
}

export function applyMove4x4(
  state: Record<string, (CubeColor | null)[]>,
  move: string
): Record<string, (CubeColor | null)[]> {
  const next: Record<string, (CubeColor | null)[]> = {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B],
  };

  const isWide = move.includes('w') || move.startsWith('2');
  const baseMove = move.replace(/[w2']/g, '').replace(/^2/, '');
  const isPrime = move.includes("'");
  const isDouble = move.endsWith('2') || move.includes('2');
  const turns = isDouble ? 2 : isPrime ? 3 : 1;

  for (let t = 0; t < turns; t++) {
    switch (baseMove) {
      case 'U': {
        next.U = rotate4x4FaceCW(next.U);
        const temp0 = [next.F[0], next.F[1], next.F[2], next.F[3]];
        next.F[0] = next.R[0]; next.F[1] = next.R[1]; next.F[2] = next.R[2]; next.F[3] = next.R[3];
        next.R[0] = next.B[0]; next.R[1] = next.B[1]; next.R[2] = next.B[2]; next.R[3] = next.B[3];
        next.B[0] = next.L[0]; next.B[1] = next.L[1]; next.B[2] = next.L[2]; next.B[3] = next.L[3];
        next.L[0] = temp0[0];  next.L[1] = temp0[1];  next.L[2] = temp0[2];  next.L[3] = temp0[3];

        if (isWide) {
          const temp1 = [next.F[4], next.F[5], next.F[6], next.F[7]];
          next.F[4] = next.R[4]; next.F[5] = next.R[5]; next.F[6] = next.R[6]; next.F[7] = next.R[7];
          next.R[4] = next.B[4]; next.R[5] = next.B[5]; next.R[6] = next.B[6]; next.R[7] = next.B[7];
          next.B[4] = next.L[4]; next.B[5] = next.L[5]; next.B[6] = next.L[6]; next.B[7] = next.L[7];
          next.L[4] = temp1[0];  next.L[5] = temp1[1];  next.L[6] = temp1[2];  next.L[7] = temp1[3];
        }
        break;
      }

      case 'D': {
        next.D = rotate4x4FaceCW(next.D);
        const temp3 = [next.F[12], next.F[13], next.F[14], next.F[15]];
        next.F[12] = next.L[12]; next.F[13] = next.L[13]; next.F[14] = next.L[14]; next.F[15] = next.L[15];
        next.L[12] = next.B[12]; next.L[13] = next.B[13]; next.L[14] = next.B[14]; next.L[15] = next.B[15];
        next.B[12] = next.R[12]; next.B[13] = next.R[13]; next.B[14] = next.R[14]; next.B[15] = next.R[15];
        next.R[12] = temp3[0];   next.R[13] = temp3[1];   next.R[14] = temp3[2];   next.R[15] = temp3[3];

        if (isWide) {
          const temp2 = [next.F[8], next.F[9], next.F[10], next.F[11]];
          next.F[8] = next.L[8]; next.F[9] = next.L[9]; next.F[10] = next.L[10]; next.F[11] = next.L[11];
          next.L[8] = next.B[8]; next.L[9] = next.B[9]; next.L[10] = next.B[10]; next.L[11] = next.B[11];
          next.B[8] = next.R[8]; next.B[9] = next.R[9]; next.B[10] = next.R[10]; next.B[11] = next.R[11];
          next.R[8] = temp2[0];  next.R[9] = temp2[1];  next.R[10] = temp2[2];  next.R[11] = temp2[3];
        }
        break;
      }

      case 'F': {
        next.F = rotate4x4FaceCW(next.F);
        const tempU = [next.U[12], next.U[13], next.U[14], next.U[15]];
        next.U[12] = next.L[15]; next.U[13] = next.L[11]; next.U[14] = next.L[7];  next.U[15] = next.L[3];
        next.L[3]  = next.D[0];  next.L[7]  = next.D[1];  next.L[11] = next.D[2];  next.L[15] = next.D[3];
        next.D[0]  = next.R[12]; next.D[1]  = next.R[8];  next.D[2]  = next.R[4];  next.D[3]  = next.R[0];
        next.R[0]  = tempU[0];   next.R[4]  = tempU[1];   next.R[8]  = tempU[2];   next.R[12] = tempU[3];

        if (isWide) {
          const tempU2 = [next.U[8], next.U[9], next.U[10], next.U[11]];
          next.U[8]  = next.L[14]; next.U[9]  = next.L[10]; next.U[10] = next.L[6];  next.U[11] = next.L[2];
          next.L[2]  = next.D[4];  next.L[6]  = next.D[5];  next.L[10] = next.D[6];  next.L[14] = next.D[7];
          next.D[4]  = next.R[13]; next.D[5]  = next.R[9];  next.D[6]  = next.R[5];  next.D[7]  = next.R[1];
          next.R[1]  = tempU2[0];  next.R[5]  = tempU2[1];  next.R[9]  = tempU2[2];  next.R[13] = tempU2[3];
        }
        break;
      }

      case 'B': {
        next.B = rotate4x4FaceCW(next.B);
        const tempU0 = [next.U[0], next.U[1], next.U[2], next.U[3]];
        next.U[0]  = next.R[3];  next.U[1]  = next.R[7];  next.U[2]  = next.R[11]; next.U[3]  = next.R[15];
        next.R[3]  = next.D[15]; next.R[7]  = next.D[14]; next.R[11] = next.D[13]; next.R[15] = next.D[12];
        next.D[12] = next.L[0];  next.D[13] = next.L[4];  next.D[14] = next.L[8];  next.D[15] = next.L[12];
        next.L[0]  = tempU0[3];  next.L[4]  = tempU0[2];  next.L[8]  = tempU0[1];  next.L[12] = tempU0[0];

        if (isWide) {
          const tempU1 = [next.U[4], next.U[5], next.U[6], next.U[7]];
          next.U[4]  = next.R[2];  next.U[5]  = next.R[6];  next.U[6]  = next.R[10]; next.U[7]  = next.R[14];
          next.R[2]  = next.D[11]; next.R[6]  = next.D[10]; next.R[10] = next.D[9];  next.R[14] = next.D[8];
          next.D[8]  = next.L[1];  next.D[9]  = next.L[5];  next.D[10] = next.L[9];  next.D[11] = next.L[13];
          next.L[1]  = tempU1[3];  next.L[5]  = tempU1[2];  next.L[9]  = tempU1[1];  next.L[13] = tempU1[0];
        }
        break;
      }

      case 'R': {
        next.R = rotate4x4FaceCW(next.R);
        const tempU3 = [next.U[3], next.U[7], next.U[11], next.U[15]];
        next.U[3]  = next.F[3];  next.U[7]  = next.F[7];  next.U[11] = next.F[11]; next.U[15] = next.F[15];
        next.F[3]  = next.D[3];  next.F[7]  = next.D[7];  next.F[11] = next.D[11]; next.F[15] = next.D[15];
        next.D[3]  = next.B[12]; next.D[7]  = next.B[8];  next.D[11] = next.B[4];  next.D[15] = next.B[0];
        next.B[0]  = tempU3[3];  next.B[4]  = tempU3[2];  next.B[8]  = tempU3[1];  next.B[12] = tempU3[0];

        if (isWide) {
          const tempU2 = [next.U[2], next.U[6], next.U[10], next.U[14]];
          next.U[2]  = next.F[2];  next.U[6]  = next.F[6];  next.U[10] = next.F[10]; next.U[14] = next.F[14];
          next.F[2]  = next.D[2];  next.F[6]  = next.D[6];  next.F[10] = next.D[10]; next.F[14] = next.D[14];
          next.D[2]  = next.B[13]; next.D[6]  = next.B[9];  next.D[10] = next.B[5];  next.D[14] = next.B[1];
          next.B[1]  = tempU2[3];  next.B[5]  = tempU2[2];  next.B[9]  = tempU2[1];  next.B[13] = tempU2[0];
        }
        break;
      }

      case 'L': {
        next.L = rotate4x4FaceCW(next.L);
        const tempU0 = [next.U[0], next.U[4], next.U[8], next.U[12]];
        next.U[0]  = next.B[15]; next.U[4]  = next.B[11]; next.U[8]  = next.B[7];  next.U[12] = next.B[3];
        next.B[3]  = next.D[12]; next.B[7]  = next.D[8];  next.B[11] = next.D[4];  next.B[15] = next.D[0];
        next.D[0]  = next.F[0];  next.D[4]  = next.F[4];  next.D[8]  = next.F[8];  next.D[12] = next.F[12];
        next.F[0]  = tempU0[0];  next.F[4]  = tempU0[1];  next.F[8]  = tempU0[2];  next.F[12] = tempU0[3];

        if (isWide) {
          const tempU1 = [next.U[1], next.U[5], next.U[9], next.U[13]];
          next.U[1]  = next.B[14]; next.U[5]  = next.B[10]; next.U[9]  = next.B[6];  next.U[13] = next.B[2];
          next.B[2]  = next.D[13]; next.B[6]  = next.D[9];  next.B[10] = next.D[5];  next.B[14] = next.D[1];
          next.D[1]  = next.F[1];  next.D[5]  = next.F[5];  next.D[9]  = next.F[9];  next.D[13] = next.F[13];
          next.F[1]  = tempU1[0];  next.F[5]  = tempU1[1];  next.F[9]  = tempU1[2];  next.F[13] = tempU1[3];
        }
        break;
      }
    }
  }

  return next;
}

/**
 * Reconstructs and validates 4x4 state configuration by applying scramble moves.
 */
export function reconstructAndValidate4x4State(moves: string[]): {
  state: Record<string, (CubeColor | null)[]>;
  isValid: boolean;
  issues: string[];
} {
  let state = createSolved4x4State();
  for (const m of moves) {
    state = applyMove4x4(state, m);
  }
  const validation = validateCube4x4(state);

  return {
    state,
    isValid: validation.isValid,
    issues: validation.issues.map(i => i.message),
  };
}

// =========================================================================
// MEGAMINX STATE & MOVES
// =========================================================================

export function createSolvedMegaminxState(): Record<string, (CubeColor | null)[]> {
  return {
    U: Array(11).fill('white'),
    F: Array(11).fill('green'),
    L: Array(11).fill('purple'),
    BL: Array(11).fill('blue'),
    BR: Array(11).fill('red'),
    R: Array(11).fill('yellow'),
    D: Array(11).fill('grey'),
    DF: Array(11).fill('cream'),
    DL: Array(11).fill('pink'),
    DBL: Array(11).fill('lightblue'),
    DBR: Array(11).fill('lightgreen'),
    DR: Array(11).fill('orange'),
  };
}

const MEGAMINX_NEIGHBORS: Record<string, string[]> = {
  U: ['F', 'R', 'BR', 'BL', 'L'],
  D: ['DF', 'DR', 'DBR', 'DBL', 'DL'],
  F: ['U', 'L', 'DL', 'DF', 'R'],
  R: ['U', 'F', 'DF', 'DR', 'BR'],
  BR: ['U', 'R', 'DR', 'DBR', 'BL'],
  BL: ['U', 'BR', 'DBR', 'DBL', 'L'],
  L: ['U', 'BL', 'DBL', 'DL', 'F'],
  DF: ['D', 'DL', 'F', 'R', 'DR'],
  DR: ['D', 'DF', 'R', 'BR', 'DBR'],
  DBR: ['D', 'DR', 'BR', 'BL', 'DBL'],
  DBL: ['D', 'DBR', 'BL', 'L', 'DL'],
  DL: ['D', 'DBL', 'L', 'F', 'DF'],
};

export function rotateMegaminxFaceCW(face: (CubeColor | null)[]): (CubeColor | null)[] {
  const next = [...face];
  next[3] = face[1];
  next[5] = face[3];
  next[7] = face[5];
  next[9] = face[7];
  next[1] = face[9];
  next[4] = face[2];
  next[6] = face[4];
  next[8] = face[6];
  next[10] = face[8];
  next[2] = face[10];
  return next;
}

export function applyMoveMegaminx(
  state: Record<string, (CubeColor | null)[]>,
  move: string
): Record<string, (CubeColor | null)[]> {
  const next: Record<string, (CubeColor | null)[]> = {};
  for (const f of Object.keys(state)) {
    next[f] = [...state[f]];
  }

  const isPrime = move.includes("'") || move.includes('-');
  let face = move.replace(/[2'+-]/g, '');
  if (!MEGAMINX_NEIGHBORS[face]) {
    face = 'U';
  }

  const isDouble = move.includes('2') || move.includes('++') || move.includes('--');
  const turns = isDouble ? 2 : 1;
  const count = isPrime ? (5 - turns) % 5 : turns;

  for (let c = 0; c < count; c++) {
    next[face] = rotateMegaminxFaceCW(next[face]);

    const neighbors = MEGAMINX_NEIGHBORS[face];
    if (neighbors && neighbors.length === 5) {
      const n0 = neighbors[0], n1 = neighbors[1], n2 = neighbors[2], n3 = neighbors[3], n4 = neighbors[4];
      const temp = [next[n0][1], next[n0][2], next[n0][10]];
      next[n0][1] = next[n4][1]; next[n0][2] = next[n4][2]; next[n0][10] = next[n4][10];
      next[n4][1] = next[n3][1]; next[n4][2] = next[n3][2]; next[n4][10] = next[n3][10];
      next[n3][1] = next[n2][1]; next[n3][2] = next[n2][2]; next[n3][10] = next[n2][10];
      next[n2][1] = next[n1][1]; next[n2][2] = next[n1][2]; next[n2][10] = next[n1][10];
      next[n1][1] = temp[0];      next[n1][2] = temp[1];      next[n1][10] = temp[2];
    }
  }

  return next;
}

/**
 * Reconstructs and validates Megaminx state configuration by applying scramble moves.
 */
export function reconstructAndValidateMegaminxState(moves: string[]): {
  state: Record<string, (CubeColor | null)[]>;
  isValid: boolean;
  issues: string[];
} {
  let state = createSolvedMegaminxState();
  for (const m of moves) {
    state = applyMoveMegaminx(state, m);
  }
  const validation = validateMegaminx(state);

  return {
    state,
    isValid: validation.isValid,
    issues: validation.issues.map(i => i.message),
  };
}
