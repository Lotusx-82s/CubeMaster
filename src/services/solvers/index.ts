import type { CubeState3x3, PuzzleTypeId } from '../../types/cube.ts';
import { Rubiks3x3Solver } from './rubiks3x3.ts';
import { Pocket2x2Solver } from './pocket2x2.ts';
import { PyraminxSolver } from './pyraminx.ts';
import { SkewbSolver } from './skewb.ts';
import { Cube4x4Solver } from './cube4x4.ts';
import { MegaminxSolver } from './megaminx.ts';
import type { GenericPuzzleState, IPuzzleSolver, SolverResult } from './types.ts';

export * from './types.ts';
export { Rubiks3x3Solver, describeMove, parseMoveToStep, stateToFaceletString } from './rubiks3x3.ts';
export { Pocket2x2Solver } from './pocket2x2.ts';
export { PyraminxSolver } from './pyraminx.ts';
export { SkewbSolver } from './skewb.ts';
export { Cube4x4Solver } from './cube4x4.ts';
export { MegaminxSolver } from './megaminx.ts';

class SolverRegistry {
  private solvers: Map<string, IPuzzleSolver<any>> = new Map();

  constructor() {
    this.register(new Rubiks3x3Solver());
    this.register(new Pocket2x2Solver());
    this.register(new PyraminxSolver());
    this.register(new SkewbSolver());
    this.register(new Cube4x4Solver());
    this.register(new MegaminxSolver());
  }

  register(solver: IPuzzleSolver<any>): void {
    this.solvers.set(solver.id, solver);
  }

  getSolverForPuzzle(type: PuzzleTypeId): IPuzzleSolver<any> | undefined {
    for (const solver of this.solvers.values()) {
      if (solver.puzzleType === type) {
        return solver;
      }
    }
    return undefined;
  }

  getAllSolvers(): IPuzzleSolver<any>[] {
    return Array.from(this.solvers.values());
  }
}

export const solverRegistry = new SolverRegistry();

/**
 * High-level unified solving dispatcher.
 * Selects the matching puzzle solver, enforces timeout protection,
 * and executes mandatory post-solve verification.
 */
export async function solvePuzzle(
  puzzleType: PuzzleTypeId,
  state: CubeState3x3 | GenericPuzzleState,
  timeoutMs = 8000
): Promise<SolverResult> {
  const solver = solverRegistry.getSolverForPuzzle(puzzleType);

  if (!solver) {
    return {
      success: false,
      algorithmName: 'None',
      totalMoves: 0,
      moves: [],
      steps: [],
      executionTimeMs: 0,
      isVerified: false,
      error: `No solving engine found for puzzle type '${puzzleType}'.`,
    };
  }

  if (!solver.isReady) {
    return solver.solve(state, timeoutMs);
  }

  return solver.solve(state, timeoutMs);
}
