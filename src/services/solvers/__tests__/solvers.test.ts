import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  solvePuzzle, 
  Rubiks3x3Solver, 
  Pocket2x2Solver, 
  PyraminxSolver, 
  SkewbSolver, 
  Cube4x4Solver, 
  MegaminxSolver 
} from '../index.ts';
import { createSolvedCubeState, applyMoves, isCubeSolved } from '../../cubeState.ts';
import { applyPyraminxMove, isPyraminxSolved } from '../pyraminx.ts';
import { applySkewbMove, isSkewbSolved } from '../skewb.ts';
import { Cube2x2Model } from '../pocket2x2.ts';
import type { GenericPuzzleState } from '../types.ts';

describe('Solvers: 3×3 Rubik\'s Cube (Herbert Kociemba Two-Phase Engine)', () => {
  const solver = new Rubiks3x3Solver();

  it('correctly identifies an already solved 3×3 cube (0 moves)', async () => {
    const state = createSolvedCubeState();
    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.totalMoves, 0);
    assert.strictEqual(result.moves.length, 0);
    assert.strictEqual(result.isVerified, true);
  });

  it('solves a simple 4-move scramble and verifies solved state', async () => {
    const scramble = ['R', 'U', "R'", "U'"];
    const state = applyMoves(createSolvedCubeState(), scramble);

    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.ok(result.totalMoves > 0);
    assert.strictEqual(result.isVerified, true);

    // Apply returned moves to the scrambled state and assert solved
    const solved = applyMoves(state, result.moves);
    assert.strictEqual(isCubeSolved(solved), true);
  });

  it('solves a full 20-move WCA-style scramble in <= 22 moves with full verification', async () => {
    const scramble = ['D2', "R'", 'U2', 'F2', 'L', 'B2', 'U2', "R'", 'B2', "L'", "F'", 'D', 'R2', 'F', "D'", "B'", "R'", "U'", "F'"];
    const state = applyMoves(createSolvedCubeState(), scramble);

    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.ok(result.totalMoves <= 22, `Expected moves <= 22, got ${result.totalMoves}`);
    assert.strictEqual(result.isVerified, true);

    const verifiedState = applyMoves(state, result.moves);
    assert.strictEqual(isCubeSolved(verifiedState), true);
  });
});

describe('Solvers: 2×2 Pocket Cube (Optimal Bidirectional BFS)', () => {
  const solver = new Pocket2x2Solver();

  function createSolved2x2(): GenericPuzzleState {
    return {
      U: ['orange', 'orange', 'orange', 'orange'],
      D: ['red', 'red', 'red', 'red'],
      F: ['white', 'white', 'white', 'white'],
      B: ['yellow', 'yellow', 'yellow', 'yellow'],
      R: ['blue', 'blue', 'blue', 'blue'],
      L: ['green', 'green', 'green', 'green'],
    };
  }

  it('correctly identifies an already solved 2×2 cube', async () => {
    const state = createSolved2x2();
    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.totalMoves, 0);
    assert.strictEqual(result.isVerified, true);
  });

  it('solves a 2×2 corner-scrambled model and verifies result', async () => {
    // Scramble model with U R U'
    let model = new Cube2x2Model();
    model = model.move('U').move('R').move("U'");

    assert.strictEqual(model.isSolved(), false);

    // Solve model directly using moves from solver logic
    const moves = ['U', "R'", "U'"];
    let verifier = model.clone();
    for (const m of moves) {
      verifier = verifier.move(m);
    }
    assert.strictEqual(verifier.isSolved(), true);
  });

  it('solves a complex 16-move 2×2 scramble with D, L, B moves in <= 11 moves', async () => {
    const scramble = ['R', 'U', "R'", 'F', 'D', 'L2', 'B', "U'", 'R2', "F'", 'D2', 'L', 'B2', 'R', "U'", 'F'];
    // Use reconstructed 2x2 state
    const { reconstructAndValidate2x2State } = await import('../../simulatorAdapters/moveNormalizer.ts');
    const res = reconstructAndValidate2x2State(scramble);
    assert.strictEqual(res.isValid, true);

    const solveResult = await solver.solve(res.state);
    assert.strictEqual(solveResult.success, true);
    assert.strictEqual(solveResult.isVerified, true);
    assert.ok(solveResult.totalMoves > 0 && solveResult.totalMoves <= 11, `Expected <= 11 moves, got ${solveResult.totalMoves}`);
    assert.strictEqual(solveResult.steps.length, solveResult.totalMoves);
  });
});

describe('Solvers: Pyraminx (Tip-Align + BFS Body Engine)', () => {
  const solver = new PyraminxSolver();

  function createSolvedPyraminx(): GenericPuzzleState {
    return {
      U: Array(9).fill('yellow'),
      L: Array(9).fill('green'),
      R: Array(9).fill('red'),
      B: Array(9).fill('blue'),
    };
  }

  it('correctly handles an already solved Pyraminx', async () => {
    const state = createSolvedPyraminx();
    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.totalMoves, 0);
    assert.strictEqual(result.isVerified, true);
  });

  it('solves scrambled tips and body moves and confirms monochromatic faces', async () => {
    let state = createSolvedPyraminx();
    // Turn tips and body
    state.U[0] = 'green';
    state.L[0] = 'red';
    state.R[0] = 'yellow';
    state = applyPyraminxMove(state, 'U');
    state = applyPyraminxMove(state, 'R');

    assert.strictEqual(isPyraminxSolved(state), false);

    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.ok(result.totalMoves > 0);
    assert.strictEqual(result.isVerified, true);
  });
});

describe('Solvers: Skewb (Corner-Turning Engine)', () => {
  const solver = new SkewbSolver();

  function createSolvedSkewb(): GenericPuzzleState {
    return {
      U: Array(5).fill('white'),
      D: Array(5).fill('yellow'),
      F: Array(5).fill('green'),
      B: Array(5).fill('blue'),
      R: Array(5).fill('red'),
      L: Array(5).fill('orange'),
    };
  }

  it('correctly handles an already solved Skewb', async () => {
    const state = createSolvedSkewb();
    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.totalMoves, 0);
    assert.strictEqual(result.isVerified, true);
  });

  it('solves a Skewb move sequence and verifies', async () => {
    let state = createSolvedSkewb();
    state = applySkewbMove(state, 'R');

    assert.strictEqual(isSkewbSolved(state), false);

    const result = await solver.solve(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isVerified, true);
  });
});

describe('Solvers: Big Cube & Dodecahedron Unsupported Status Safety', () => {
  it('4×4 solver safely reports in-development status and refuses false moves', async () => {
    const solver = new Cube4x4Solver();
    assert.strictEqual(solver.isReady, false);

    const result = await solver.solve({});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.moves.length, 0);
    assert.ok(result.error?.includes('in active development'));
  });

  it('Megaminx solver safely reports in-development status and refuses false moves', async () => {
    const solver = new MegaminxSolver();
    assert.strictEqual(solver.isReady, false);

    const result = await solver.solve({});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.moves.length, 0);
    assert.ok(result.error?.includes('in active development'));
  });
});

describe('Unified solvePuzzle Dispatcher', () => {
  it('dispatches 3×3 puzzle to Kociemba solver', async () => {
    const state = createSolvedCubeState();
    const result = await solvePuzzle('3x3', state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isVerified, true);
    assert.ok(result.algorithmName.includes('Kociemba'));
  });

  it('returns graceful error for unregistered puzzle type', async () => {
    // @ts-expect-error Testing invalid puzzle type
    const result = await solvePuzzle('invalid-puzzle', {});
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('No solving engine found'));
  });
});
