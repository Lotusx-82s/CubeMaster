export type CubeColor = 
  | 'white' 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'red' 
  | 'orange'
  | 'purple'
  | 'pink'
  | 'lightgreen'
  | 'lightblue'
  | 'grey'
  | 'cream';

export type StandardFaceId = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type PyraminxFaceId = 'U' | 'L' | 'R' | 'B';

export type MegaminxFaceId = 
  | 'U' | 'F' | 'L' | 'BL' | 'BR' | 'R' 
  | 'D' | 'DF' | 'DL' | 'DBL' | 'DBR' | 'DR';

export type AnyFaceId = string;

export type FaceId = StandardFaceId;

export type PuzzleTypeId = '2x2' | '3x3' | '4x4' | 'pyraminx' | 'skewb' | 'megaminx';

export type InputMode = 'manual' | 'camera';

export interface PuzzleDefinition {
  id: PuzzleTypeId;
  name: string;
  category: string;
  geometryType: 'cubic' | 'tetrahedral' | 'corner-cubic' | 'dodecahedral';
  dimensionsLabel: string;
  size: number;
  facesCount: number;
  stickersPerFace: number;
  totalStickers: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  supported: boolean;
  algorithmSupport: string;
  engineName: string;
  moveNotation: string[];
  colorSet: CubeColor[];
  faceNames: { id: string; name: string; defaultColor: CubeColor }[];
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
  // Megaminx exclusive colors
  purple: { id: 'purple', label: 'Purple', hex: '#9333ea', borderHex: '#7e22ce', textColor: '#ffffff' },
  pink: { id: 'pink', label: 'Pink', hex: '#ec4899', borderHex: '#db2777', textColor: '#ffffff' },
  lightgreen: { id: 'lightgreen', label: 'Light Green', hex: '#4ade80', borderHex: '#22c55e', textColor: '#0f172a' },
  lightblue: { id: 'lightblue', label: 'Light Blue', hex: '#38bdf8', borderHex: '#0284c7', textColor: '#0f172a' },
  grey: { id: 'grey', label: 'Grey', hex: '#64748b', borderHex: '#475569', textColor: '#ffffff' },
  cream: { id: 'cream', label: 'Cream', hex: '#fef08a', borderHex: '#fde047', textColor: '#713f12' },
};

export const FACE_NAMES: Record<FaceId, { name: string; standardColor: CubeColor; opposite: FaceId }> = {
  U: { name: 'Up (Top)', standardColor: 'white', opposite: 'D' },
  D: { name: 'Down (Bottom)', standardColor: 'yellow', opposite: 'U' },
  F: { name: 'Front', standardColor: 'green', opposite: 'B' },
  B: { name: 'Back', standardColor: 'blue', opposite: 'F' },
  R: { name: 'Right', standardColor: 'red', opposite: 'L' },
  L: { name: 'Left', standardColor: 'orange', opposite: 'R' },
};

export type FaceState = (CubeColor | null)[];

export type CubeState3x3 = Record<FaceId, FaceState>;

export interface SolutionStep {
  move: string;
  face: string;
  angle: number;
  description: string;
  explanation: string;
  stateSnapshot?: CubeState3x3;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  title: string;
  message: string;
  face?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  colorCounts: Record<string, number>;
  expectedCountPerColor: number;
}
