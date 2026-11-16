import type { CubeColor, CubeState3x3, FaceId, SolutionStep } from '../../types/cube.ts';
import { isCubeSolved, cloneCubeState, applyMove, applyMoves } from '../cubeState.ts';
import type { IPuzzleSolver, SolverResult } from './types.ts';
import Cube from 'cubejs';

let isKociembaInitialized = false;

function ensureKociembaInitialized() {
  if (!isKociembaInitialized) {
    Cube.initSolver();
    isKociembaInitialized = true;
  }
}

/**
 * Converts a standard CubeState3x3 object to Herbert Kociemba 54-character facelet format:
 * U (9 chars), R (9 chars), F (9 chars), D (9 chars), L (9 chars), B (9 chars)
 */
export function stateToFaceletString(state: CubeState3x3): string {
  const colorToFace: Record<CubeColor, string> = {
    [state.U[4] || 'white']: 'U',
    [state.R[4] || 'red']: 'R',
    [state.F[4] || 'green']: 'F',
    [state.D[4] || 'yellow']: 'D',
    [state.L[4] || 'orange']: 'L',
    [state.B[4] || 'blue']: 'B',
  } as Record<CubeColor, string>;

  const faceOrder: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let str = '';

  for (const face of faceOrder) {
    const faceletList = state[face];
    for (let i = 0; i < 9; i++) {
      const color = faceletList[i];
      str += (color ? (colorToFace[color] || 'U') : 'U');
    }
  }

  return str;
}

// Convert move token to human readable explanation
export function describeMove(move: string): { description: string; explanation: string } {
  const face = move[0] as FaceId;
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");

  const faceNames: Record<FaceId, string> = {
    U: 'Up (White)',
    D: 'Down (Yellow)',
    F: 'Front (Green)',
    B: 'Back (Blue)',
    R: 'Right (Red)',
    L: 'Left (Orange)',
  };

  const name = faceNames[face] || face;
  let angle = '90° clockwise';
  let dirWord = 'clockwise';

  if (isDouble) {
    angle = '180° half-turn';
    dirWord = '180 degrees';
  } else if (isPrime) {
    angle = '90° counter-clockwise';
    dirWord = 'counter-clockwise';
  }

  return {
    description: `Rotate ${name} face ${angle} (${move})`,
    explanation: `Turn the ${name} layer ${dirWord} as viewed directly facing this side.`,
  };
}

export function parseMoveToStep(move: string): SolutionStep {
  const face = move[0] as FaceId;
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");
  const angle = isDouble ? 180 : isPrime ? -90 : 90;
  const { description, explanation } = describeMove(move);

  return {
    move,
    face,
    angle,
    description,
    explanation,
  };
}

export class Rubiks3x3Solver implements IPuzzleSolver<CubeState3x3> {
  id = 'kociemba-two-phase-3x3';
  name = "Herbert Kociemba Two-Phase 3×3 Engine";
  puzzleType = '3x3' as const;
  description = "Mathematically optimal two-phase algorithm that reduces the 3×3 Rubik's cube to the G1 subgroup <U, D, R2, L2, F2, B2> and solves within 22 moves.";
  isReady = true;

  async solve(state: CubeState3x3, timeoutMs = 8000): Promise<SolverResult> {
    const startTime = performance.now();

    // 1. Check if cube is already in solved state
    if (isCubeSolved(state)) {
      return {
        success: true,
        algorithmName: this.name,
        totalMoves: 0,
        moves: [],
        steps: [],
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: true,
      };
    }

    try {
      // 2. Initialize Kociemba solver lookup tables if needed
      ensureKociembaInitialized();

      // 3. Convert 3x3 state to Kociemba 54-facelet string
      const faceletString = stateToFaceletString(state);

      // 4. Construct Cube instance
      const cube = Cube.fromString(faceletString);

      if (cube.isSolved()) {
        return {
          success: true,
          algorithmName: this.name,
          totalMoves: 0,
          moves: [],
          steps: [],
          executionTimeMs: Math.round(performance.now() - startTime),
          isVerified: true,
        };
      }

      // 5. Solve using two-phase algorithm with timeout wrapper
      const solvePromise = new Promise<string>((resolve) => {
        const solution = cube.solve();
        resolve(solution);
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Solver timed out after ${timeoutMs}ms.`)), timeoutMs);
      });

      const rawSolution = await Promise.race([solvePromise, timeoutPromise]);
      const moves = rawSolution.trim().split(/\s+/).filter(Boolean);

      // 6. Mandatory Verification: Apply every move to initial state and verify solved result
      let verificationState = cloneCubeState(state);
      const steps: SolutionStep[] = [];

      for (const move of moves) {
        verificationState = applyMove(verificationState, move);
        steps.push({
          ...parseMoveToStep(move),
          stateSnapshot: cloneCubeState(verificationState),
        });
      }

      const isVerified = isCubeSolved(verificationState);

      if (!isVerified) {
        // Fallback check: check if inverse moves or center-relative orientation caused mismatch
        const doubleCheck = applyMoves(state, moves);
        if (!isCubeSolved(doubleCheck)) {
          return {
            success: false,
            algorithmName: this.name,
            totalMoves: 0,
            moves: [],
            steps: [],
            executionTimeMs: Math.round(performance.now() - startTime),
            isVerified: false,
            error: "Verification failed: Generated move sequence did not yield a completely solved 3×3 state.",
          };
        }
      }

      return {
        success: true,
        algorithmName: this.name,
        totalMoves: moves.length,
        moves,
        steps,
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: true,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown solver error';
      return {
        success: false,
        algorithmName: this.name,
        totalMoves: 0,
        moves: [],
        steps: [],
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: false,
        error: `3×3 Solver Engine error: ${message}`,
      };
    }
  }
}
