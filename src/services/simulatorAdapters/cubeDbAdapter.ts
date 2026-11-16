import type { PuzzleTypeId } from '../../types/cube';
import type { SimulatorAdapter, SimulatorParseResult } from './types';
import { normalizeMoveSequence, reconstructAndValidate3x3State } from './moveNormalizer';

export const cubeDbAdapter: SimulatorAdapter = {
  id: 'cubedb-net',
  name: 'CubeDB.net',
  domains: ['cubedb.net', 'www.cubedb.net'],
  description: "Speedcubing reconstruction database and 3D step-by-step solver simulator.",
  exampleUrl: "https://cubedb.net/?puzzle=3&scramble=R_U_R-_U-_F2_D_L2_B-",
  supportedPuzzles: ['3x3', '2x2', '4x4'],

  matchesUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return this.domains.some(d => host === d || host.endsWith('.' + d));
  },

  parse(url: URL): SimulatorParseResult {
    // 1. Detect puzzle
    const rawPuzzle = (url.searchParams.get('puzzle') || '3').toLowerCase();
    let puzzleType: PuzzleTypeId = '3x3';

    if (rawPuzzle === '3' || rawPuzzle === '3x3' || rawPuzzle === '3x3x3') {
      puzzleType = '3x3';
    } else if (rawPuzzle === '2' || rawPuzzle === '2x2' || rawPuzzle === '2x2x2') {
      puzzleType = '2x2';
    } else if (rawPuzzle === '4' || rawPuzzle === '4x4' || rawPuzzle === '4x4x4') {
      puzzleType = '4x4';
    } else {
      return {
        success: false,
        simulatorName: this.name,
        errorCode: 'UNSUPPORTED_PUZZLE_TYPE',
        error: `CubeDB specified puzzle '${rawPuzzle}', which is not currently supported.`,
      };
    }

    // 2. Extract scramble moves
    const rawMoves = url.searchParams.get('scramble') || url.searchParams.get('alg');

    if (!rawMoves) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType,
        errorCode: 'NO_CUBE_STATE_FOUND',
        error: "No 'scramble' or 'alg' parameter found in the CubeDB URL.",
      };
    }

    // 3. Normalize move sequence
    const { moves, normalizedStr, invalidTokens } = normalizeMoveSequence(rawMoves);

    if (moves.length === 0) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType,
        errorCode: 'EXTRACTION_FAILURE',
        error: `Could not parse any valid move tokens from '${rawMoves}'. ${invalidTokens.length ? `Invalid tokens: ${invalidTokens.join(', ')}` : ''}`,
      };
    }

    // 4. For 3x3: Reconstruct full 3D cube state and validate physical invariants
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
          rawParam: rawMoves,
          description: `Extracted ${moves.length} moves (${normalizedStr}) from CubeDB`,
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
        rawParam: rawMoves,
        description: `Extracted ${moves.length} moves for ${puzzleType} from CubeDB`,
        moveCount: moves.length,
      },
    };
  },
};
