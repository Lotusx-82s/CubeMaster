import type { GenericPuzzleState, IPuzzleSolver, SolverResult } from './types.ts';

function clonePyraminx(state: GenericPuzzleState): GenericPuzzleState {
  return {
    U: [...(state.U || [])],
    L: [...(state.L || [])],
    R: [...(state.R || [])],
    B: [...(state.B || [])],
  };
}

export function isPyraminxSolved(state: GenericPuzzleState): boolean {
  const faces = ['U', 'L', 'R', 'B'];
  for (const f of faces) {
    const stickers = state[f];
    if (!stickers || stickers.length < 9) return false;
    const first = stickers[0];
    if (!first) return false;
    if (stickers.slice(0, 9).some(s => s !== first)) return false;
  }
  return true;
}

/**
 * 1. Tip Alignment Phase
 */
function solveTips(state: GenericPuzzleState): { alignedState: GenericPuzzleState; tipMoves: string[] } {
  const next = clonePyraminx(state);
  const tipMoves: string[] = [];

  // Top Apex Tip (U[0], L[0], R[0] vs center U[1], L[3], R[1])
  if (next.U[0] !== next.U[1]) {
    // Try CW (u): U[0] gets L[0], L[0] gets R[0], R[0] gets U[0]
    const u0 = next.U[0], l0 = next.L[0], r0 = next.R[0];
    if (l0 === next.U[1]) {
      next.U[0] = l0; next.L[0] = r0; next.R[0] = u0;
      tipMoves.push('u');
    } else {
      next.U[0] = r0; next.L[0] = u0; next.R[0] = l0;
      tipMoves.push("u'");
    }
  }

  // Left Tip (U[4], L[8], B[4] vs center U[3], L[6], B[3])
  if (next.U[4] !== next.U[3]) {
    const u4 = next.U[4], l8 = next.L[8], b4 = next.B[4];
    if (l8 === next.U[3]) {
      next.U[4] = l8; next.L[8] = b4; next.B[4] = u4;
      tipMoves.push('l');
    } else {
      next.U[4] = b4; next.L[8] = u4; next.B[4] = l8;
      tipMoves.push("l'");
    }
  }

  // Right Tip (U[8], R[4], B[8] vs center U[6], R[3], B[6])
  if (next.U[8] !== next.U[6]) {
    const u8 = next.U[8], r4 = next.R[4], b8 = next.B[8];
    if (r4 === next.U[6]) {
      next.U[8] = r4; next.R[4] = b8; next.B[8] = u8;
      tipMoves.push('r');
    } else {
      next.U[8] = b8; next.R[4] = u8; next.B[8] = r4;
      tipMoves.push("r'");
    }
  }

  // Back Tip (L[4], R[8], B[0] vs center L[1], R[6], B[1])
  if (next.L[4] !== next.L[1]) {
    const l4 = next.L[4], r8 = next.R[8], b0 = next.B[0];
    if (r8 === next.L[1]) {
      next.L[4] = r8; next.R[8] = b0; next.B[0] = l4;
      tipMoves.push('b');
    } else {
      next.L[4] = b0; next.R[8] = l4; next.B[0] = r8;
      tipMoves.push("b'");
    }
  }

  return { alignedState: next, tipMoves };
}

/**
 * Applies a layer move (U, U', L, L', R, R', B, B') to Pyraminx state
 */
export function applyPyraminxMove(state: GenericPuzzleState, move: string): GenericPuzzleState {
  const next = clonePyraminx(state);

  switch (move) {
    case 'U': {
      // Rotate top layer CW: cycles centers (U[1], R[1], L[3]) and edges (U[2], L[2], U[7], R[5], U[5], B[7])
      const tempU1 = next.U[1];
      next.U[1] = next.L[3];
      next.L[3] = next.R[1];
      next.R[1] = tempU1;

      // Tip also turns with layer
      const tempU0 = next.U[0];
      next.U[0] = next.L[0];
      next.L[0] = next.R[0];
      next.R[0] = tempU0;

      // Edges around U:
      // (U[2], L[2]) -> (R[5], U[7]) -> (B[7], U[5])
      const eUL_u = next.U[2], eUL_l = next.L[2];
      next.U[2] = next.L[5]; next.L[2] = next.R[2];
      next.L[5] = next.R[7]; next.R[2] = next.B[5];
      next.R[7] = eUL_u;     next.B[5] = eUL_l;
      break;
    }
    case "U'": {
      return applyPyraminxMove(applyPyraminxMove(next, 'U'), 'U');
    }
    case 'R': {
      const tempR3 = next.R[3];
      next.R[3] = next.U[6];
      next.U[6] = next.B[6];
      next.B[6] = tempR3;

      const tempR4 = next.R[4];
      next.R[4] = next.U[8];
      next.U[8] = next.B[8];
      next.B[8] = tempR4;

      const eUR_u = next.U[7], eUR_r = next.R[5];
      next.U[7] = next.B[7]; next.R[5] = next.U[5];
      next.B[7] = next.B[5]; next.U[5] = next.R[7];
      next.B[5] = eUR_u;     next.R[7] = eUR_r;
      break;
    }
    case "R'": {
      return applyPyraminxMove(applyPyraminxMove(next, 'R'), 'R');
    }
    case 'L': {
      const tempL6 = next.L[6];
      next.L[6] = next.B[3];
      next.B[3] = next.U[3];
      next.U[3] = tempL6;

      const tempL8 = next.L[8];
      next.L[8] = next.B[4];
      next.B[4] = next.U[4];
      next.U[4] = tempL8;

      const eUL_u = next.U[2], eUL_l = next.L[2];
      next.U[2] = next.B[7]; next.L[2] = next.U[5];
      next.B[7] = next.L[7]; next.U[5] = next.B[2];
      next.L[7] = eUL_u;     next.B[2] = eUL_l;
      break;
    }
    case "L'": {
      return applyPyraminxMove(applyPyraminxMove(next, 'L'), 'L');
    }
    case 'B': {
      const tempB1 = next.B[1];
      next.B[1] = next.R[6];
      next.R[6] = next.L[1];
      next.L[1] = tempB1;

      const tempB0 = next.B[0];
      next.B[0] = next.R[8];
      next.R[8] = next.L[4];
      next.L[4] = tempB0;
      break;
    }
    case "B'": {
      return applyPyraminxMove(applyPyraminxMove(next, 'B'), 'B');
    }
  }

  return next;
}

const PYRAMINX_LAYER_MOVES = ['U', "U'", 'L', "L'", 'R', "R'", 'B', "B'"];

function pyraminxKey(state: GenericPuzzleState): string {
  return (
    (state.U || []).join('') +
    (state.L || []).join('') +
    (state.R || []).join('') +
    (state.B || []).join('')
  );
}

export class PyraminxSolver implements IPuzzleSolver<GenericPuzzleState> {
  id = 'pyraminx-bfs-solver';
  name = 'CubeMaster Pyraminx Optimal Solver';
  puzzleType = 'pyraminx' as const;
  description = 'Two-phase optimal solver for Pyraminx tetrahedrons that aligns tips and searches the 11,520 axial/edge state space.';
  isReady = true;

  async solve(state: GenericPuzzleState, timeoutMs = 6000): Promise<SolverResult> {
    const startTime = performance.now();

    if (isPyraminxSolved(state)) {
      return {
        success: true,
        algorithmName: this.name,
        totalMoves: 0,
        moves: [],
        steps: [],
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: true,
      };
    }

    // Phase 1: Tip alignment
    const { alignedState, tipMoves } = solveTips(state);

    if (isPyraminxSolved(alignedState)) {
      const steps = tipMoves.map(m => ({
        move: m,
        face: m[0].toUpperCase(),
        angle: m.includes("'") ? -90 : 90,
        description: `Rotate tip ${m} to align colors with center`,
        explanation: `Align the triangular corner tip with its adjacent face colors.`,
      }));

      return {
        success: true,
        algorithmName: this.name,
        totalMoves: tipMoves.length,
        moves: tipMoves,
        steps,
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: true,
      };
    }

    // Phase 2: BFS Search over body
    const visited = new Map<string, string[]>();
    visited.set(pyraminxKey(alignedState), []);

    let queue = [alignedState];
    let bodyMoves: string[] | null = null;

    for (let depth = 0; depth < 12; depth++) {
      if (performance.now() - startTime > timeoutMs) break;

      const nextQueue: GenericPuzzleState[] = [];
      for (const curr of queue) {
        const path = visited.get(pyraminxKey(curr))!;
        const lastFace = path.length > 0 ? path[path.length - 1][0] : '';

        for (const m of PYRAMINX_LAYER_MOVES) {
          if (m[0] === lastFace) continue; // prune consecutive same face
          const nextState = applyPyraminxMove(curr, m);

          if (isPyraminxSolved(nextState)) {
            bodyMoves = [...path, m];
            break;
          }

          const k = pyraminxKey(nextState);
          if (!visited.has(k)) {
            visited.set(k, [...path, m]);
            nextQueue.push(nextState);
          }
        }
        if (bodyMoves) break;
      }
      if (bodyMoves) break;
      queue = nextQueue;
    }

    const allMoves = [...tipMoves, ...(bodyMoves || [])];

    // Verification step
    let verifier = clonePyraminx(state);
    // Apply tips
    const afterTips = solveTips(verifier).alignedState;
    verifier = afterTips;
    for (const m of (bodyMoves || [])) {
      verifier = applyPyraminxMove(verifier, m);
    }

    const isVerified = isPyraminxSolved(verifier);

    const steps = allMoves.map(m => ({
      move: m,
      face: m[0].toUpperCase(),
      angle: m.includes("'") ? -90 : 90,
      description: `Turn Pyraminx ${m}`,
      explanation: `Rotate Pyraminx face ${m[0].toUpperCase()} ${m.includes("'") ? 'counter-clockwise' : 'clockwise'}.`,
    }));

    return {
      success: isVerified,
      algorithmName: this.name,
      totalMoves: allMoves.length,
      moves: allMoves,
      steps,
      executionTimeMs: Math.round(performance.now() - startTime),
      isVerified,
      error: isVerified ? undefined : 'Could not find a valid solution for this Pyraminx state within search depth.',
    };
  }
}
