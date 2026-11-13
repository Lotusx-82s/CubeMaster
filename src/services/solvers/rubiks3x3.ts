import type { CubeState3x3, FaceId, SolutionStep } from '../../types/cube';
import { isCubeSolved } from '../cubeState';
import type { IPuzzleSolver, SolverResult } from './types';

// Convert move token to human readable explanation
export function describeMove(move: string): { description: string; explanation: string } {
  const face = move[0] as FaceId;
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");

  const faceNames: Record<FaceId, string> = {
    U: 'Up (Top)',
    D: 'Down (Bottom)',
    F: 'Front',
    B: 'Back',
    R: 'Right',
    L: 'Left',
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
  id = 'kociemba-cfop-3x3';
  name = "CubeMaster 3x3 Two-Phase & CFOP Engine";
  puzzleType = '3x3' as const;
  description = "Layer-by-Layer and Optimal Two-Phase reduction engine for standard 3x3 Rubik's cubes.";
  isReady = true;

  async solve(state: CubeState3x3): Promise<SolverResult> {
    const startTime = performance.now();

    // Check if cube is already solved
    if (isCubeSolved(state)) {
      return {
        success: true,
        algorithmName: this.name,
        totalMoves: 0,
        steps: [],
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    return {
      success: false,
      algorithmName: this.name,
      totalMoves: 0,
      steps: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      error: "Full Two-Phase/CFOP solver algorithm module is scheduled for Stage 2 integration. You can test step playback with scramble moves or verified states.",
    };
  }
}
