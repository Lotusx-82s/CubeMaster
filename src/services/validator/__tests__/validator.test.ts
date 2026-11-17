import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  validatePuzzleState, 
  validateCubeState3x3,
  validateCube3x3,
  validateCube2x2,
  validateCube4x4,
  validatePyraminx,
  validateSkewb,
  validateMegaminx 
} from '../index.ts';
import { createSolvedCubeState, applyMoves } from '../../cubeState.ts';
import type { CubeColor } from '../../../types/cube.ts';

describe('3×3 Rubik\'s Cube Validation Engine', () => {
  it('validates a standard solved 3×3 cube successfully', () => {
    const solved = createSolvedCubeState();
    const result = validateCubeState3x3(solved);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.expectedCountPerColor, 9);
  });

  it('validates a legally scrambled 3×3 cube successfully', () => {
    const solved = createSolvedCubeState();
    const scrambled = applyMoves(solved, ['R', 'U', "R'", "U'", 'F2', 'D', 'L2', 'B']);
    const result = validateCubeState3x3(scrambled);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
  });

  it('detects unpainted / missing stickers (MISSING_STICKERS)', () => {
    const state = createSolvedCubeState();
    state.U[0] = null;
    state.F[4] = null;
    const result = validateCubeState3x3(state);
    assert.equal(result.isValid, false);
    const missingIssues = result.issues.filter(i => i.category === 'MISSING_STICKERS');
    assert.ok(missingIssues.length >= 2);
  });

  it('detects incorrect color counts (INCORRECT_COLOR_COUNT)', () => {
    const state = createSolvedCubeState();
    state.U[0] = 'yellow'; // 10 yellows, 8 whites
    const result = validateCubeState3x3(state);
    assert.equal(result.isValid, false);
    const countIssues = result.issues.filter(i => i.category === 'INCORRECT_COLOR_COUNT');
    assert.ok(countIssues.length > 0);
  });

  it('detects duplicate center colors (INVALID_COLOR_ARRANGEMENT)', () => {
    const state = createSolvedCubeState();
    state.F[4] = 'orange'; // Now both U and F have orange centers
    const result = validateCubeState3x3(state);
    assert.equal(result.isValid, false);
    const centerIssue = result.issues.find(i => i.title.includes('Center'));
    assert.ok(centerIssue);
    assert.equal(centerIssue!.category, 'INVALID_COLOR_ARRANGEMENT');
  });

  it('detects monochromatic edge piece (INVALID_COLOR_ARRANGEMENT)', () => {
    const state = createSolvedCubeState();
    // UF edge is at U[7] (orange) and F[1] (white)
    state.U[7] = 'blue';
    state.F[1] = 'blue'; // Both sides are blue
    state.R[1] = 'orange';
    state.R[7] = 'white';
    const result = validateCube3x3(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Monochromatic Edge')));
  });

  it('detects opposite colors on same edge (INVALID_COLOR_ARRANGEMENT)', () => {
    const state = createSolvedCubeState();
    // Orange and Red are opposites
    state.U[7] = 'orange';
    state.F[1] = 'red';
    state.D[1] = 'white';
    const result = validateCube3x3(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Impossible Edge Colors') || i.category === 'INVALID_COLOR_ARRANGEMENT'));
  });

  it('detects single twisted corner parity error (IMPOSSIBLE_PUZZLE_STATE)', () => {
    const state = createSolvedCubeState();
    // Twist UFL corner in place: slots are U[6], F[0], L[2]
    // Solved: U[6]=orange, F[0]=white, L[2]=green
    // Twist CW: U[6]=green, F[0]=orange, L[2]=white
    state.U[6] = 'green';
    state.F[0] = 'orange';
    state.L[2] = 'white';

    const result = validateCube3x3(state);
    assert.equal(result.isValid, false);
    const twistIssue = result.issues.find(i => i.title.includes('Corner Orientation Parity'));
    assert.ok(twistIssue, 'Should detect corner orientation parity');
    assert.equal(twistIssue!.category, 'IMPOSSIBLE_PUZZLE_STATE');
  });

  it('detects single flipped edge parity error (IMPOSSIBLE_PUZZLE_STATE)', () => {
    const state = createSolvedCubeState();
    // Flip UF edge in place: U[7] and F[1]
    // Solved: U[7]=orange, F[1]=white
    // Flipped: U[7]=white, F[1]=orange
    state.U[7] = 'white';
    state.F[1] = 'orange';

    const result = validateCube3x3(state);
    assert.equal(result.isValid, false);
    const flipIssue = result.issues.find(i => i.title.includes('Edge Orientation Parity'));
    assert.ok(flipIssue, 'Should detect edge orientation parity');
    assert.equal(flipIssue!.category, 'IMPOSSIBLE_PUZZLE_STATE');
  });

  it('detects permutation parity error (swap 2 corners only) (IMPOSSIBLE_PUZZLE_STATE)', () => {
    const state = createSolvedCubeState();
    // Swap UFL and UFR corners completely
    // UFL: U[6], F[0], L[2] (white, green, orange)
    // UFR: U[8], R[0], F[2] (white, red, green)
    const tempU = state.U[6];
    const tempF = state.F[0];
    const tempL = state.L[2];

    state.U[6] = state.U[8];
    state.F[0] = state.F[2];
    state.L[2] = state.R[0];

    state.U[8] = tempU;
    state.F[2] = tempF;
    state.R[0] = tempL;

    const result = validateCube3x3(state);
    assert.equal(result.isValid, false);
    const permIssue = result.issues.find(i => i.title.includes('Permutation Parity'));
    assert.ok(permIssue, 'Should detect permutation parity mismatch');
    assert.equal(permIssue!.category, 'IMPOSSIBLE_PUZZLE_STATE');
  });
});

describe('2×2 Pocket Cube Validation Engine', () => {
  function createSolved2x2(): Record<string, (CubeColor | null)[]> {
    return {
      U: Array(4).fill('white'),
      D: Array(4).fill('yellow'),
      F: Array(4).fill('green'),
      B: Array(4).fill('blue'),
      R: Array(4).fill('red'),
      L: Array(4).fill('orange'),
    };
  }

  it('validates a solved 2×2 cube successfully', () => {
    const state = createSolved2x2();
    const result = validateCube2x2(state);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.expectedCountPerColor, 4);
  });

  it('detects missing stickers on 2×2', () => {
    const state = createSolved2x2();
    state.U[0] = null;
    const result = validateCube2x2(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.category === 'MISSING_STICKERS'));
  });

  it('detects single twisted corner parity on 2×2', () => {
    const state = createSolved2x2();
    // Twist UFL corner: U[2], F[0], L[1] (white, green, orange)
    state.U[2] = 'orange';
    state.F[0] = 'white';
    state.L[1] = 'green';

    const result = validateCube2x2(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Corner Orientation Parity')));
  });

  it('detects permutation parity error on 2×2', () => {
    const state = createSolved2x2();
    // Swap UFL and UFR corners
    // UFL: U[2], F[0], L[1] (white, green, orange)
    // UFR: U[3], R[0], F[1] (white, red, green)
    state.U[2] = 'white'; state.F[0] = 'red'; state.L[1] = 'green';
    state.U[3] = 'white'; state.R[0] = 'green'; state.F[1] = 'orange';

    const result = validateCube2x2(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Permutation Parity')));
  });
});

describe('4×4 Rubik\'s Revenge Validation Engine', () => {
  function createSolved4x4(): Record<string, (CubeColor | null)[]> {
    return {
      U: Array(16).fill('white'),
      D: Array(16).fill('yellow'),
      F: Array(16).fill('green'),
      B: Array(16).fill('blue'),
      R: Array(16).fill('red'),
      L: Array(16).fill('orange'),
    };
  }

  it('validates a solved 4×4 cube successfully', () => {
    const state = createSolved4x4();
    const result = validateCube4x4(state);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.expectedCountPerColor, 16);
  });

  it('detects center distribution conflict on 4×4', () => {
    const state = createSolved4x4();
    // Replace one white center with yellow
    state.U[5] = 'yellow';
    state.D[5] = 'white';
    // Centers now have wrong counts on individual faces
    // Replace non-center to make total center counts invalid
    state.U[5] = 'red';
    state.R[0] = 'white'; // corner
    const result = validateCube4x4(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Center')));
  });
});

describe('Pyraminx Validation Engine', () => {
  function createSolvedPyraminx(): Record<string, (CubeColor | null)[]> {
    return {
      U: Array(9).fill('yellow'),
      L: Array(9).fill('green'),
      R: Array(9).fill('red'),
      B: Array(9).fill('blue'),
    };
  }

  it('validates a solved Pyraminx successfully', () => {
    const state = createSolvedPyraminx();
    const result = validatePyraminx(state);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.expectedCountPerColor, 9);
  });

  it('detects single flipped edge parity error on Pyraminx', () => {
    const state = createSolvedPyraminx();
    // Flip Up-Left edge: U[2] and L[2] (yellow, green)
    state.U[2] = 'green';
    state.L[2] = 'yellow';

    const result = validatePyraminx(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Edge Flip Parity')));
  });

  it('detects invalid tip color combination on Pyraminx', () => {
    const state = createSolvedPyraminx();
    // Top tip slots: U[0], L[0], R[0] expected yellow, green, red
    state.U[0] = 'blue'; // blue does not meet at top apex
    state.B[0] = 'yellow';

    const result = validatePyraminx(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Invalid Colors on Top Apex Tip')));
  });
});

describe('Skewb Validation Engine', () => {
  function createSolvedSkewb(): Record<string, (CubeColor | null)[]> {
    return {
      U: Array(5).fill('white'),
      D: Array(5).fill('yellow'),
      F: Array(5).fill('green'),
      B: Array(5).fill('blue'),
      R: Array(5).fill('red'),
      L: Array(5).fill('orange'),
    };
  }

  it('validates a solved Skewb successfully', () => {
    const state = createSolvedSkewb();
    const result = validateSkewb(state);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.expectedCountPerColor, 5);
  });

  it('detects duplicate centers on Skewb', () => {
    const state = createSolvedSkewb();
    // Make both U and F have green centers, while keeping overall color counts equal to 5
    state.U[0] = 'green';
    state.F[1] = 'white'; // change a green corner to white
    const result = validateSkewb(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Duplicate Center')));
  });

  it('detects single twisted corner parity error on Skewb', () => {
    const state = createSolvedSkewb();
    // Twist UFL corner: U[4], F[1], L[2] (white, green, orange)
    state.U[4] = 'orange';
    state.F[1] = 'white';
    state.L[2] = 'green';

    const result = validateSkewb(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.title.includes('Skewb Corner Orientation Parity')));
  });
});

describe('Megaminx Validation Engine', () => {
  function createSolvedMegaminx(): Record<string, (CubeColor | null)[]> {
    const colors: Record<string, CubeColor> = {
      U: 'white',
      F: 'green',
      L: 'purple',
      BL: 'blue',
      BR: 'red',
      R: 'yellow',
      D: 'grey',
      DF: 'cream',
      DL: 'pink',
      DBL: 'lightblue',
      DBR: 'lightgreen',
      DR: 'orange',
    };
    const state: Record<string, (CubeColor | null)[]> = {};
    for (const [face, color] of Object.entries(colors)) {
      state[face] = Array(11).fill(color);
    }
    return state;
  }

  it('validates a solved Megaminx successfully', () => {
    const state = createSolvedMegaminx();
    const result = validateMegaminx(state);
    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.expectedCountPerColor, 11);
  });

  it('detects missing stickers on Megaminx', () => {
    const state = createSolvedMegaminx();
    state.U[5] = null;
    const result = validateMegaminx(state);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.category === 'MISSING_STICKERS'));
  });
});

describe('Universal Dispatcher & Scanning Metadata', () => {
  it('detects incomplete camera scanning (INCOMPLETE_SCANNING)', () => {
    const state = createSolvedCubeState();
    // Only 4 faces scanned
    const result = validatePuzzleState('3x3', state, {
      scannedFaceIds: ['U', 'F', 'R', 'D'],
      totalExpectedFaces: 6,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some(i => i.category === 'INCOMPLETE_SCANNING'));
    assert.equal(result.missingFaces?.length, 2);
  });
});
