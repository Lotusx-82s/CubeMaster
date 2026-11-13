import type { CubeColor, CubeState3x3, FaceId } from '../types/cube';
import { FACE_NAMES } from '../types/cube';

// Create a completely empty cube (stickers set to null except fixed centers)
export function createEmptyCubeState(preserveCenters = true): CubeState3x3 {
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState3x3> = {};

  for (const face of faces) {
    const stickers: (CubeColor | null)[] = Array(9).fill(null);
    if (preserveCenters) {
      stickers[4] = FACE_NAMES[face].standardColor;
    }
    state[face] = stickers;
  }

  return state as CubeState3x3;
}

// Create a standard solved 3x3 Rubik's cube
export function createSolvedCubeState(): CubeState3x3 {
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState3x3> = {};

  for (const face of faces) {
    state[face] = Array(9).fill(FACE_NAMES[face].standardColor);
  }

  return state as CubeState3x3;
}

// Clone cube state immutably
export function cloneCubeState(state: CubeState3x3): CubeState3x3 {
  return {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B],
  };
}

// Rotate a 3x3 face array 90° clockwise
function rotateFaceCW(face: (CubeColor | null)[]): (CubeColor | null)[] {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

// Apply a single standard move (e.g., "R", "R'", "R2", "U", "F'") to 3x3 cube state
export function applyMove(state: CubeState3x3, move: string): CubeState3x3 {
  const next = cloneCubeState(state);
  const face = move[0] as FaceId;
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");

  const turns = isDouble ? 2 : isPrime ? 3 : 1;

  for (let t = 0; t < turns; t++) {
    // 1. Rotate the face itself
    next[face] = rotateFaceCW(next[face]);

    // 2. Rotate adjacent edges
    switch (face) {
      case 'U': {
        const temp = [next.B[0], next.B[1], next.B[2]];
        next.B[0] = next.L[0]; next.B[1] = next.L[1]; next.B[2] = next.L[2];
        next.L[0] = next.F[0]; next.L[1] = next.F[1]; next.L[2] = next.F[2];
        next.F[0] = next.R[0]; next.F[1] = next.R[1]; next.F[2] = next.R[2];
        next.R[0] = temp[0];   next.R[1] = temp[1];   next.R[2] = temp[2];
        break;
      }
      case 'D': {
        const temp = [next.F[6], next.F[7], next.F[8]];
        next.F[6] = next.L[6]; next.F[7] = next.L[7]; next.F[8] = next.L[8];
        next.L[6] = next.B[6]; next.L[7] = next.B[7]; next.L[8] = next.B[8];
        next.B[6] = next.R[6]; next.B[7] = next.R[7]; next.B[8] = next.R[8];
        next.R[6] = temp[0];   next.R[7] = temp[1];   next.R[8] = temp[2];
        break;
      }
      case 'F': {
        const temp = [next.U[6], next.U[7], next.U[8]];
        next.U[6] = next.L[8]; next.U[7] = next.L[5]; next.U[8] = next.L[2];
        next.L[2] = next.D[0]; next.L[5] = next.D[1]; next.L[8] = next.D[2];
        next.D[0] = next.R[6]; next.D[1] = next.R[3]; next.D[2] = next.R[0];
        next.R[0] = temp[0];   next.R[3] = temp[1];   next.R[6] = temp[2];
        break;
      }
      case 'B': {
        const temp = [next.U[0], next.U[1], next.U[2]];
        next.U[0] = next.R[2]; next.U[1] = next.R[5]; next.U[2] = next.R[8];
        next.R[2] = next.D[8]; next.R[5] = next.D[7]; next.R[8] = next.D[6];
        next.D[6] = next.L[0]; next.D[7] = next.L[3]; next.D[8] = next.L[6];
        next.L[0] = temp[2];   next.L[3] = temp[1];   next.L[6] = temp[0];
        break;
      }
      case 'R': {
        const temp = [next.U[2], next.U[5], next.U[8]];
        next.U[2] = next.F[2]; next.U[5] = next.F[5]; next.U[8] = next.F[8];
        next.F[2] = next.D[2]; next.F[5] = next.D[5]; next.F[8] = next.D[8];
        next.D[2] = next.B[6]; next.D[5] = next.B[3]; next.D[8] = next.B[0];
        next.B[0] = temp[2];   next.B[3] = temp[1];   next.B[6] = temp[0];
        break;
      }
      case 'L': {
        const temp = [next.U[0], next.U[3], next.U[6]];
        next.U[0] = next.B[8]; next.U[3] = next.B[5]; next.U[6] = next.B[2];
        next.B[2] = next.D[6]; next.B[5] = next.D[3]; next.B[8] = next.D[0];
        next.D[0] = next.F[0]; next.D[3] = next.F[3]; next.D[6] = next.F[6];
        next.F[0] = temp[0];   next.F[3] = temp[1];   next.F[6] = temp[2];
        break;
      }
    }
  }

  return next;
}

// Generate a random valid WCA scramble of given length
export function generateScramble(length = 20): string[] {
  const faces: FaceId[] = ['U', 'D', 'F', 'B', 'R', 'L'];
  const modifiers = ['', "'", '2'];
  const scramble: string[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    let face = faces[Math.floor(Math.random() * faces.length)];
    while (face === lastFace || (face === secondLastFace && FACE_NAMES[face].opposite === lastFace)) {
      face = faces[Math.floor(Math.random() * faces.length)];
    }
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble.push(`${face}${mod}`);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return scramble;
}

// Apply multiple moves sequentially
export function applyMoves(state: CubeState3x3, moves: string[]): CubeState3x3 {
  let curr = state;
  for (const move of moves) {
    curr = applyMove(curr, move);
  }
  return curr;
}

// Check if a 3x3 cube is in solved state
export function isCubeSolved(state: CubeState3x3): boolean {
  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const face of faces) {
    const centerColor = state[face][4];
    if (!centerColor) return false;
    for (let i = 0; i < 9; i++) {
      if (state[face][i] !== centerColor) {
        return false;
      }
    }
  }
  return true;
}
