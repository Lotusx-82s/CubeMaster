import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { 
  createSolvedCubeState, 
  applyMoves, 
  isCubeSolved 
} from '../../cubeState.ts';
import type { CubeColor, FaceId } from '../../../types/cube.ts';
import { 
  parseCameraScanInput, 
  parseManualInput, 
  parseUrlInput 
} from '../parsers.ts';
import { 
  areNormalizedStatesEquivalent, 
  normalizedToCubeState
} from '../normalizedState.ts';
import { validatePuzzleState } from '../../validator/index.ts';
import { solvePuzzle } from '../../solvers/index.ts';
import { formatSolutionString } from '../../solutionExport.ts';
import type { ColorDetectionResult } from '../../cvColorExtractor.ts';

describe('Unified Puzzle-State Architecture: End-to-End Pipeline', () => {
  const TEST_SCRAMBLE = ['R', 'U', "R'", "U'", 'F2', 'D', 'L2', "U'"];

  // Generate ground-truth scrambled 3x3 cube state
  const solvedCube = createSolvedCubeState();
  const scrambledCube = applyMoves(solvedCube, TEST_SCRAMBLE);

  it('Pipeline Stage 1 & 2: Parses the EXACT SAME scramble through all 3 input methods into equivalent normalized states', () => {
    // 1. Camera / Photo Scanning Input Method
    const simulatedCameraDetections: Record<string, ColorDetectionResult[]> = {};
    const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (const face of faces) {
      simulatedCameraDetections[face] = scrambledCube[face].map((color) => ({
        color: color as CubeColor,
        confidence: 96,
        sampledRgb: { r: 240, g: 240, b: 240 },
        sampledHex: '#f1f5f9',
      }));
    }
    const cameraNormalized = parseCameraScanInput('3x3', simulatedCameraDetections, {
      scannedFaces: faces,
      averageConfidence: 96,
    });

    // 2. Manual Color Input Method
    const manualNormalized = parseManualInput('3x3', scrambledCube, {
      notes: 'Test manual sticker painter input',
    });

    // 3. URL Import Method (Alg.cubing.net URL with identical scramble)
    const simulatorUrl = 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_U-&puzzle=3x3x3';
    const urlImportResult = parseUrlInput(simulatorUrl);
    assert.strictEqual(urlImportResult.success, true, 'URL Import must succeed for valid simulator URL');
    const urlNormalized = urlImportResult.state!;

    // Assert provenance and source preservation
    assert.strictEqual(cameraNormalized.source, 'camera');
    assert.strictEqual(manualNormalized.source, 'manual');
    assert.strictEqual(urlNormalized.source, 'url');
    assert.strictEqual(cameraNormalized.puzzleType, '3x3');
    assert.strictEqual(manualNormalized.puzzleType, '3x3');
    assert.strictEqual(urlNormalized.puzzleType, '3x3');

    // Assert equivalence across all three input representations
    assert.strictEqual(
      areNormalizedStatesEquivalent(cameraNormalized, manualNormalized),
      true,
      'Camera scan normalized state must be equivalent to Manual input normalized state'
    );
    assert.strictEqual(
      areNormalizedStatesEquivalent(manualNormalized, urlNormalized),
      true,
      'Manual input normalized state must be equivalent to URL import normalized state'
    );
    assert.strictEqual(
      areNormalizedStatesEquivalent(cameraNormalized, urlNormalized),
      true,
      'Camera scan normalized state must be equivalent to URL import normalized state'
    );

    // Assert physical piece decomposition & invariant preservation
    assert.strictEqual(cameraNormalized.pieces.length, 26, '3x3 should decompose into exactly 26 pieces (6 centers + 12 edges + 8 corners)');
    assert.strictEqual(manualNormalized.pieces.length, 26);
    assert.strictEqual(urlNormalized.pieces.length, 26);

    // Verify stats
    assert.strictEqual(cameraNormalized.stats.totalStickers, 54);
    assert.strictEqual(cameraNormalized.stats.filledStickers, 54);
    assert.strictEqual(cameraNormalized.stats.isComplete, true);
    for (const c of ['white', 'yellow', 'green', 'blue', 'red', 'orange']) {
      assert.strictEqual(cameraNormalized.stats.colorDistribution[c], 9, `Color ${c} must have exactly 9 stickers`);
      assert.strictEqual(urlNormalized.stats.colorDistribution[c], 9);
    }
  });

  it('Pipeline Stage 3 & 4: Validates the NormalizedPuzzleState across all 3 input methods with 0 errors', () => {
    // Generate inputs
    const simulatedCameraDetections: Record<string, ColorDetectionResult[]> = {};
    const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (const face of faces) {
      simulatedCameraDetections[face] = scrambledCube[face].map((color) => ({
        color: color as CubeColor,
        confidence: 95,
        sampledRgb: { r: 240, g: 240, b: 240 },
        sampledHex: '#f1f5f9',
      }));
    }
    const cameraNormalized = parseCameraScanInput('3x3', simulatedCameraDetections);
    const manualNormalized = parseManualInput('3x3', scrambledCube);
    const urlNormalized = parseUrlInput('https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_U-&puzzle=3x3x3').state!;

    // Validate each normalized state through universal validator
    const cameraVal = validatePuzzleState(cameraNormalized);
    const manualVal = validatePuzzleState(manualNormalized);
    const urlVal = validatePuzzleState(urlNormalized);

    assert.strictEqual(cameraVal.isValid, true, 'Camera normalized state must validate as legally solvable');
    assert.strictEqual(manualVal.isValid, true, 'Manual normalized state must validate as legally solvable');
    assert.strictEqual(urlVal.isValid, true, 'URL import normalized state must validate as legally solvable');

    assert.strictEqual(cameraVal.issues.length, 0);
    assert.strictEqual(manualVal.issues.length, 0);
    assert.strictEqual(urlVal.issues.length, 0);
  });

  it('Pipeline Stage 5 & 6: Compatible solver execution & post-solve verification for all 3 inputs', async () => {
    const simulatedCameraDetections: Record<string, ColorDetectionResult[]> = {};
    const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (const face of faces) {
      simulatedCameraDetections[face] = scrambledCube[face].map((color) => ({
        color: color as CubeColor,
        confidence: 95,
        sampledRgb: { r: 240, g: 240, b: 240 },
        sampledHex: '#f1f5f9',
      }));
    }
    const cameraNormalized = parseCameraScanInput('3x3', simulatedCameraDetections);
    const manualNormalized = parseManualInput('3x3', scrambledCube);
    const urlNormalized = parseUrlInput('https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_U-&puzzle=3x3x3').state!;

    // Solve directly by passing NormalizedPuzzleState
    const cameraSol = await solvePuzzle(cameraNormalized);
    const manualSol = await solvePuzzle(manualNormalized);
    const urlSol = await solvePuzzle(urlNormalized);

    // Verify solver outputs
    assert.strictEqual(cameraSol.success, true);
    assert.strictEqual(manualSol.success, true);
    assert.strictEqual(urlSol.success, true);

    assert.strictEqual(cameraSol.isVerified, true, 'Camera solution must be verified against simulated cube physics');
    assert.strictEqual(manualSol.isVerified, true, 'Manual solution must be verified against simulated cube physics');
    assert.strictEqual(urlSol.isVerified, true, 'URL solution must be verified against simulated cube physics');

    assert.strictEqual(cameraSol.moves.length, manualSol.moves.length, 'Solution lengths must be identical');
    assert.strictEqual(manualSol.moves.length, urlSol.moves.length, 'Solution lengths must be identical');

    // Confirm that applying the generated solution moves restores a solved cube
    const finalState = applyMoves(scrambledCube, cameraSol.moves);
    assert.strictEqual(isCubeSolved(finalState), true, 'Applying solution to initial scrambled cube must produce solved state');
  });

  it('Pipeline Stage 7: Bidirectional 3D and Text sequence synchronization', async () => {
    const manualNormalized = parseManualInput('3x3', scrambledCube);
    const solution = await solvePuzzle(manualNormalized);

    assert.strictEqual(solution.success, true);
    const steps = solution.steps;
    assert.ok(steps.length > 0, 'Solution must contain steps');

    // 1. Text output formatting
    const textNotation = formatSolutionString(steps);
    assert.ok(typeof textNotation === 'string' && textNotation.length > 0);
    assert.strictEqual(textNotation, solution.moves.join(' '));

    // 2. Step forward synchronization: Each step snapshot must correctly match intermediate state
    let progressiveState = normalizedToCubeState(manualNormalized);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      assert.ok(step.stateSnapshot, `Step ${i + 1} must preserve state snapshot for 3D synchronization`);
      progressiveState = applyMoves(progressiveState, [step.move]);
      
      // Check snapshot against progressive simulation
      for (const f of ['U', 'R', 'F', 'D', 'L', 'B'] as FaceId[]) {
        assert.deepStrictEqual(step.stateSnapshot![f], progressiveState[f]);
      }
    }

    // 3. Final step must be solved
    const finalStep = steps[steps.length - 1];
    assert.strictEqual(isCubeSolved(finalStep.stateSnapshot!), true, 'Final step snapshot in 3D timeline must be solved');
  });

  it('Multi-puzzle architecture support: 2×2 Pocket Cube, Pyraminx, and Skewb', async () => {
    // 1. 2x2 Pocket Cube
    const solved2x2: Record<string, (CubeColor | null)[]> = {
      U: ['white', 'white', 'white', 'white'],
      D: ['yellow', 'yellow', 'yellow', 'yellow'],
      F: ['green', 'green', 'green', 'green'],
      B: ['blue', 'blue', 'blue', 'blue'],
      R: ['red', 'red', 'red', 'red'],
      L: ['orange', 'orange', 'orange', 'orange'],
    };
    const norm2x2 = parseManualInput('2x2', solved2x2);
    assert.strictEqual(norm2x2.puzzleType, '2x2');
    assert.strictEqual(norm2x2.stats.totalStickers, 24);
    const val2x2 = validatePuzzleState(norm2x2);
    assert.strictEqual(val2x2.isValid, true);
    const sol2x2 = await solvePuzzle(norm2x2);
    assert.strictEqual(sol2x2.success, true);
    assert.strictEqual(sol2x2.totalMoves, 0, 'Solved 2x2 requires 0 moves');

    // 2. Pyraminx
    const solvedPyraminx: Record<string, (CubeColor | null)[]> = {
      U: Array(9).fill('yellow'),
      L: Array(9).fill('green'),
      R: Array(9).fill('red'),
      B: Array(9).fill('blue'),
    };
    const normPyraminx = parseManualInput('pyraminx', solvedPyraminx);
    assert.strictEqual(normPyraminx.puzzleType, 'pyraminx');
    assert.strictEqual(normPyraminx.stats.totalStickers, 36);
    const valPyraminx = validatePuzzleState(normPyraminx);
    assert.strictEqual(valPyraminx.isValid, true);
    const solPyraminx = await solvePuzzle(normPyraminx);
    assert.strictEqual(solPyraminx.success, true);
    assert.strictEqual(solPyraminx.totalMoves, 0);

    // 3. Skewb
    const solvedSkewb: Record<string, (CubeColor | null)[]> = {
      U: Array(5).fill('white'),
      D: Array(5).fill('yellow'),
      F: Array(5).fill('green'),
      B: Array(5).fill('blue'),
      R: Array(5).fill('red'),
      L: Array(5).fill('orange'),
    };
    const normSkewb = parseManualInput('skewb', solvedSkewb);
    assert.strictEqual(normSkewb.puzzleType, 'skewb');
    assert.strictEqual(normSkewb.stats.totalStickers, 30);
    const valSkewb = validatePuzzleState(normSkewb);
    assert.strictEqual(valSkewb.isValid, true);
    const solSkewb = await solvePuzzle(normSkewb);
    assert.strictEqual(solSkewb.success, true);
    assert.strictEqual(solSkewb.totalMoves, 0);
  });
});
