import type { PuzzleTypeId } from '../../types/cube';
import type { SimulatorAdapter, SimulatorParseResult } from './types';
import { 
  normalizeMoveSequence, 
  reconstructAndValidate3x3State, 
  reconstructAndValidate2x2State, 
  reconstructAndValidate4x4State 
} from './moveNormalizer';

export const algCubingNetAdapter: SimulatorAdapter = {
  id: 'alg-cubing-net',
  name: 'Alg.cubing.net',
  domains: ['alg.cubing.net', 'cubing.net'],
  description: "Lucas Garron's official WCA-compliant Rubik's cube simulator and algorithm viewer.",
  exampleUrl: 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=3x3x3',
  supportedPuzzles: ['3x3', '2x2', '4x4', 'pyraminx'],

  matchesUrl(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return this.domains.some(d => host === d || host.endsWith('.' + d));
  },

  parse(url: URL): SimulatorParseResult {
    // 1. Detect puzzle type from 'puzzle' parameter
    const rawPuzzle = (url.searchParams.get('puzzle') || '3x3x3').toLowerCase();
    let puzzleType: PuzzleTypeId = '3x3';

    if (rawPuzzle === '3x3x3' || rawPuzzle === '3x3' || rawPuzzle === 'cube') {
      puzzleType = '3x3';
    } else if (rawPuzzle === '2x2x2' || rawPuzzle === '2x2') {
      puzzleType = '2x2';
    } else if (rawPuzzle === '4x4x4' || rawPuzzle === '4x4') {
      puzzleType = '4x4';
    } else if (rawPuzzle === 'pyraminx') {
      puzzleType = 'pyraminx';
    } else {
      return {
        success: false,
        simulatorName: this.name,
        errorCode: 'UNSUPPORTED_PUZZLE_TYPE',
        error: `Alg.cubing.net specified puzzle '${rawPuzzle}', which is not currently supported for automated solving.`,
      };
    }

    // 2. Extract scramble moves from 'setup' or 'alg' parameters
    const rawMoves = url.searchParams.get('setup') || url.searchParams.get('alg');

    if (!rawMoves) {
      return {
        success: false,
        simulatorName: this.name,
        puzzleType,
        errorCode: 'NO_CUBE_STATE_FOUND',
        error: "No 'setup' or 'alg' scramble parameter found in the Alg.cubing.net URL.",
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
          description: `Extracted ${moves.length} moves (${normalizedStr}) from Alg.cubing.net`,
          moveCount: moves.length,
        },
      };
    }

    // 5. For 2x2: Reconstruct 2x2 state and validate invariants
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
          rawParam: rawMoves,
          description: `Extracted ${moves.length} moves (${normalizedStr}) for 2×2 from Alg.cubing.net`,
          moveCount: moves.length,
        },
      };
    }

    // 6. For 4x4: Reconstruct 4x4 state
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
          rawParam: rawMoves,
          description: `Extracted ${moves.length} moves for 4×4 from Alg.cubing.net`,
          moveCount: moves.length,
        },
      };
    }

    // Other supported puzzle (e.g. pyraminx)
    return {
      success: true,
      simulatorName: this.name,
      puzzleType,
      scrambleMoves: moves,
      normalizedMovesStr: normalizedStr,
      metadata: {
        rawParam: rawMoves,
        description: `Extracted ${moves.length} moves for ${puzzleType} from Alg.cubing.net`,
        moveCount: moves.length,
      },
    };
  },
};
