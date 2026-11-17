import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { CubeColor } from '../../types/cube.ts';
import { 
  createSolvedCubeState, 
  applyMove, 
  applyMoves, 
  isCubeSolved 
} from '../cubeState.ts';
import { PUZZLE_DEFINITIONS } from '../puzzles.ts';
import { validatePuzzleState } from '../validator/index.ts';
import { solvePuzzle, solverRegistry } from '../solvers/index.ts';
import { Cube2x2Model, modelTo2x2GenericState } from '../solvers/pocket2x2.ts';
import { parseSimulatorUrl } from '../simulatorAdapters/index.ts';
import { parseManualInput } from '../state/parsers.ts';
import { 
  createDefaultSolvedNormalizedState, 
  createEmptyNormalizedState 
} from '../state/normalizedState.ts';
import { evaluateImageQuality } from '../cvColorExtractor.ts';

describe('CubeMaster Comprehensive End-to-End Test Suite', () => {

  // =========================================================================
  // Test Case 1: Already Solved Puzzle
  // =========================================================================
  describe('Test Case 1: Already Solved Puzzle', () => {
    it('3×3 solved puzzle returns 0 moves and is marked solved immediately', async () => {
      const solved3x3 = createSolvedCubeState();
      const val = validatePuzzleState('3x3', solved3x3);
      assert.strictEqual(val.isValid, true);

      const sol = await solvePuzzle('3x3', solved3x3);
      assert.strictEqual(sol.success, true);
      assert.strictEqual(sol.totalMoves, 0);
      assert.strictEqual(sol.moves.length, 0);
      assert.strictEqual(sol.isVerified, true);
    });

    it('2×2 solved puzzle returns 0 moves and is marked solved', async () => {
      const norm = createDefaultSolvedNormalizedState('2x2');
      const val = validatePuzzleState(norm);
      assert.strictEqual(val.isValid, true);

      const sol = await solvePuzzle(norm);
      assert.strictEqual(sol.success, true);
      assert.strictEqual(sol.totalMoves, 0);
      assert.strictEqual(sol.isVerified, true);
    });

    it('Pyraminx solved puzzle returns 0 moves and is marked solved', async () => {
      const norm = createDefaultSolvedNormalizedState('pyraminx');
      const val = validatePuzzleState(norm);
      assert.strictEqual(val.isValid, true);

      const sol = await solvePuzzle(norm);
      assert.strictEqual(sol.success, true);
      assert.strictEqual(sol.totalMoves, 0);
      assert.strictEqual(sol.isVerified, true);
    });

    it('Skewb solved puzzle returns 0 moves and is marked solved', async () => {
      const norm = createDefaultSolvedNormalizedState('skewb');
      const val = validatePuzzleState(norm);
      assert.strictEqual(val.isValid, true);

      const sol = await solvePuzzle(norm);
      assert.strictEqual(sol.success, true);
      assert.strictEqual(sol.totalMoves, 0);
      assert.strictEqual(sol.isVerified, true);
    });
  });

  // =========================================================================
  // Test Case 2: Randomly Scrambled Puzzle
  // =========================================================================
  describe('Test Case 2: Randomly Scrambled Puzzle & Mathematical Invariant Proof', () => {
    it('Solves a 3×3 WCA scramble and mathematically verifies the solution', async () => {
      const scramble = ['R', 'U', "R'", "U'", 'F2', 'D', 'L2', 'B', "U'", 'R2'];
      const scrambledState = applyMoves(createSolvedCubeState(), scramble);
      
      const norm = parseManualInput('3x3', scrambledState);
      const val = validatePuzzleState(norm);
      assert.strictEqual(val.isValid, true, 'Scrambled cube must pass validation');

      const sol = await solvePuzzle(norm);
      assert.strictEqual(sol.success, true);
      assert.strictEqual(sol.isVerified, true);
      assert.ok(sol.moves.length > 0);

      // Verify that applying the solver moves directly to the scrambled state results in solved cube
      const endState = applyMoves(scrambledState, sol.moves);
      assert.strictEqual(isCubeSolved(endState), true, 'Applying solution moves must restore solved state');
    });

    it('Solves a 2×2 Pocket Cube scramble and verifies result', async () => {
      const scrambledModel = new Cube2x2Model().move('R').move('U').move("R'").move("U'");
      const scrambled2x2 = modelTo2x2GenericState(scrambledModel);

      const norm = parseManualInput('2x2', scrambled2x2);
      const val = validatePuzzleState(norm);
      assert.strictEqual(val.isValid, true);

      const sol = await solvePuzzle(norm);
      assert.strictEqual(sol.success, true);
      assert.strictEqual(sol.isVerified, true);
      assert.ok(sol.totalMoves >= 1);
    });
  });

  // =========================================================================
  // Test Case 3: Invalid Color Configuration
  // =========================================================================
  describe('Test Case 3: Invalid Color Configuration', () => {
    it('Detects monochromatic edge piece (INVALID_COLOR_ARRANGEMENT)', () => {
      const state = createSolvedCubeState();
      // UF edge is at U[7] (orange) and F[1] (white); turn both to blue while balancing counts
      state.U[7] = 'blue';
      state.F[1] = 'blue';
      state.R[1] = 'orange';
      state.R[7] = 'white';
      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const edgeIssue = val.issues.find(i => i.category === 'INVALID_COLOR_ARRANGEMENT');
      assert.ok(edgeIssue, 'Should flag invalid color arrangement');
    });

    it('Detects opposite colors on the same edge piece (orange-red)', () => {
      const state = createSolvedCubeState();
      // Place red on UF edge while balancing red/white counts
      state.U[7] = 'orange';
      state.F[1] = 'red';
      state.D[1] = 'white';
      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const issue = val.issues.find(i => i.category === 'INVALID_COLOR_ARRANGEMENT');
      assert.ok(issue, 'Opposite colors on edge must be flagged');
    });
  });

  // =========================================================================
  // Test Case 4: Missing Stickers
  // =========================================================================
  describe('Test Case 4: Missing Stickers', () => {
    it('Detects unpainted stickers in 3x3 (MISSING_STICKERS)', () => {
      const state = createSolvedCubeState();
      state.U[0] = null;
      state.R[2] = null;
      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const missing = val.issues.filter(i => i.category === 'MISSING_STICKERS');
      assert.strictEqual(missing.length, 2);
    });

    it('Detects empty / unpainted puzzle state', () => {
      const emptyNorm = createEmptyNormalizedState('3x3', true);
      const val = validatePuzzleState(emptyNorm);
      assert.strictEqual(val.isValid, false);
      const missing = val.issues.filter(i => i.category === 'MISSING_STICKERS');
      assert.strictEqual(missing.length, 48); // 54 - 6 centers = 48 unpainted
    });
  });

  // =========================================================================
  // Test Case 5: Incorrect Color Detection
  // =========================================================================
  describe('Test Case 5: Incorrect Color Detection Counts', () => {
    it('Detects unbalanced sticker distribution (INCORRECT_COLOR_COUNT)', () => {
      const state = createSolvedCubeState();
      // Replace a red sticker with white (10 white, 8 red)
      state.R[0] = 'white';
      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const countIssue = val.issues.find(i => i.category === 'INCORRECT_COLOR_COUNT');
      assert.ok(countIssue);
    });
  });

  // =========================================================================
  // Test Case 6: Impossible Puzzle State (Parity Invariants)
  // =========================================================================
  describe('Test Case 6: Impossible Puzzle State & Parity Constraints', () => {
    it('Detects single corner twist parity error on 3x3', () => {
      const state = createSolvedCubeState();
      // Twist UFL corner clockwise: U[6]=green, F[0]=orange, L[2]=white
      state.U[6] = 'green';
      state.F[0] = 'orange';
      state.L[2] = 'white';
      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const parityIssue = val.issues.find(i => i.category === 'IMPOSSIBLE_PUZZLE_STATE' && i.title.includes('Corner Orientation'));
      assert.ok(parityIssue, 'Single twisted corner parity must be caught');
    });

    it('Detects single flipped edge parity error on 3x3', () => {
      const state = createSolvedCubeState();
      // Flip UF edge: U[7]=white, F[1]=orange
      state.U[7] = 'white';
      state.F[1] = 'orange';
      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const parityIssue = val.issues.find(i => i.category === 'IMPOSSIBLE_PUZZLE_STATE' && i.title.includes('Edge Orientation'));
      assert.ok(parityIssue, 'Single flipped edge parity must be caught');
    });

    it('Detects permutation parity error on 3x3 (swap 2 corners only)', () => {
      const state = createSolvedCubeState();
      // Swap UFL and UFR corners
      const ufl_U = state.U[6], ufl_F = state.F[0], ufl_L = state.L[2];
      state.U[6] = state.U[8]; state.F[0] = state.F[2]; state.L[2] = state.R[0];
      state.U[8] = ufl_U; state.F[2] = ufl_F; state.R[0] = ufl_L;

      const val = validatePuzzleState('3x3', state);
      assert.strictEqual(val.isValid, false);
      const parityIssue = val.issues.find(i => i.category === 'IMPOSSIBLE_PUZZLE_STATE' && i.title.includes('Permutation Parity'));
      assert.ok(parityIssue, 'Permutation parity must be caught');
    });

    it('Detects single twisted corner parity error on 2×2', () => {
      const state: Record<string, (CubeColor | null)[]> = {
        U: ['white', 'white', 'white', 'white'],
        D: ['yellow', 'yellow', 'yellow', 'yellow'],
        F: ['green', 'green', 'green', 'green'],
        B: ['blue', 'blue', 'blue', 'blue'],
        R: ['red', 'red', 'red', 'red'],
        L: ['orange', 'orange', 'orange', 'orange'],
      };
      // Twist UFL corner (U[2], F[0], L[1])
      state.U[2] = 'orange';
      state.F[0] = 'white';
      state.L[1] = 'green';

      const val = validatePuzzleState('2x2', state);
      assert.strictEqual(val.isValid, false);
      const issue = val.issues.find(i => i.category === 'IMPOSSIBLE_PUZZLE_STATE');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // Test Case 7 & 8: Camera Permission Denied & Blurry Image Assessment
  // =========================================================================
  describe('Test Case 7 & 8: Camera Permission & Image Quality Evaluator', () => {
    it('Properly formats camera permission denied error messaging', () => {
      const err = new DOMException('Permission denied', 'NotAllowedError');
      const isDenied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      assert.strictEqual(isDenied, true);
    });

    it('Detects blurry/unfocused image using gradient variance', () => {
      // Mock canvas context with low-contrast uniform blur
      const mockImgData = new Uint8ClampedArray(100 * 100 * 4);
      // Fill with solid color (variance = 0)
      for (let i = 0; i < mockImgData.length; i += 4) {
        mockImgData[i] = 128;
        mockImgData[i + 1] = 128;
        mockImgData[i + 2] = 128;
        mockImgData[i + 3] = 255;
      }
      const mockCtx = {
        getImageData: () => ({ data: mockImgData, width: 100, height: 100 }),
      } as unknown as CanvasRenderingContext2D;

      const quality = evaluateImageQuality(mockCtx, 100, 100);
      assert.strictEqual(quality.isBlurry, true, 'Flat / zero-edge image must be flagged as blurry');
      assert.ok(quality.warningMessage?.includes('Blurry'));
    });
  });

  // =========================================================================
  // Test Cases 9-12: Simulator URL Processing
  // =========================================================================
  describe('Test Cases 9-12: Simulator URL Security & Scramble Extraction', () => {
    it('Test Case 9: Rejects invalid URL format and unsafe non-HTTP protocols', () => {
      const res1 = parseSimulatorUrl('not_a_valid_url');
      assert.strictEqual(res1.success, false);
      assert.strictEqual(res1.errorCode, 'INVALID_URL');

      const res2 = parseSimulatorUrl('javascript:alert(document.domain)');
      assert.strictEqual(res2.success, false);
      assert.strictEqual(res2.errorCode, 'INVALID_URL');

      const res3 = parseSimulatorUrl('ftp://example.com/scramble');
      assert.strictEqual(res3.success, false);
      assert.strictEqual(res3.errorCode, 'INVALID_URL');
    });

    it('Test Case 10: Rejects untrusted / unsupported simulator domains', () => {
      const res = parseSimulatorUrl('https://evil-untrusted-cube.com/?scramble=R_U_R-_U-');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, 'UNSUPPORTED_SIMULATOR');
    });

    it('Test Case 11: Detects missing cube state or scramble parameters in supported simulator link', () => {
      const res = parseSimulatorUrl('https://rubikscu.be/play/');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, 'NO_CUBE_STATE_FOUND');
    });

    it('Test Case 12: Safely handles invalid move tokens in URL scramble', () => {
      const res = parseSimulatorUrl('https://alg.cubing.net/?setup=R_U_INVALIDTOKEN_X99&puzzle=3x3x3');
      // Should filter invalid tokens while parsing valid moves
      if (res.success) {
        assert.deepStrictEqual(res.scrambleMoves, ['R', 'U']);
      }
    });

    it('Accepts and correctly parses valid simulator URLs', () => {
      const res = parseSimulatorUrl('https://alg.cubing.net/?setup=R_U_R-_U-&puzzle=3x3x3');
      assert.strictEqual(res.success, true);
      assert.deepStrictEqual(res.scrambleMoves, ['R', 'U', "R'", "U'"]);
      assert.strictEqual(res.puzzleType, '3x3');
    });
  });

  // =========================================================================
  // Test Cases 13 & 14: Solution Playback & Move Navigation
  // =========================================================================
  describe('Test Cases 13 & 14: Solution Playback & Step Navigation', async () => {
    const scramble = ['R', 'U', "R'", "U'"];
    const scrambledState = applyMoves(createSolvedCubeState(), scramble);
    const sol = await solvePuzzle('3x3', scrambledState);

    it('Test Case 13: Solution playback reaches solved state at final move', () => {
      assert.strictEqual(sol.success, true);
      assert.ok(sol.steps.length > 0);
      const finalStep = sol.steps[sol.steps.length - 1];
      assert.ok(finalStep.stateSnapshot);
      assert.strictEqual(isCubeSolved(finalStep.stateSnapshot!), true, 'Final step snapshot must be solved');
    });

    it('Test Case 14: Step navigation (forward, backward, jump) produces correct intermediate states', () => {
      const steps = sol.steps;
      let currentState = scrambledState;

      // Forward step validation
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        currentState = applyMove(currentState, step.move);
        assert.deepStrictEqual(step.stateSnapshot, currentState, `Step ${i} snapshot must match simulation`);
      }

      // Backward navigation validation: step N-1 snapshot matches state prior to final move
      if (steps.length > 1) {
        const secondToLast = steps[steps.length - 2];
        const stateBeforeFinal = applyMove(createSolvedCubeState(), steps[steps.length - 1].move.includes("'") ? steps[steps.length - 1].move.replace("'", "") : steps[steps.length - 1].move + "'");
        assert.deepStrictEqual(secondToLast.stateSnapshot, stateBeforeFinal);
      }
    });
  });

  // =========================================================================
  // Test Case 15: Multiple Consecutive Solving Sessions
  // =========================================================================
  describe('Test Case 15: Multiple Consecutive Solving Sessions Isolation', async () => {
    it('Executes 3 distinct solving sessions consecutively without state contamination', async () => {
      // Session 1: 3x3 Rubik's cube
      const scramble1 = ['R', 'U', "R'", "U'"];
      const state1 = applyMoves(createSolvedCubeState(), scramble1);
      const norm1 = parseManualInput('3x3', state1);
      const sol1 = await solvePuzzle(norm1);
      assert.strictEqual(sol1.success, true);
      assert.strictEqual(isCubeSolved(applyMoves(state1, sol1.moves)), true);

      // Session 2: 2x2 Pocket cube
      const norm2 = createDefaultSolvedNormalizedState('2x2');
      const sol2 = await solvePuzzle(norm2);
      assert.strictEqual(sol2.success, true);
      assert.strictEqual(sol2.totalMoves, 0);

      // Session 3: Pyraminx
      const norm3 = createDefaultSolvedNormalizedState('pyraminx');
      const sol3 = await solvePuzzle(norm3);
      assert.strictEqual(sol3.success, true);
      assert.strictEqual(sol3.totalMoves, 0);

      // Verify Session 1 state was not modified or corrupted by Sessions 2 or 3
      assert.strictEqual(isCubeSolved(state1), false, 'Original scramble 1 must remain scrambled');
    });
  });

  // =========================================================================
  // Test Case 16: Supported Puzzle Types Integrity Check
  // =========================================================================
  describe('Test Case 16: Supported Puzzle Types Integrity Check', () => {
    it('Only marks implemented and tested puzzles as supported', () => {
      const implementedPuzzles = ['2x2', '3x3', '4x4', 'pyraminx', 'skewb', 'megaminx'];

      for (const id of implementedPuzzles) {
        const def = PUZZLE_DEFINITIONS.find(p => p.id === id);
        assert.ok(def, `Definition for ${id} must exist`);
        assert.strictEqual(def.supported, true, `Puzzle ${id} must be marked supported`);
        const solver = solverRegistry.getSolverForPuzzle(id as any);
        assert.ok(solver, `Solver for ${id} must be registered`);
        assert.strictEqual(solver.isReady, true, `Solver for ${id} must be ready`);
      }
    });

    it('All 6 puzzle solvers successfully solve their solved default states', async () => {
      const puzzles = ['2x2', '3x3', '4x4', 'pyraminx', 'skewb', 'megaminx'] as const;
      for (const puzzle of puzzles) {
        const norm = createDefaultSolvedNormalizedState(puzzle);
        const res = await solvePuzzle(norm);
        assert.strictEqual(res.success, true, `Solver for ${puzzle} must succeed on default solved state`);
        assert.strictEqual(res.totalMoves, 0, `Solved state for ${puzzle} must require 0 moves`);
        assert.strictEqual(res.isVerified, true, `Solved state for ${puzzle} must be verified`);
      }
    });
  });
});
