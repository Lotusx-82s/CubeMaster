import type { CubeState3x3, PuzzleTypeId, SolutionStep } from '../../types/cube';

export interface SolverResult {
  success: boolean;
  algorithmName: string;
  totalMoves: number;
  steps: SolutionStep[];
  executionTimeMs: number;
  error?: string;
}

export interface IPuzzleSolver<TState = CubeState3x3> {
  id: string;
  name: string;
  puzzleType: PuzzleTypeId;
  description: string;
  isReady: boolean;
  solve(state: TState): Promise<SolverResult>;
}
