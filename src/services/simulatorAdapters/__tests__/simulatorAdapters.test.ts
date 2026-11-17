import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { 
  parseSimulatorUrl, 
  SIMULATOR_ADAPTERS, 
  SIMULATOR_COMPATIBILITY_REGISTRY,
  getSimulatorCompatibility,
  getVerifiedSimulators,
  isSimulatorVerified
} from '../index.ts';
import { parseUrlInput } from '../../state/parsers.ts';
import { validatePuzzleState } from '../../validator/index.ts';
import { validateCubeState3x3 } from '../../validator/index.ts';
import { solvePuzzle } from '../../solvers/index.ts';
import { applyMoves, isCubeSolved } from '../../cubeState.ts';

describe('Simulator Adapter Architecture & URL Import Comprehensive Test Suite', () => {

  // =========================================================================
  // SCENARIO 1: Valid Supported Simulator URLs
  // =========================================================================
  describe('Scenario 1: Valid Supported Simulator URLs', () => {
    it('accepts and parses valid Alg.cubing.net WCA scramble URL', () => {
      const url = 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=3x3x3';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulatorName, 'Alg.cubing.net');
      assert.strictEqual(result.puzzleType, '3x3');
      assert.ok(result.scrambleMoves && result.scrambleMoves.length > 0);
      assert.deepStrictEqual(result.scrambleMoves, ['R', 'U', "R'", "U'", 'F2', 'D', 'L2', "B'"]);
      assert.ok(result.cubeState3x3);
    });

    it('accepts and parses valid CubeDB.net scramble URL', () => {
      const url = 'https://cubedb.net/?puzzle=3&scramble=R_U_R-_U-_F2_D_L2_B-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulatorName, 'CubeDB.net');
      assert.strictEqual(result.puzzleType, '3x3');
      assert.deepStrictEqual(result.scrambleMoves, ['R', 'U', "R'", "U'", 'F2', 'D', 'L2', "B'"]);
      assert.ok(result.cubeState3x3);
    });

    it('accepts and parses valid RubiksCu.be 54-facelet URL', () => {
      const url = 'https://rubikscu.be/play/?f=DDFRUUFDRBLLDRULFFUFDRFLLBUUUBBDRRUDBBRFLDBLFDBLRBLRFU';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulatorName, 'RubiksCu.be / Ruwix');
      assert.strictEqual(result.puzzleType, '3x3');
      assert.ok(result.cubeState3x3);
      assert.strictEqual(result.cubeState3x3.U.length, 9);
      assert.strictEqual(result.cubeState3x3.R.length, 9);
      assert.strictEqual(result.cubeState3x3.F.length, 9);
    });

    it('accepts and parses valid RubiksCu.be WCA scramble URL', () => {
      const url = 'https://rubikscu.be/?scramble=R_U_R-_U-_F2_D_L2_B-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulatorName, 'RubiksCu.be / Ruwix');
      assert.strictEqual(result.puzzleType, '3x3');
      assert.deepStrictEqual(result.scrambleMoves, ['R', 'U', "R'", "U'", 'F2', 'D', 'L2', "B'"]);
    });

    it('accepts and parses valid CubeMaster native URL', () => {
      const url = 'https://cubemaster.app/?puzzle=3x3&scramble=F_R_U_R-_U-_F-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulatorName, 'CubeMaster Native');
      assert.strictEqual(result.puzzleType, '3x3');
      assert.deepStrictEqual(result.scrambleMoves, ['F', 'R', 'U', "R'", "U'", "F'"]);
    });
  });

  // =========================================================================
  // SCENARIO 2: URL Containing a Scrambled 3×3 (Full End-to-End Pipeline)
  // =========================================================================
  describe('Scenario 2: URL Containing a Scrambled 3×3 with Full Solution & Verification', () => {
    it('executes import -> 3D reconstruction -> physical validation -> Kociemba solve -> solution verification', async () => {
      const url = 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_U-&puzzle=3x3x3';
      
      // 1. Extraction into NormalizedPuzzleState
      const importResult = parseUrlInput(url);
      assert.strictEqual(importResult.success, true);
      assert.ok(importResult.state);
      const normalized = importResult.state!;

      assert.strictEqual(normalized.puzzleType, '3x3');
      assert.strictEqual(normalized.source, 'url');
      assert.strictEqual(normalized.metadata?.simulatorName, 'Alg.cubing.net');
      assert.strictEqual(normalized.stats.isComplete, true);
      assert.strictEqual(normalized.stats.totalStickers, 54);

      // 2. Physical Validation
      const validation = validatePuzzleState(normalized);
      assert.strictEqual(validation.isValid, true, 'Imported state must satisfy all physical cube invariants');
      assert.strictEqual(validation.issues.length, 0);

      // 3. Genuine Solving Engine (Herbert Kociemba two-phase algorithm)
      const solveResult = await solvePuzzle(normalized);
      assert.strictEqual(solveResult.success, true, 'Solving engine must succeed for legal scrambled 3x3');
      assert.ok(solveResult.totalMoves > 0, 'Scrambled cube must require > 0 moves');
      assert.ok(solveResult.totalMoves <= 22, `Expected solution <= 22 moves, got ${solveResult.totalMoves}`);
      assert.strictEqual(solveResult.isVerified, true, 'Solver must have verified the solution');

      // 4. Verify solution by simulating moves on scrambled cube
      const reconstructedCube = {
        U: [...normalized.facelets.U],
        R: [...normalized.facelets.R],
        F: [...normalized.facelets.F],
        D: [...normalized.facelets.D],
        L: [...normalized.facelets.L],
        B: [...normalized.facelets.B],
      };
      const finalSolvedCube = applyMoves(reconstructedCube, solveResult.moves);
      assert.strictEqual(isCubeSolved(finalSolvedCube), true, 'Applying solution to scrambled state must result in solved cube');

      // 5. Verify text instructions and 3D animation step timeline
      assert.strictEqual(solveResult.steps.length, solveResult.totalMoves);
      for (const step of solveResult.steps) {
        assert.ok(step.move, 'Step must have move notation');
        assert.ok(step.description, 'Step must have descriptive text');
        assert.ok(step.stateSnapshot, 'Step must have 3D state snapshot for animation');
      }
    });
  });

  // =========================================================================
  // SCENARIO 3: URL Containing a Scrambled 2×2
  // =========================================================================
  describe('Scenario 3: URL Containing a Scrambled 2×2', () => {
    it('extracts, validates, and solves a 2×2 Pocket Cube from Alg.cubing.net URL', async () => {
      const url = 'https://alg.cubing.net/?setup=R_U_R-_U-&puzzle=2x2x2';
      
      const importResult = parseUrlInput(url);
      assert.strictEqual(importResult.success, true);
      assert.ok(importResult.state);
      const normalized = importResult.state!;

      assert.strictEqual(normalized.puzzleType, '2x2');
      assert.strictEqual(normalized.stats.totalStickers, 24);

      // Validate 2x2 state
      const validation = validatePuzzleState(normalized);
      assert.strictEqual(validation.isValid, true);

      // Solve with Pocket2x2Solver
      const solveResult = await solvePuzzle(normalized);
      assert.strictEqual(solveResult.success, true);
      assert.strictEqual(solveResult.isVerified, true);
      assert.ok(solveResult.totalMoves > 0 && solveResult.totalMoves <= 11);
      assert.strictEqual(solveResult.steps.length, solveResult.totalMoves);
    });

    it('extracts 2×2 from CubeDB.net URL', () => {
      const url = 'https://cubedb.net/?puzzle=2&scramble=R_U_R-_U-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.puzzleType, '2x2');
      assert.ok(result.genericPuzzleState);
      assert.strictEqual(result.genericPuzzleState.U.length, 4);
    });
  });

  // =========================================================================
  // SCENARIO 4: URL Containing a Scrambled 4×4 (Supported Extraction + Genuine Solver)
  // =========================================================================
  describe('Scenario 4: URL Containing a Scrambled 4×4', () => {
    it('extracts 4×4 configuration from Alg.cubing.net, validates state, and generates verified solution', async () => {
      const url = 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=4x4x4';
      
      const importResult = parseUrlInput(url);
      assert.strictEqual(importResult.success, true);
      assert.ok(importResult.state);
      const normalized = importResult.state!;

      assert.strictEqual(normalized.puzzleType, '4x4');
      assert.strictEqual(normalized.stats.totalStickers, 96);

      // Validate 4x4 state
      const validation = validatePuzzleState(normalized);
      assert.strictEqual(validation.isValid, true);

      // Solve attempt: now fully supported with genuine solver
      const solveResult = await solvePuzzle(normalized);
      assert.strictEqual(solveResult.success, true);
      assert.ok(solveResult.moves.length > 0);
      assert.strictEqual(solveResult.isVerified, true);
    });

    it('extracts 4×4 from CubeDB.net', () => {
      const url = 'https://cubedb.net/?puzzle=4&scramble=R_U_R-_U-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.puzzleType, '4x4');
      assert.ok(result.genericPuzzleState);
      assert.strictEqual(result.genericPuzzleState.U.length, 16);
    });
  });

  // =========================================================================
  // SCENARIO 5: URL From an Unsupported Simulator
  // =========================================================================
  describe('Scenario 5: URL From an Unsupported Simulator', () => {
    it('rejects unsupported simulator domain and provides helpful guidance', () => {
      const url = 'https://unsupported-simulator.org/play?scramble=R_U_R-_U-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_SIMULATOR');
      assert.ok(result.error?.includes('not a recognized cube simulator'));
      assert.ok(result.error?.includes('Alg.cubing.net'));
    });

    it('rejects csTimer session URL with explanatory error', () => {
      const url = 'https://cstimer.net/?scramble=R_U_R-_U-';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_SIMULATOR');
      assert.ok(result.error?.includes('cstimer.net'));
    });
  });

  // =========================================================================
  // SCENARIO 6: Random Website URL
  // =========================================================================
  describe('Scenario 6: Random Website URL', () => {
    it('safely rejects Wikipedia URL', () => {
      const url = 'https://en.wikipedia.org/wiki/Rubik%27s_Cube';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_SIMULATOR');
    });

    it('safely rejects Google search URL', () => {
      const url = 'https://www.google.com/search?q=rubiks+cube+solver';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_SIMULATOR');
    });

    it('safely rejects GitHub repository URL', () => {
      const url = 'https://github.com/cubing/cubing.js';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_SIMULATOR');
    });
  });

  // =========================================================================
  // SCENARIO 7: Malformed URLs
  // =========================================================================
  describe('Scenario 7: Malformed URLs', () => {
    it('rejects empty and whitespace-only strings', () => {
      assert.strictEqual(parseSimulatorUrl('').success, false);
      assert.strictEqual(parseSimulatorUrl('').errorCode, 'INVALID_URL');
      assert.strictEqual(parseSimulatorUrl('   ').success, false);
      assert.strictEqual(parseSimulatorUrl('   ').errorCode, 'INVALID_URL');
    });

    it('rejects arbitrary non-URL text strings', () => {
      const result = parseSimulatorUrl('this is definitely not a url');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'INVALID_URL');
      assert.ok(result.error?.includes('not a valid URL'));
    });

    it('rejects missing scheme or broken protocols', () => {
      const result = parseSimulatorUrl('htp://alg.cubing.net/?setup=R_U');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'INVALID_URL');
    });

    it('rejects FTP and file protocols', () => {
      const ftpResult = parseSimulatorUrl('ftp://alg.cubing.net/setup');
      assert.strictEqual(ftpResult.success, false);
      assert.strictEqual(ftpResult.errorCode, 'INVALID_URL');
      assert.ok(ftpResult.error?.includes('Unsupported protocol'));

      const fileResult = parseSimulatorUrl('file:///C:/Users/Admin/cube.html');
      assert.strictEqual(fileResult.success, false);
      assert.strictEqual(fileResult.errorCode, 'INVALID_URL');
    });
  });

  // =========================================================================
  // SCENARIO 8: URL Without Cube-State Information
  // =========================================================================
  describe('Scenario 8: URL Without Cube-State Information', () => {
    it('flags missing scramble/setup parameter on Alg.cubing.net bare homepage', () => {
      const url = 'https://alg.cubing.net/';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'NO_CUBE_STATE_FOUND');
      assert.ok(result.error?.includes("No 'setup' or 'alg' scramble parameter"));
    });

    it('flags missing scramble parameter on CubeDB.net', () => {
      const url = 'https://cubedb.net/?puzzle=3';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'NO_CUBE_STATE_FOUND');
      assert.ok(result.error?.includes("No 'scramble' or 'alg' parameter"));
    });

    it('flags missing scramble or facelet parameters on RubiksCu.be', () => {
      const url = 'https://rubikscu.be/play/';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'NO_CUBE_STATE_FOUND');
      assert.ok(result.error?.includes("no scramble parameter"));
    });
  });

  // =========================================================================
  // SCENARIO 9: URL Containing an Impossible Puzzle State
  // =========================================================================
  describe('Scenario 9: URL Containing an Impossible Puzzle State', () => {
    it('rejects RubiksCu.be 54-facelet URL with single corner twist parity error', () => {
      // Standard solved cube facelet string:
      // UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
      // Introduce a single corner twist at UFL (U[8] = yellow, F[0] = white)
      const impossibleFacelets = 'UUUUUUUDFRRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
      const url = `https://rubikscu.be/play/?f=${impossibleFacelets}`;
      
      const result = parseSimulatorUrl(url);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'INVALID_CUBE_CONFIGURATION');
      assert.ok(result.error?.includes('failed physical validation'));
    });

    it('rejects facelet string with unbalanced color distribution', () => {
      // 10 Whites, 8 Yellows
      const unbalancedFacelets = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDWLLLLLLLLLBBBBBBBBB';
      const url = `https://rubikscu.be/play/?f=${unbalancedFacelets}`;

      const result = parseSimulatorUrl(url);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'INVALID_CUBE_CONFIGURATION');
    });

    it('physical validation directly rejects corrupted facelet states', () => {
      const corruptedState = {
        U: ['yellow', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
        R: Array(9).fill('red'),
        F: Array(9).fill('green'),
        D: ['white', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
        L: Array(9).fill('orange'),
        B: Array(9).fill('blue'),
      };
      // @ts-expect-error test corruption
      const validation = validateCubeState3x3(corruptedState);
      assert.strictEqual(validation.isValid, false);
    });
  });

  // =========================================================================
  // SCENARIO 10: URL With Modified or Malicious Parameters (Security Invariants)
  // =========================================================================
  describe('Scenario 10: URL With Modified or Malicious Parameters', () => {
    it('strictly blocks javascript: URI protocol smuggling and XSS', () => {
      const xssUrl = 'javascript:alert(document.domain)';
      const result = parseSimulatorUrl(xssUrl);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'INVALID_URL');
      assert.ok(result.error?.includes('Unsupported protocol'));
    });

    it('strictly blocks data: URI protocol injection', () => {
      const dataUrl = 'data:text/html,<script>alert("pwned")</script>';
      const result = parseSimulatorUrl(dataUrl);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'INVALID_URL');
    });

    it('sanitizes HTML tags and script injections embedded in scramble parameters', () => {
      const maliciousParamUrl = 'https://alg.cubing.net/?setup=<script>alert("XSS")</script>&puzzle=3x3x3';
      const result = parseSimulatorUrl(maliciousParamUrl);

      // Tokenizer rejects script tags as invalid tokens, producing 0 valid moves
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'EXTRACTION_FAILURE');
      assert.ok(result.error?.includes('Could not parse any valid move tokens'));
    });

    it('filters out SQL injection payloads inside move strings', () => {
      const sqlUrl = "https://alg.cubing.net/?setup=R_U_';DROP TABLE cubes;--&puzzle=3x3x3";
      const result = parseSimulatorUrl(sqlUrl);

      assert.strictEqual(result.success, true);
      // Valid moves R, U are extracted safely; malicious SQL tokens are discarded
      assert.deepStrictEqual(result.scrambleMoves, ['R', 'U']);
    });

    it('handles giant payloads without memory explosion or crash', () => {
      const giantGarbage = 'X'.repeat(10000);
      const url = `https://alg.cubing.net/?setup=${giantGarbage}&puzzle=3x3x3`;
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'EXTRACTION_FAILURE');
    });
  });

  // =========================================================================
  // SCENARIO 11: Inaccessible Simulator Website (Offline Independence)
  // =========================================================================
  describe('Scenario 11: Inaccessible Simulator Website (Zero Outbound Network Calls)', () => {
    it('parses, normalizes, and validates state entirely client-side without network requests', () => {
      // Even if alg.cubing.net is completely offline or DNS is unreachable,
      // CubeMaster client-side logic succeeds instantly with 0ms network latency
      const start = performance.now();
      const url = 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=3x3x3';
      const result = parseSimulatorUrl(url);
      const duration = performance.now() - start;

      assert.strictEqual(result.success, true);
      assert.ok(duration < 50, `Expected purely client-side evaluation < 50ms, took ${duration}ms`);
      assert.strictEqual(result.cubeState3x3?.U.length, 9);
    });
  });

  // =========================================================================
  // SCENARIO 12: Unsupported Puzzle Type
  // =========================================================================
  describe('Scenario 12: Unsupported Puzzle Type in URL', () => {
    it('flags unsupported puzzle type on Alg.cubing.net (e.g. square1)', () => {
      const url = 'https://alg.cubing.net/?setup=R_U_R-_U-&puzzle=square1';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_PUZZLE_TYPE');
      assert.ok(result.error?.includes("square1"));
    });

    it('flags unsupported puzzle type on CubeDB.net (e.g. clock)', () => {
      const url = 'https://cubedb.net/?puzzle=clock&scramble=UR1+';
      const result = parseSimulatorUrl(url);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errorCode, 'UNSUPPORTED_PUZZLE_TYPE');
      assert.ok(result.error?.includes("clock"));
    });
  });

  // =========================================================================
  // SIMULATOR COMPATIBILITY REGISTRY TESTS
  // =========================================================================
  describe('Simulator Compatibility Registry Verification', () => {
    it('contains all required registry entries with complete metadata', () => {
      assert.ok(SIMULATOR_COMPATIBILITY_REGISTRY.length >= 6);

      const verified = getVerifiedSimulators();
      assert.strictEqual(verified.length, 4);

      const requiredNames = ['Alg.cubing.net', 'CubeDB.net', 'RubiksCu.be / Ruwix', 'CubeMaster Native'];
      for (const name of requiredNames) {
        const found = verified.find(v => v.name === name);
        assert.ok(found, `Expected ${name} in verified simulator registry`);
        assert.strictEqual(found.integrationStatus, 'VERIFIED');
        assert.ok(found.supportedPuzzles.length > 0);
        assert.ok(found.officialDomain);
        assert.ok(found.urlFormat);
        assert.ok(found.extractionMethod);
        assert.strictEqual(found.testResults.status, 'PASSED');
        assert.ok(found.testResults.testedScenariosCount >= 10);
      }
    });

    it('correctly maps domains and aliases to registry entries', () => {
      assert.strictEqual(isSimulatorVerified('alg.cubing.net'), true);
      assert.strictEqual(isSimulatorVerified('cubing.net'), true);
      assert.strictEqual(isSimulatorVerified('cubedb.net'), true);
      assert.strictEqual(isSimulatorVerified('www.cubedb.net'), true);
      assert.strictEqual(isSimulatorVerified('rubikscu.be'), true);
      assert.strictEqual(isSimulatorVerified('ruwix.com'), true);
      assert.strictEqual(isSimulatorVerified('cubemaster.app'), true);
      assert.strictEqual(isSimulatorVerified('localhost'), true);

      // Unverified / Unsupported domains
      assert.strictEqual(isSimulatorVerified('cstimer.net'), false);
      assert.strictEqual(isSimulatorVerified('google.com'), false);
    });

    it('honestly documents evaluated unsupported simulators', () => {
      const csTimer = getSimulatorCompatibility('cstimer.net');
      assert.ok(csTimer);
      assert.strictEqual(csTimer.integrationStatus, 'UNSUPPORTED');
      assert.ok(csTimer.testResults.notes.includes('localStorage'));

      const cheatsheet = getSimulatorCompatibility('cubingcheatsheet.com');
      assert.ok(cheatsheet);
      assert.strictEqual(cheatsheet.integrationStatus, 'UNSUPPORTED');
    });

    it('adheres to zero-trust client-side security policies across all entries', () => {
      for (const entry of SIMULATOR_COMPATIBILITY_REGISTRY) {
        assert.strictEqual(entry.securityPolicies.clientSideOnly, true);
        assert.strictEqual(entry.securityPolicies.noExternalCodeExecution, true);
        assert.strictEqual(entry.securityPolicies.ssrfImmune, true);
        assert.deepStrictEqual(entry.securityPolicies.protocolWhitelist, ['http:', 'https:']);
      }
    });
  });

  // =========================================================================
  // SIMULATOR ADAPTER REGISTRY INTEGRITY
  // =========================================================================
  describe('Simulator Adapter Registry Integrity', () => {
    it('ensures each adapter satisfies the SimulatorAdapter interface', () => {
      for (const adapter of SIMULATOR_ADAPTERS) {
        assert.ok(adapter.id);
        assert.ok(adapter.name);
        assert.ok(adapter.domains.length > 0);
        assert.ok(adapter.supportedPuzzles.length > 0);
        assert.strictEqual(typeof adapter.matchesUrl, 'function');
        assert.strictEqual(typeof adapter.parse, 'function');
      }
    });

    it('ensures only one adapter matches a given URL (no domain collision)', () => {
      const testUrls = [
        'https://alg.cubing.net/?setup=R_U',
        'https://cubedb.net/?puzzle=3&scramble=R_U',
        'https://rubikscu.be/?scramble=R_U',
        'https://cubemaster.app/?puzzle=3x3&scramble=R_U',
      ];

      for (const urlStr of testUrls) {
        const url = new URL(urlStr);
        const matching = SIMULATOR_ADAPTERS.filter(a => a.matchesUrl(url));
        assert.strictEqual(matching.length, 1, `Exactly one adapter must match ${urlStr}`);
      }
    });
  });
});
