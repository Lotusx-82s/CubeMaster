import type { CubeColor, CubeState3x3, FaceId, PuzzleTypeId } from '../../types/cube';
import type { SimulatorAdapter, SimulatorParseResult } from './types';
import { normalizeMoveSequence, reconstructAndValidate3x3State } from './moveNormalizer';
import { validateCubeState3x3 } from '../validator';

const COLOR_MAP: Record<string, CubeColor> = {
  U: 'white',
  W: 'white',
  WHITE: 'white',
  R: 'red',
  RED: 'red',
  F: 'green',
  G: 'green',
  GREEN: 'green',
  D: 'yellow',
  Y: 'yellow',
  YELLOW: 'yellow',
  L: 'orange',
  O: 'orange',
  ORANGE: 'orange',
  B: 'blue',
  BLUE: 'blue',
};

// Check if string is a 54-facelet state representation (e.g. UUUUUUUUURRRRRRRRR...)
function parseFaceletString(str: string): CubeState3x3 | null {
  const cleaned = str.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (cleaned.length !== 54) return null;

  const faces: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState3x3> = {};

  for (let f = 0; f < 6; f++) {
    const faceId = faces[f];
    const segment = cleaned.slice(f * 9, f * 9 + 9);
    const colors: (CubeColor | null)[] = [];

    for (let i = 0; i < 9; i++) {
      const char = segment[i];
      const color = COLOR_MAP[char];
      if (!color) return null;
      colors.push(color);
    }

    state[faceId] = colors;
  }

  return state as CubeState3x3;
}

// Extract parameter from searchParams or hash
function extractParam(url: URL, paramNames: string[]): string | null {
  // 1. Check standard search parameters
  for (const name of paramNames) {
    const val = url.searchParams.get(name);
    if (val) return val;
  }

  // 2. Check hash fragment (e.g. #scramble=... or #cubesolver?scramble=...)
  if (url.hash) {
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const qIndex = hash.indexOf('?');
    const queryPart = qIndex >= 0 ? hash.slice(qIndex + 1) : hash;
    const hashParams = new URLSearchParams(queryPart);
    for (const name of paramNames) {
      const val = hashParams.get(name);
      if (val) return val;
    }
  }

  return null;
}

export const rubiksCubeAdapter: SimulatorAdapter = {
  id: 'rubikscu-be',
  name: 'RubiksCu.be / Ruwix',
  domains: ['rubikscu.be', 'www.rubikscu.be', 'ruwix.com', 'www.ruwix.com', 'onlinecube.com', 'www.onlinecube.com'],
  description: "Popular online 3D simulator, Ruwix solver, and interactive virtual Rubik's cube.",
  exampleUrl: 'https://rubikscu.be/?scramble=R_U_R-_U-_F2_D_L2_B-',
  supportedPuzzles: ['3x3', '2x2', '4x4'],

  matchesUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return this.domains.some(d => host === d || host.endsWith('.' + d));
  },

  parse(url: URL): SimulatorParseResult {
    // 1. Detect puzzle
    const rawPuzzle = (extractParam(url, ['puzzle', 'p', 'type']) || '3x3').toLowerCase();
    let puzzleType: PuzzleTypeId = '3x3';

    if (rawPuzzle.includes('2')) puzzleType = '2x2';
    else if (rawPuzzle.includes('4')) puzzleType = '4x4';
    else puzzleType = '3x3';

    // 2. Extract scramble, alg, moves, or state
    const rawMovesOrState = extractParam(url, ['scramble', 'moves', 'alg', 'setup', 'state', 'pattern', 's']);

    if (!rawMovesOrState) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType,
        errorCode: 'NO_CUBE_STATE_FOUND',
        error: `RubiksCu.be / Ruwix link recognized, but no scramble parameter was found in this link. On RubiksCu.be, click 'Share' to generate a link containing '?scramble=...' or append a move sequence like '?scramble=R_U_R-_U-'.`,
      };
    }

    // 3. Check if it's a 54-facelet string representation
    if (puzzleType === '3x3' && rawMovesOrState.length >= 54) {
      const faceletState = parseFaceletString(rawMovesOrState);
      if (faceletState) {
        const validation = validateCubeState3x3(faceletState);
        if (validation.isValid) {
          return {
            success: true,
            simulatorName: this.name,
            puzzleType: '3x3',
            cubeState3x3: faceletState,
            metadata: {
              rawParam: rawMovesOrState,
              description: 'Extracted 54-facelet physical color state from RubiksCu.be',
            },
          };
        }
      }
    }

    // 4. Otherwise, parse as WCA move sequence
    const { moves, normalizedStr, invalidTokens } = normalizeMoveSequence(rawMovesOrState);

    if (moves.length === 0) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType,
        errorCode: 'EXTRACTION_FAILURE',
        error: `Could not parse valid move tokens or facelets from '${rawMovesOrState}'. ${invalidTokens.length ? `Invalid tokens: ${invalidTokens.join(', ')}` : ''}`,
      };
    }

    // 5. For 3x3: Reconstruct full 3D cube state and validate physical invariants
    if (puzzleType === '3x3') {
      const { state, isValid, issues } = reconstructAndValidate3x3State(moves);

      if (!isValid) {
        return {
          success: false,
          simulatorName: this.name,
          puzzleType,
          scrambleMoves: moves,
          normalizedMovesStr: normalizedStr,
          errorCode: 'INVALID_CUBE_CONFIGURATION',
          error: `Resulting cube state failed physical parity checks: ${issues.join('; ')}`,
        };
      }

      return {
        success: true,
        simulatorName: this.name,
        puzzleType,
        scrambleMoves: moves,
        normalizedMovesStr: normalizedStr,
        cubeState3x3: state,
        metadata: {
          rawParam: rawMovesOrState,
          description: `Extracted ${moves.length} moves (${normalizedStr}) from ${this.name}`,
          moveCount: moves.length,
        },
      };
    }

    return {
      success: true,
      simulatorName: this.name,
      puzzleType,
      scrambleMoves: moves,
      normalizedMovesStr: normalizedStr,
      metadata: {
        rawParam: rawMovesOrState,
        description: `Extracted ${moves.length} moves for ${puzzleType} from ${this.name}`,
        moveCount: moves.length,
      },
    };
  },
};
