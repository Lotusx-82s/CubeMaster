import type { PuzzleTypeId } from '../../types/cube';
import type { SimulatorAdapter, SimulatorParseResult } from './types';
import { 
  normalizeMoveSequence, 
  reconstructAndValidate3x3State, 
  reconstructAndValidate2x2State,
  reconstructAndValidate4x4State,
  parseFaceletString 
} from './moveNormalizer';
import { validateCubeState3x3 } from '../validator';

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

    // 2. Extract scramble, alg, moves, or 54-facelet state
    const rawMovesOrState = extractParam(url, [
      'f',
      'facelets',
      'scramble',
      'moves',
      'alg',
      'setup',
      'state',
      'pattern',
      's',
      'stickers',
      'cube',
    ]);

    if (!rawMovesOrState) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType,
        errorCode: 'NO_CUBE_STATE_FOUND',
        error: `RubiksCu.be / Ruwix link recognized, but no scramble parameter ('?scramble=...') or facelet parameter ('?f=...') was found. On RubiksCu.be, click 'Share' to generate a link or append '?scramble=...' or '?f=...'.`,
      };
    }

    // 3. Check if it's a 54-facelet string representation (e.g. rubikscu.be/play/?f=...)
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
              moveCount: 0,
            },
          };
        } else {
          return {
            success: false,
            simulatorName: this.name,
            puzzleType: '3x3',
            errorCode: 'INVALID_CUBE_CONFIGURATION',
            error: `54-facelet configuration found but failed physical validation: ${validation.issues.map(i => i.message).join('; ')}`,
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

    // 6. For 2x2: Reconstruct 2x2 state and validate invariants
    if (puzzleType === '2x2') {
      const { state, isValid, issues } = reconstructAndValidate2x2State(moves);

      if (!isValid) {
        return {
          success: false,
          simulatorName: this.name,
          puzzleType,
          scrambleMoves: moves,
          normalizedMovesStr: normalizedStr,
          errorCode: 'INVALID_CUBE_CONFIGURATION',
          error: `Resulting 2×2 cube state failed physical parity checks: ${issues.join('; ')}`,
        };
      }

      return {
        success: true,
        simulatorName: this.name,
        puzzleType,
        scrambleMoves: moves,
        normalizedMovesStr: normalizedStr,
        genericPuzzleState: state,
        metadata: {
          rawParam: rawMovesOrState,
          description: `Extracted ${moves.length} moves (${normalizedStr}) for 2×2 from ${this.name}`,
          moveCount: moves.length,
        },
      };
    }

    // 7. For 4x4: Reconstruct 4x4 state
    if (puzzleType === '4x4') {
      const { state } = reconstructAndValidate4x4State(moves);

      return {
        success: true,
        simulatorName: this.name,
        puzzleType,
        scrambleMoves: moves,
        normalizedMovesStr: normalizedStr,
        genericPuzzleState: state,
        metadata: {
          rawParam: rawMovesOrState,
          description: `Extracted ${moves.length} moves for 4×4 from ${this.name}`,
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
