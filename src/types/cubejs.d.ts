declare module 'cubejs' {
  export default class Cube {
    constructor(state?: any);
    static initSolver(): void;
    static fromString(str: string): Cube;
    static random(): Cube;
    static inverse(algorithm: string | number[] | number): string;
    static scramble(): string;
    init(state: any): void;
    identity(): void;
    toJSON(): any;
    asString(): string;
    clone(): Cube;
    randomize(): void;
    isSolved(): boolean;
    move(algorithm: string | number[] | number): void;
    solve(maxDepth?: number): string;
  }
}
