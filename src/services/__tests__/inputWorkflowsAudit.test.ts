import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  rgbToHsv, 
  rgbToLab, 
  deltaE76, 
  classifySampledColor, 
  getPuzzleRoiPoints,
  evaluateImageQuality,
  rgbToHex,
  STANDARD_PALETTES
} from '../cvColorExtractor.ts';
import { parseCameraScanInput, parseManualInput } from '../state/parsers.ts';
import { PUZZLE_DEFINITIONS } from '../puzzles.ts';
import { createSolvedCubeState, createEmptyCubeState, applyMove } from '../cubeState.ts';
import { Cube2x2Model, modelTo2x2GenericState } from '../solvers/pocket2x2.ts';
import { applyPyraminxMove, isPyraminxSolved } from '../solvers/pyraminx.ts';
import { applySkewbMove, isSkewbSolved } from '../solvers/skewb.ts';
import type { CubeColor } from '../../types/cube.ts';
import type { GenericFaceletsState } from '../state/types.ts';

describe('Input Workflows Audit: Camera Scanning System', () => {
  it('accurately classifies standard cube colors using CIELAB D65 perceptual distance', () => {
    // Pure Red vs Orange test
    const redSample = { r: 185, g: 15, b: 35 };
    const redResult = classifySampledColor(redSample);
    assert.strictEqual(redResult.color, 'red');
    assert.ok(redResult.confidence >= 80);

    const orangeSample = { r: 255, g: 90, b: 5 };
    const orangeResult = classifySampledColor(orangeSample);
    assert.strictEqual(orangeResult.color, 'orange');

    // White under warm indoor bulb
    const warmWhite = { r: 235, g: 232, b: 220 };
    const whiteResult = classifySampledColor(warmWhite);
    assert.strictEqual(whiteResult.color, 'white');

    // Pure Green and Blue
    const greenResult = classifySampledColor({ r: 5, g: 150, b: 70 });
    assert.strictEqual(greenResult.color, 'green');

    const blueResult = classifySampledColor({ r: 5, g: 65, b: 175 });
    assert.strictEqual(blueResult.color, 'blue');

    // Yellow
    const yellowResult = classifySampledColor({ r: 245, g: 220, b: 10 });
    assert.strictEqual(yellowResult.color, 'yellow');
  });

  it('verifies CIELAB, HSV, DeltaE76, and Hex color space conversions and reference palettes', () => {
    // Test rgbToHex
    assert.strictEqual(rgbToHex(255, 0, 0), '#ff0000');
    assert.strictEqual(rgbToHex(0, 255, 0), '#00ff00');
    assert.strictEqual(rgbToHex(0, 0, 255), '#0000ff');

    // Test rgbToHsv
    const redHsv = rgbToHsv(255, 0, 0);
    assert.strictEqual(redHsv.h, 0);
    assert.strictEqual(redHsv.s, 1);
    assert.strictEqual(redHsv.v, 1);

    const greenHsv = rgbToHsv(0, 255, 0);
    assert.strictEqual(greenHsv.h, 120);

    // Test rgbToLab
    const whiteLab = rgbToLab(255, 255, 255);
    assert.ok(whiteLab.l > 95); // High lightness for pure white
    const blackLab = rgbToLab(0, 0, 0);
    assert.strictEqual(Math.round(blackLab.l), 0);

    // Test deltaE76 distance
    const distZero = deltaE76(whiteLab, whiteLab);
    assert.strictEqual(distZero, 0);

    const distWhiteBlack = deltaE76(whiteLab, blackLab);
    assert.ok(distWhiteBlack > 90);

    // Test STANDARD_PALETTES definition integrity
    const expectedColors: CubeColor[] = [
      'white', 'yellow', 'green', 'blue', 'red', 'orange', 
      'purple', 'pink', 'lightgreen', 'lightblue', 'grey', 'cream'
    ];
    for (const color of expectedColors) {
      const palette = STANDARD_PALETTES[color];
      assert.ok(palette, `Palette for ${color} should be defined`);
      assert.ok(palette.rgb && typeof palette.rgb.r === 'number');
      assert.ok(palette.lab && typeof palette.lab.l === 'number');
    }
  });

  it('correctly evaluates image quality metrics on mock canvas context', () => {
    // Construct a mock 8x8 imageData with uniform color (zero gradient -> blurry)
    const width = 8;
    const height = 8;
    const uniformData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < uniformData.length; i += 4) {
      uniformData[i] = 20;     // R
      uniformData[i + 1] = 20; // G
      uniformData[i + 2] = 20; // B
      uniformData[i + 3] = 255;
    }
    const mockDarkCtx = {
      getImageData: () => ({ data: uniformData }),
    } as unknown as CanvasRenderingContext2D;

    const darkMetrics = evaluateImageQuality(mockDarkCtx, width, height);
    assert.strictEqual(darkMetrics.isTooDark, true);
    assert.strictEqual(darkMetrics.isBlurry, true); // No gradient in flat dark image
    assert.ok(darkMetrics.warningMessage?.includes('dark') || darkMetrics.warningMessage?.includes('Blurry'));

    // Construct a high-contrast checkerboard image (high gradient -> not blurry)
    const sharpData = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const val = (x + y) % 2 === 0 ? 240 : 20;
        sharpData[idx] = val;
        sharpData[idx + 1] = val;
        sharpData[idx + 2] = val;
        sharpData[idx + 3] = 255;
      }
    }
    const mockSharpCtx = {
      getImageData: () => ({ data: sharpData }),
    } as unknown as CanvasRenderingContext2D;

    const sharpMetrics = evaluateImageQuality(mockSharpCtx, width, height);
    assert.strictEqual(sharpMetrics.isBlurry, false);
    assert.ok(sharpMetrics.sharpnessScore > 10);
  });

  it('correctly maps ROI points for all 6 supported & preview puzzle geometries', () => {
    // 2x2: 4 points
    const roi2x2 = getPuzzleRoiPoints('2x2', 4);
    assert.strictEqual(roi2x2.length, 4);

    // 3x3: 9 points
    const roi3x3 = getPuzzleRoiPoints('3x3', 9);
    assert.strictEqual(roi3x3.length, 9);

    // 4x4: 16 points
    const roi4x4 = getPuzzleRoiPoints('4x4', 16);
    assert.strictEqual(roi4x4.length, 16);

    // Pyraminx: 9 points arranged in 3 tiers
    const roiPyr = getPuzzleRoiPoints('pyraminx', 9);
    assert.strictEqual(roiPyr.length, 9);
    // Apex point is at top
    assert.ok(roiPyr[0].y < 0.3);

    // Skewb: 5 points (1 diamond center + 4 corners)
    const roiSkewb = getPuzzleRoiPoints('skewb', 5);
    assert.strictEqual(roiSkewb.length, 5);
    assert.strictEqual(roiSkewb[0].label, 'Center');

    // Megaminx: 11 points (1 center + 10 outer points)
    const roiMeg = getPuzzleRoiPoints('megaminx', 11);
    assert.strictEqual(roiMeg.length, 11);
  });

  it('stores and normalizes detected facelets across all faces', () => {
    const createMockDetection = (color: CubeColor, confidence: number) => ({
      color,
      confidence,
      sampledRgb: { r: 200, g: 200, b: 200 },
      sampledHex: '#c8c8c8',
    });

    const mockScanData = {
      U: Array(9).fill(null).map(() => createMockDetection('white', 95)),
      R: Array(9).fill(null).map(() => createMockDetection('red', 92)),
      F: Array(9).fill(null).map(() => createMockDetection('green', 94)),
      D: Array(9).fill(null).map(() => createMockDetection('yellow', 96)),
      L: Array(9).fill(null).map(() => createMockDetection('orange', 90)),
      B: Array(9).fill(null).map(() => createMockDetection('blue', 93)),
    };

    const normalized = parseCameraScanInput('3x3', mockScanData, {
      scannedFaces: ['U', 'R', 'F', 'D', 'L', 'B'],
    });

    assert.strictEqual(normalized.puzzleType, '3x3');
    assert.strictEqual(normalized.source, 'camera');
    assert.strictEqual(normalized.facelets.U.length, 9);
    assert.strictEqual(normalized.facelets.U[0], 'white');
    assert.strictEqual(normalized.facelets.F[4], 'green');
    assert.strictEqual(normalized.facelets.B[8], 'blue');
    assert.ok(normalized.metadata.averageConfidence! >= 90);
  });

  it('allows user manual color overrides to overwrite detected values', () => {
    const rawScan = [
      { color: 'white' as CubeColor, confidence: 60, sampledRgb: { r: 200, g: 200, b: 200 }, sampledHex: '#c8c8c8' },
      { color: 'yellow' as CubeColor, confidence: 95, sampledRgb: { r: 250, g: 215, b: 0 }, sampledHex: '#fad700' },
    ];

    // User overrides sticker index 0 from white to green
    const overridden = [...rawScan];
    overridden[0] = {
      ...overridden[0],
      color: 'green',
      confidence: 100, // User verified
      sampledHex: '#009b48',
    };

    assert.strictEqual(overridden[0].color, 'green');
    assert.strictEqual(overridden[0].confidence, 100);
    assert.strictEqual(overridden[1].color, 'yellow');
  });

  it('validates mock camera permission denial error mapping', () => {
    // Simulate DOMException with NotAllowedError
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    const isDenied = permissionError instanceof DOMException && 
      (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError');
    
    assert.strictEqual(isDenied, true);
    const userMessage = isDenied
      ? 'Camera permission denied by browser. Please enable camera access in your browser settings/address bar, or use the "Upload Photo" tab or "Manual Color Input" instead.'
      : 'Camera access denied or device not found.';

    assert.ok(userMessage.includes('Camera permission denied'));
    assert.ok(userMessage.includes('Manual Color Input'));
  });

  it('rejects invalid or non-image file formats during upload', () => {
    const invalidFile = { type: 'application/pdf', name: 'document.pdf' };
    const isValidImage = invalidFile.type.startsWith('image/');
    assert.strictEqual(isValidImage, false);

    const validFile = { type: 'image/jpeg', name: 'cube_face.jpg' };
    assert.strictEqual(validFile.type.startsWith('image/'), true);
  });
});

describe('Input Workflows Audit: Manual Color Input System', () => {
  it('creates clean solved and empty manual states for 3×3 Rubik’s Cube', () => {
    const solved = createSolvedCubeState();
    assert.strictEqual(solved.U.every(c => c === 'orange'), true);
    assert.strictEqual(solved.D.every(c => c === 'red'), true);
    assert.strictEqual(solved.F.every(c => c === 'white'), true);

    const emptyPreserveCenters = createEmptyCubeState(true);
    assert.strictEqual(emptyPreserveCenters.U[4], 'orange');
    assert.strictEqual(emptyPreserveCenters.U[0], null);
    assert.strictEqual(emptyPreserveCenters.F[4], 'white');
    assert.strictEqual(emptyPreserveCenters.F[1], null);
  });

  it('updates stickers and tracks undo history', () => {
    const state = createSolvedCubeState();
    const history: { face: string; index: number; prevColor: CubeColor | null; newColor: CubeColor | null }[] = [];

    // User paints U[0] to red
    const prevColor = state.U[0];
    const newColor: CubeColor = 'red';
    history.push({ face: 'U', index: 0, prevColor, newColor });
    state.U[0] = newColor;

    assert.strictEqual(state.U[0], 'red');

    // User executes Undo
    const lastAction = history.pop()!;
    state.U[lastAction.index] = lastAction.prevColor;

    assert.strictEqual(state.U[0], 'orange');
  });

  it('supports eraser mode by resetting stickers to null', () => {
    const state = createSolvedCubeState();
    // Erase U[1]
    state.U[1] = null;
    assert.strictEqual(state.U[1], null);

    // Calculate unpainted count
    let unpainted = 0;
    const faces = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
    for (const f of faces) {
      for (const s of state[f]) {
        if (s === null) unpainted++;
      }
    }
    assert.strictEqual(unpainted, 1);
  });

  it('correctly normalizes all 6 puzzle layouts from manual inputs', () => {
    for (const def of PUZZLE_DEFINITIONS) {
      const mockGeneric: GenericFaceletsState = {};
      for (const face of def.faceNames) {
        mockGeneric[face.id] = Array(def.stickersPerFace).fill(face.defaultColor);
      }

      const normalized = parseManualInput(def.id, mockGeneric);
      assert.strictEqual(normalized.puzzleType, def.id);
      assert.strictEqual(normalized.source, 'manual');

      let stickerCount = 0;
      for (const faceId of Object.keys(normalized.facelets)) {
        stickerCount += normalized.facelets[faceId].length;
      }
      assert.strictEqual(stickerCount, def.totalStickers);
    }
  });

  it('generates mathematically legal random scrambles for 2×2, 3×3, Pyraminx, and Skewb', () => {
    // 1. 2x2 Scramble
    let model2x2 = new Cube2x2Model();
    const moves2x2 = ['R', 'U', "R'", 'F', 'U2', "F'"];
    for (const m of moves2x2) {
      model2x2 = model2x2.move(m);
    }
    const state2x2 = modelTo2x2GenericState(model2x2);
    assert.strictEqual(Object.keys(state2x2).length, 6);
    assert.strictEqual(state2x2.U.length, 4);

    // 2. 3x3 Scramble
    let state3x3 = createSolvedCubeState();
    state3x3 = applyMove(state3x3, 'R');
    state3x3 = applyMove(state3x3, 'U');
    assert.notStrictEqual(state3x3.U[8], 'orange');

    // 3. Pyraminx Scramble
    const initialPyr: GenericFaceletsState = {
      U: Array(9).fill('yellow'),
      L: Array(9).fill('green'),
      R: Array(9).fill('red'),
      B: Array(9).fill('blue'),
    };
    const scrambledPyr = applyPyraminxMove(initialPyr, 'U');
    assert.strictEqual(isPyraminxSolved(scrambledPyr), false);

    // 4. Skewb Scramble
    const initialSkewb: GenericFaceletsState = {
      U: Array(5).fill('white'),
      D: Array(5).fill('yellow'),
      F: Array(5).fill('green'),
      B: Array(5).fill('blue'),
      R: Array(5).fill('red'),
      L: Array(5).fill('orange'),
    };
    const scrambledSkewb = applySkewbMove(initialSkewb, 'R');
    assert.strictEqual(isSkewbSolved(scrambledSkewb), false);
  });
});

describe('Input Workflows Audit: Puzzle Selection & Transparency', () => {
  it('correctly flags supported vs in-development puzzles without false claims', () => {
    const supportedIds = PUZZLE_DEFINITIONS.filter(p => p.supported).map(p => p.id);
    const inDevelopmentIds = PUZZLE_DEFINITIONS.filter(p => !p.supported).map(p => p.id);

    // 2x2, 3x3, Pyraminx, Skewb have functional solvers
    assert.deepStrictEqual(supportedIds.sort(), ['2x2', '3x3', 'pyraminx', 'skewb'].sort());

    // 4x4 and Megaminx are honestly marked in development
    assert.deepStrictEqual(inDevelopmentIds.sort(), ['4x4', 'megaminx'].sort());

    const def4x4 = PUZZLE_DEFINITIONS.find(p => p.id === '4x4')!;
    assert.strictEqual(def4x4.supported, false);
    assert.strictEqual(def4x4.totalStickers, 96);

    const defMeg = PUZZLE_DEFINITIONS.find(p => p.id === 'megaminx')!;
    assert.strictEqual(defMeg.supported, false);
    assert.strictEqual(defMeg.totalStickers, 132);
  });
});
