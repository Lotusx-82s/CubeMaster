import type { CubeState3x3 } from '../../types/cube';
import { createSolvedCubeState, applyMoves } from '../cubeState';
import { validateCubeState3x3 } from '../validator';

// Whitelist of valid standard 3x3 WCA moves
const VALID_3X3_MOVES = new Set([
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
]);

/**
 * Normalizes a raw move sequence string extracted from URL query parameters.
 * Handles URL representations:
 * - Hyphen '-' used as prime symbol in alg.cubing.net (e.g., 'R-' -> "R'")
 * - Underscore '_' or '+' used as move separators
 * - Unicode quotes: '’', '‘' -> "'"
 * - Parentheses or brackets from alg triggers: '(R U R\')' -> 'R U R\''
 */
export function normalizeMoveSequence(rawString: string): { moves: string[]; normalizedStr: string; invalidTokens: string[] } {
  if (!rawString) {
    return { moves: [], normalizedStr: '', invalidTokens: [] };
  }

  // 1. Replace separators and quotes
  let cleaned = decodeURIComponent(rawString)
    .replace(/[+_]/g, ' ')
    .replace(/[’‘`]/g, "'")
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Tokenize by space
  const tokens = cleaned.split(' ').filter(Boolean);
  const validMoves: string[] = [];
  const invalidTokens: string[] = [];

  for (let token of tokens) {
    // Convert trailing '-' to "'" (standard in alg.cubing.net)
    if (token.endsWith('-')) {
      token = token.slice(0, -1) + "'";
    }

    // Capitalize the face letter (e.g. 'u' -> 'U')
    if (token.length > 0) {
      const face = token[0].toUpperCase();
      const suffix = token.slice(1);
      token = face + suffix;
    }

    if (VALID_3X3_MOVES.has(token)) {
      validMoves.push(token);
    } else {
      invalidTokens.push(token);
    }
  }

  return {
    moves: validMoves,
    normalizedStr: validMoves.join(' '),
    invalidTokens,
  };
}

/**
 * Reconstructs the 3x3 cube state by applying the normalized moves to a solved cube,
 * and verifies that the resulting state satisfies all Rubik's cube physical invariants.
 */
export function reconstructAndValidate3x3State(moves: string[]): {
  state: CubeState3x3;
  isValid: boolean;
  issues: string[];
} {
  const solved = createSolvedCubeState();
  const state = applyMoves(solved, moves);
  const validation = validateCubeState3x3(state);

  return {
    state,
    isValid: validation.isValid,
    issues: validation.issues.map(i => i.message),
  };
}
