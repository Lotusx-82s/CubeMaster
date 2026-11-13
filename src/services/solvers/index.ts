import type { PuzzleTypeId } from '../../types/cube';
import { Rubiks3x3Solver } from './rubiks3x3';
import type { IPuzzleSolver } from './types';

class SolverRegistry {
  private solvers: Map<string, IPuzzleSolver<any>> = new Map();

  constructor() {
    this.register(new Rubiks3x3Solver());
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
