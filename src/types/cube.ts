export type CubeColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange';

export type FaceId = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type PuzzleTypeId = '3x3' | '2x2' | '4x4' | 'pyraminx';

export type InputMode = 'manual' | 'camera';

export interface PuzzleDefinition {
  id: PuzzleTypeId;
  name: string;
  category: string;
  size: number;
  faces: number;
  stickersPerFace: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  supported: boolean;
  algorithmSupport: string;
  badge?: string;
}

export interface ColorDef {
  id: CubeColor;
  label: string;
  hex: string;
  borderHex: string;
  textColor: string;
}

export const CUBE_COLORS: Record<CubeColor, ColorDef> = {
  white: { id: 'white', label: 'White', hex: '#f8fafc', borderHex: '#cbd5e1', textColor: '#0f172a' },
  yellow: { id: 'yellow', label: 'Yellow', hex: '#facc15', borderHex: '#eab308', textColor: '#713f12' },
  green: { id: 'green', label: 'Green', hex: '#16a34a', borderHex: '#15803d', textColor: '#ffffff' },
  blue: { id: 'blue', label: 'Blue', hex: '#2563eb', borderHex: '#1d4ed8', textColor: '#ffffff' },
  red: { id: 'red', label: 'Red', hex: '#dc2626', borderHex: '#b91c1c', textColor: '#ffffff' },
  orange: { id: 'orange', label: 'Orange', hex: '#ea580c', borderHex: '#c2410c', textColor: '#ffffff' },
};

export const FACE_NAMES: Record<FaceId, { name: string; standardColor: CubeColor; opposite: FaceId }> = {
  U: { name: 'Up (Top)', standardColor: 'white', opposite: 'D' },
  D: { name: 'Down (Bottom)', standardColor: 'yellow', opposite: 'U' },
  F: { name: 'Front', standardColor: 'green', opposite: 'B' },
  B: { name: 'Back', standardColor: 'blue', opposite: 'F' },
  R: { name: 'Right', standardColor: 'red', opposite: 'L' },
  L: { name: 'Left', standardColor: 'orange', opposite: 'R' },
};

// 3x3 Cube state: 6 faces, each face is an array of 9 CubeColor (or null if empty during manual fill)
// Face array index:
// 0 1 2
// 3 4 5  (index 4 is center)
// 6 7 8
export type FaceState = (CubeColor | null)[];

export type CubeState3x3 = Record<FaceId, FaceState>;

export interface SolutionStep {
  move: string;              // e.g. "R", "U'", "F2"
  face: FaceId;
  angle: number;             // in degrees (90, -90, 180)
  description: string;       // e.g. "Rotate the Right face 90° clockwise"
  explanation: string;       // Detailed hint/CFOP step context
  stateSnapshot?: CubeState3x3;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  title: string;
  message: string;
  face?: FaceId;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  colorCounts: Record<CubeColor, number>;
  expectedCountPerColor: number;
}
