import type { CubeColor, CubeState3x3, PuzzleTypeId, SolutionStep } from '../../types/cube.ts';

export interface SolverPhase {
  name: string;
  description: string;
  moves: string[];
}

export interface SolverResult {
  success: boolean;
  algorithmName: string;
  totalMoves: number;
  moves: string[];
  steps: SolutionStep[];
  executionTimeMs: number;
  isVerified: boolean;
  phases?: SolverPhase[];
  error?: string;
}

export type GenericPuzzleState = Record<string, (CubeColor | null)[]>;

export interface IPuzzleSolver<TState = CubeState3x3 | GenericPuzzleState> {
  id: string;
  name: string;
  puzzleType: PuzzleTypeId;
  description: string;
  isReady: boolean;
  solve(state: TState, timeoutMs?: number): Promise<SolverResult>;
}
