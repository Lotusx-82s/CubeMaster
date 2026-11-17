import type { CubeColor, FaceId, SolutionStep } from '../../types/cube.ts';
import type { GenericPuzzleState, IPuzzleSolver, SolverResult } from './types.ts';

interface CornerDef2x2 {
  id: string;
  name: string;
  slots: [FaceId, number, FaceId, number, FaceId, number];
  colors: [CubeColor, CubeColor, CubeColor];
}

export const CORNERS_2X2: CornerDef2x2[] = [
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
    const p0 = this.cp[0], o0 = this.co[0];
    next.cp[0] = this.cp[1]; next.co[0] = this.co[1];
    next.cp[1] = this.cp[2]; next.co[1] = this.co[2];
    next.cp[2] = this.cp[3]; next.co[2] = this.co[3];
    next.cp[3] = p0;         next.co[3] = o0;
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

  applyD(): Cube2x2Model {
    const next = this.clone();
    const p4 = this.cp[4], o4 = this.co[4];
    next.cp[4] = this.cp[7]; next.co[4] = this.co[7];
    next.cp[7] = this.cp[6]; next.co[7] = this.co[6];
    next.cp[6] = this.cp[5]; next.co[6] = this.co[5];
    next.cp[5] = p4;         next.co[5] = o4;
    return next;
  }

  applyL(): Cube2x2Model {
    const next = this.clone();
    const p0 = this.cp[0], o0 = this.co[0];
    next.cp[0] = this.cp[3]; next.co[0] = (this.co[3] + 1) % 3;
    next.cp[3] = this.cp[7]; next.co[3] = (this.co[7] + 2) % 3;
    next.cp[7] = this.cp[4]; next.co[7] = (this.co[4] + 1) % 3;
    next.cp[4] = p0;         next.co[4] = (o0 + 2) % 3;
    return next;
  }

  applyB(): Cube2x2Model {
    const next = this.clone();
    const p2 = this.cp[2], o2 = this.co[2];
    next.cp[2] = this.cp[6]; next.co[2] = (this.co[6] + 2) % 3;
    next.cp[6] = this.cp[7]; next.co[6] = (this.co[7] + 1) % 3;
    next.cp[7] = this.cp[3]; next.co[7] = (this.co[3] + 2) % 3;
    next.cp[3] = p2;         next.co[3] = (o2 + 1) % 3;
    return next;
  }

  move(m: string): Cube2x2Model {
    const f = m[0];
    const isDouble = m.includes('2');
    const isPrime = m.includes("'");
    const count = isDouble ? 2 : isPrime ? 3 : 1;
    let res: Cube2x2Model = this.clone();
    for (let i = 0; i < count; i++) {
      if (f === 'U') res = res.applyU();
      else if (f === 'R') res = res.applyR();
      else if (f === 'F') res = res.applyF();
      else if (f === 'D') res = res.applyD();
      else if (f === 'L') res = res.applyL();
      else if (f === 'B') res = res.applyB();
    }
    return res;
  }
}

export const MOVES_2X2 = [
  'U', "U'", 'U2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'B', "B'", 'B2',
];

const FACE_INDICES: Record<string, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

// Pruning table coordinates
function getOrientationCoord(co: number[]): number {
  let res = 0;
  for (let i = 0; i < 7; i++) {
    res = res * 3 + co[i];
  }
  return res;
}

const FACTORIALS = [5040, 720, 120, 24, 6, 2, 1, 1];
function getPermutationCoord(cp: number[]): number {
  let val = 0;
  for (let i = 0; i < 7; i++) {
    let count = 0;
    for (let j = i + 1; j < 8; j++) {
      if (cp[j] < cp[i]) count++;
    }
    val += count * FACTORIALS[i];
  }
  return val;
}

// Lazily computed pattern database pruning tables
let oriPrun: Int8Array | null = null;
let permPrun: Int8Array | null = null;

function ensurePruningTables(): void {
  if (oriPrun && permPrun) return;

  // 1. Orientation pruning table (size 2,187)
  oriPrun = new Int8Array(2187).fill(-1);
  oriPrun[0] = 0;
  let oriQueue = [new Cube2x2Model()];
  let oriDep = 0;
  while (oriQueue.length > 0) {
    const nextQ: Cube2x2Model[] = [];
    oriDep++;
    for (const s of oriQueue) {
      for (const m of MOVES_2X2) {
        const ns = s.move(m);
        const coord = getOrientationCoord(ns.co);
        if (oriPrun[coord] === -1) {
          oriPrun[coord] = oriDep;
          nextQ.push(ns);
        }
      }
    }
    oriQueue = nextQ;
  }

  // 2. Permutation pruning table (size 40,320)
  permPrun = new Int8Array(40320).fill(-1);
  permPrun[0] = 0;
  let permQueue = [new Cube2x2Model()];
  let permDep = 0;
  while (permQueue.length > 0) {
    const nextQ: Cube2x2Model[] = [];
    permDep++;
    for (const cur of permQueue) {
      for (const m of MOVES_2X2) {
        const ns = cur.move(m);
        const coord = getPermutationCoord(ns.cp);
        if (permPrun[coord] === -1) {
          permPrun[coord] = permDep;
          nextQ.push(ns);
        }
      }
    }
    permQueue = nextQ;
  }
}

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
        const udColor = target.colors[0]; // orange or red
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
    D: 'Down (Red)',
    L: 'Left (Green)',
    B: 'Back (Yellow)',
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
  id = 'ida-optimal-2x2';
  name = 'CubeMaster 2×2 Optimal IDA* Solver';
  puzzleType = '2x2' as const;
  description = 'Optimal Iterative Deepening A* (IDA*) algorithm with pattern database heuristics, finding solutions in 11 moves or fewer.';
  isReady = true;

  async solve(state: GenericPuzzleState, timeoutMs = 8000): Promise<SolverResult> {
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

    // 3. Ensure pruning tables are loaded
    ensurePruningTables();
    const oriTable = oriPrun!;
    const permTable = permPrun!;

    // 4. IDA* Search
    let foundMoves: string[] | null = null;
    let timedOut = false;

    function search(
      current: Cube2x2Model,
      g: number,
      threshold: number,
      lastFace: number,
      path: string[]
    ): string[] | null {
      if (performance.now() - startTime > timeoutMs) {
        timedOut = true;
        return null;
      }

      const hOri = oriTable[getOrientationCoord(current.co)];
      const hPerm = permTable[getPermutationCoord(current.cp)];
      const h = Math.max(hOri, hPerm);

      if (g + h > threshold) return null;
      if (current.isSolved()) return path;

      for (const m of MOVES_2X2) {
        const f = FACE_INDICES[m[0]];
        if (f === lastFace) continue;
        // Commutative pair restrictions: opposite faces U(0)-D(3), R(1)-L(4), F(2)-B(5)
        if (f === 0 && lastFace === 3) continue;
        if (f === 1 && lastFace === 4) continue;
        if (f === 2 && lastFace === 5) continue;

        const nextModel = current.move(m);
        path.push(m);
        const res = search(nextModel, g + 1, threshold, f, path);
        if (res) return res;
        path.pop();
        if (timedOut) return null;
      }

      return null;
    }

    // Search depths up to God's number (11 moves)
    for (let depth = 1; depth <= 11; depth++) {
      if (performance.now() - startTime > timeoutMs) {
        timedOut = true;
        break;
      }
      const path: string[] = [];
      const res = search(startModel, 0, depth, -1, path);
      if (res) {
        foundMoves = res;
        break;
      }
    }

    if (timedOut) {
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

    // 5. Verify solution by simulating on model and generating snapshots
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
