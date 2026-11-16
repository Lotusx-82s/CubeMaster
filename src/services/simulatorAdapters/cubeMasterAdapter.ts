import type { PuzzleTypeId } from '../../types/cube';
import type { SimulatorAdapter, SimulatorParseResult } from './types';
import { normalizeMoveSequence, reconstructAndValidate3x3State } from './moveNormalizer';

export const cubeMasterAdapter: SimulatorAdapter = {
  id: 'cubemaster-native',
  name: 'CubeMaster Native',
  domains: ['cubemaster.app', 'cubemaster.vercel.app', 'localhost', '127.0.0.1'],
  description: "Native CubeMaster scramble sharing and simulator links.",
  exampleUrl: "https://cubemaster.app/?puzzle=3x3&scramble=R_U_R-_U-_F2_D_L2_B-",
  supportedPuzzles: ['3x3', '2x2', '4x4', 'pyraminx', 'skewb', 'megaminx'],

  matchesUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return this.domains.some(d => host === d || host.endsWith('.' + d));
  },

  parse(url: URL): SimulatorParseResult {
    const rawPuzzle = (url.searchParams.get('puzzle') || '3x3').toLowerCase() as PuzzleTypeId;
    const rawMoves = url.searchParams.get('scramble') || url.searchParams.get('moves') || url.searchParams.get('alg');

    if (!rawMoves) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType: rawPuzzle,
        errorCode: 'NO_CUBE_STATE_FOUND',
        error: "No 'scramble' or 'moves' parameter found in the CubeMaster URL.",
      };
    }

    const { moves, normalizedStr, invalidTokens } = normalizeMoveSequence(rawMoves);

    if (moves.length === 0) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType: rawPuzzle,
        errorCode: 'EXTRACTION_FAILURE',
        error: `Could not parse any valid move tokens from '${rawMoves}'. ${invalidTokens.length ? `Invalid tokens: ${invalidTokens.join(', ')}` : ''}`,
      };
    }

    if (rawPuzzle === '3x3') {
      const { state, isValid, issues } = reconstructAndValidate3x3State(moves);

      if (!isValid) {
        return {
          success: false,
          simulatorName: this.name,
          puzzleType: rawPuzzle,
          scrambleMoves: moves,
          normalizedMovesStr: normalizedStr,
          errorCode: 'INVALID_CUBE_CONFIGURATION',
          error: `Resulting cube state failed physical parity checks: ${issues.join('; ')}`,
        };
      }

      return {
        success: true,
        simulatorName: this.name,
        puzzleType: rawPuzzle,
        scrambleMoves: moves,
        normalizedMovesStr: normalizedStr,
        cubeState3x3: state,
        metadata: {
          rawParam: rawMoves,
          description: `Extracted ${moves.length} moves (${normalizedStr}) from CubeMaster`,
          moveCount: moves.length,
        },
      };
    }

    return {
      success: true,
      simulatorName: this.name,
      puzzleType: rawPuzzle,
      scrambleMoves: moves,
      normalizedMovesStr: normalizedStr,
      metadata: {
        rawParam: rawMoves,
        description: `Extracted ${moves.length} moves for ${rawPuzzle} from CubeMaster`,
        moveCount: moves.length,
      },
    };
  },
};
