import type { CubeColor, FaceId, SolutionStep } from '../../types/cube.ts';
import type { GenericPuzzleState, IPuzzleSolver, SolverResult } from './types.ts';

interface CornerDef2x2 {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

const CORNERS_2X2: CornerDef2x2[] = [
  { id: 'UFL', name: 'Up-Front-Left', slots: ['U', 2, 'F', 0, 'L', 1], colors: ['orange', 'white', 'green'] },
  { id: 'UFR', name: 'Up-Front-Right', slots: ['U', 3, 'R', 0, 'F', 1], colors: ['orange', 'blue', 'white'] },
  { id: 'UBR', name: 'Up-Back-Right', slots: ['U', 1, 'B', 0, 'R', 1], colors: ['orange', 'yellow', 'blue'] },
  { id: 'UBL', name: 'Up-Back-Left', slots: ['U', 0, 'L', 0, 'B', 1], colors: ['orange', 'green', 'yellow'] },
  { id: 'DFL', name: 'Down-Front-Left', slots: ['D', 0, 'L', 3, 'F', 2], colors: ['red', 'green', 'white'] },
  { id: 'DFR', name: 'Down-Front-Right', slots: ['D', 1, 'F', 3, 'R', 2], colors: ['red', 'white', 'blue'] },
  { id: 'DBR', name: 'Down-Back-Right', slots: ['D', 3, 'R', 3, 'B', 2], colors: ['red', 'blue', 'yellow'] },
  { id: 'DBL', name: 'Down-Back-Left', slots: ['D', 2, 'B', 3, 'L', 2], colors: ['red', 'yellow', 'green'] },
];

export class Cube2x2Model {
  cp: number[];
  co: number[];

  constructor(cp = [0, 1, 2, 3, 4, 5, 6, 7], co = [0, 0, 0, 0, 0, 0, 0, 0]) {
    this.cp = [...cp];
    this.co = [...co];
  }

  isSolved(): boolean {
    for (let i = 0; i < 8; i++) {
      if (this.cp[i] !== i || this.co[i] !== 0) return false;
    }
    return true;
  }

  clone(): Cube2x2Model {
    return new Cube2x2Model(this.cp, this.co);
  }

  key(): string {
    return this.cp.join('') + '-' + this.co.join('');
  }

  applyU(): Cube2x2Model {
    const next = this.clone();
    const p3 = this.cp[3], o3 = this.co[3];
    next.cp[3] = this.cp[2]; next.co[3] = this.co[2];
    next.cp[2] = this.cp[1]; next.co[2] = this.co[1];
    next.cp[1] = this.cp[0]; next.co[1] = this.co[0];
    next.cp[0] = p3;         next.co[0] = o3;
    return next;
  }

  applyR(): Cube2x2Model {
    const next = this.clone();
    const p1 = this.cp[1], o1 = this.co[1];
    next.cp[1] = this.cp[5]; next.co[1] = (this.co[5] + 2) % 3;
    next.cp[5] = this.cp[6]; next.co[5] = (this.co[6] + 1) % 3;
    next.cp[6] = this.cp[2]; next.co[6] = (this.co[2] + 2) % 3;
    next.cp[2] = p1;         next.co[2] = (o1 + 1) % 3;
    return next;
  }

  applyF(): Cube2x2Model {
    const next = this.clone();
    const p0 = this.cp[0], o0 = this.co[0];
    next.cp[0] = this.cp[4]; next.co[0] = (this.co[4] + 2) % 3;
    next.cp[4] = this.cp[5]; next.co[4] = (this.co[5] + 1) % 3;
    next.cp[5] = this.cp[1]; next.co[5] = (this.co[1] + 2) % 3;
    next.cp[1] = p0;         next.co[1] = (o0 + 1) % 3;
    return next;
  }

  move(m: string): Cube2x2Model {
    switch (m) {
      case 'U': return this.applyU();
      case "U'": return this.applyU().applyU().applyU();
      case 'U2': return this.applyU().applyU();
      case 'R': return this.applyR();
      case "R'": return this.applyR().applyR().applyR();
      case 'R2': return this.applyR().applyR();
      case 'F': return this.applyF();
      case "F'": return this.applyF().applyF().applyF();
      case 'F2': return this.applyF().applyF();
      default: return this;
    }
  }
}

const MOVES_2X2 = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];
const INVERSE_2X2: Record<string, string> = {
  'U': "U'", "U'": 'U', 'U2': 'U2',
  'R': "R'", "R'": 'R', 'R2': 'R2',
  'F': "F'", "F'": 'F', 'F2': 'F2',
};

/**
 * Extracts Cube2x2Model representation from generic state
 */
export function extract2x2Model(state: GenericPuzzleState): Cube2x2Model {
  const cp: number[] = [];
  const co: number[] = [];

  for (let slotIdx = 0; slotIdx < CORNERS_2X2.length; slotIdx++) {
    const def = CORNERS_2X2[slotIdx];
    const [f1, i1, f2, i2, f3, i3] = def.slots;
    const c1 = state[f1]?.[i1] || 'white';
    const c2 = state[f2]?.[i2] || 'green';
    const c3 = state[f3]?.[i3] || 'orange';

    let matchedIdx = slotIdx;
    let twist = 0;

    for (let targetIdx = 0; targetIdx < CORNERS_2X2.length; targetIdx++) {
      const target = CORNERS_2X2[targetIdx];
      const targetSet = new Set(target.colors);
      if (targetSet.has(c1) && targetSet.has(c2) && targetSet.has(c3)) {
        matchedIdx = targetIdx;
        const udColor = target.colors[0]; // white or yellow
        if (c1 === udColor) twist = 0;
        else if (c2 === udColor) twist = 1;
        else if (c3 === udColor) twist = 2;
        break;
      }
    }

    cp.push(matchedIdx);
    co.push(twist);
  }

  return new Cube2x2Model(cp, co);
}

export function is2x2Solved(state: GenericPuzzleState): boolean {
  const faces = ['U', 'D', 'F', 'B', 'R', 'L'];
  for (const face of faces) {
    const stickers = state[face];
    if (!stickers || stickers.length < 4) return false;
    const first = stickers[0];
    if (!first) return false;
    if (stickers.slice(0, 4).some(s => s !== first)) return false;
  }
  return true;
}

export function describeMove2x2(move: string): SolutionStep {
  const face = move[0];
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");
  const angle = isDouble ? 180 : isPrime ? -90 : 90;

  const faceNames: Record<string, string> = {
    U: 'Up (Orange)',
    R: 'Right (Blue)',
    F: 'Front (White)',
  };

  const name = faceNames[face] || face;
  const dirWord = isDouble ? '180° half-turn' : isPrime ? '90° counter-clockwise' : '90° clockwise';

  return {
    move,
    face,
    angle,
    description: `Rotate ${name} face ${dirWord} (${move})`,
    explanation: `Rotate the ${name} layer of the 2×2 cube ${dirWord}.`,
  };
}

export function modelTo2x2GenericState(model: Cube2x2Model): GenericPuzzleState {
  const state: GenericPuzzleState = {
    U: Array(4).fill(null),
    D: Array(4).fill(null),
    F: Array(4).fill(null),
    B: Array(4).fill(null),
    R: Array(4).fill(null),
    L: Array(4).fill(null),
  };

  for (let slotIdx = 0; slotIdx < CORNERS_2X2.length; slotIdx++) {
    const slotDef = CORNERS_2X2[slotIdx];
    const [f1, i1, f2, i2, f3, i3] = slotDef.slots;
    const pieceIdx = model.cp[slotIdx];
    const twist = model.co[slotIdx];
    const [c1, c2, c3] = CORNERS_2X2[pieceIdx].colors;

    if (twist === 0) {
      state[f1][i1] = c1;
      state[f2][i2] = c2;
      state[f3][i3] = c3;
    } else if (twist === 1) {
      state[f1][i1] = c3;
      state[f2][i2] = c1;
      state[f3][i3] = c2;
    } else {
      state[f1][i1] = c2;
      state[f2][i2] = c3;
      state[f3][i3] = c1;
    }
  }

  return state;
}

export class Pocket2x2Solver implements IPuzzleSolver<GenericPuzzleState> {
  id = 'bfs-ortega-2x2';
  name = 'CubeMaster 2×2 Optimal BFS Solver';
  puzzleType = '2x2' as const;
  description = 'Optimal bidirectional search algorithm for 2×2 Pocket Cubes that finds solutions in 11 moves or fewer.';
  isReady = true;

  async solve(state: GenericPuzzleState, timeoutMs = 5000): Promise<SolverResult> {
    const startTime = performance.now();

    // 1. Check if already solved
    if (is2x2Solved(state)) {
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

    // 2. Convert state into permutation and orientation model
    const startModel = extract2x2Model(state);

    if (startModel.isSolved()) {
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

    // 3. Bidirectional BFS Search
    const forwardMap = new Map<string, string[]>();
    const backwardMap = new Map<string, string[]>();

    const solvedModel = new Cube2x2Model();
    forwardMap.set(startModel.key(), []);
    backwardMap.set(solvedModel.key(), []);

    let fQueue = [startModel];
    let bQueue = [solvedModel];

    let foundMoves: string[] | null = null;
    const maxDepth = 6; // Max 6 in each direction = 12 moves (God's number is 11)

    for (let depth = 0; depth < maxDepth; depth++) {
      if (performance.now() - startTime > timeoutMs) {
        return {
          success: false,
          algorithmName: this.name,
          totalMoves: 0,
          moves: [],
          steps: [],
          executionTimeMs: Math.round(performance.now() - startTime),
          isVerified: false,
          error: `2×2 Solver timed out after ${timeoutMs}ms.`,
        };
      }

      // Expand Forward layer
      const nextFQueue: Cube2x2Model[] = [];
      for (const current of fQueue) {
        const path = forwardMap.get(current.key())!;
        const lastFace = path.length > 0 ? path[path.length - 1][0] : '';

        for (const m of MOVES_2X2) {
          if (m[0] === lastFace) continue;
          const nextModel = current.move(m);
          const k = nextModel.key();

          if (backwardMap.has(k)) {
            const bPath = backwardMap.get(k)!;
            foundMoves = [...path, m, ...bPath];
            break;
          }

          if (!forwardMap.has(k)) {
            forwardMap.set(k, [...path, m]);
            nextFQueue.push(nextModel);
          }
        }
        if (foundMoves) break;
      }
      if (foundMoves) break;
      fQueue = nextFQueue;

      // Expand Backward layer
      const nextBQueue: Cube2x2Model[] = [];
      for (const current of bQueue) {
        const path = backwardMap.get(current.key())!;
        const lastFace = path.length > 0 ? path[0][0] : '';

        for (const m of MOVES_2X2) {
          if (m[0] === lastFace) continue;
          const invM = INVERSE_2X2[m];
          const nextModel = current.move(invM);
          const k = nextModel.key();

          if (forwardMap.has(k)) {
            const fPath = forwardMap.get(k)!;
            foundMoves = [...fPath, m, ...path];
            break;
          }

          if (!backwardMap.has(k)) {
            backwardMap.set(k, [m, ...path]);
            nextBQueue.push(nextModel);
          }
        }
        if (foundMoves) break;
      }
      if (foundMoves) break;
      bQueue = nextBQueue;
    }

    if (!foundMoves) {
      return {
        success: false,
        algorithmName: this.name,
        totalMoves: 0,
        moves: [],
        steps: [],
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: false,
        error: 'No solution path found within search depth limit.',
      };
    }

    // 4. Verify solution by simulating on model and collecting snapshots
    let verifier = startModel.clone();
    const steps: SolutionStep[] = [];
    for (const m of foundMoves) {
      verifier = verifier.move(m);
      steps.push({
        ...describeMove2x2(m),
        genericSnapshot: modelTo2x2GenericState(verifier),
      });
    }

    if (!verifier.isSolved()) {
      return {
        success: false,
        algorithmName: this.name,
        totalMoves: 0,
        moves: [],
        steps: [],
        executionTimeMs: Math.round(performance.now() - startTime),
        isVerified: false,
        error: 'Verification error: Generated solution does not solve the 2×2 cube.',
      };
    }

    return {
      success: true,
      algorithmName: this.name,
      totalMoves: foundMoves.length,
      moves: foundMoves,
      steps,
      executionTimeMs: Math.round(performance.now() - startTime),
      isVerified: true,
    };
  }
}
