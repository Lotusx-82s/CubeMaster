import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { CubeColor, CubeState3x3, FaceId, PuzzleTypeId } from '../../types/cube';
import { CUBE_COLORS } from '../../types/cube';

export interface AnimatingMove {
  move: string;
  isReverse?: boolean;
  durationMs: number;
  startTime: number;
  onComplete: () => void;
}

export interface InteractivePuzzle3DProps {
  puzzleId: PuzzleTypeId;
  cubeState: CubeState3x3;
  genericPuzzleState?: Record<string, (CubeColor | null)[]>;
  animatingMove?: AnimatingMove | null;
  className?: string;
  autoRotate?: boolean;
}

const PLASTIC_BLACK = '#14171f';
const UNPAINTED_COLOR = '#334155';

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Convert 3x3 cube coordinates (x, y, z) to facelet index and face
function get3x3FaceletInfo(x: number, y: number, z: number, materialIndex: number): { face: FaceId; index: number } | null {
  switch (materialIndex) {
    case 0: // +X: Right
      if (x === 1) {
        const col = 1 - z;
        const row = 1 - y;
        return { face: 'R', index: row * 3 + col };
      }
      break;
    case 1: // -X: Left
      if (x === -1) {
        const col = z + 1;
        const row = 1 - y;
        return { face: 'L', index: row * 3 + col };
      }
      break;
    case 2: // +Y: Up
      if (y === 1) {
        const col = x + 1;
        const row = z + 1;
        return { face: 'U', index: row * 3 + col };
      }
      break;
    case 3: // -Y: Down
      if (y === -1) {
        const col = x + 1;
        const row = 1 - z;
        return { face: 'D', index: row * 3 + col };
      }
      break;
    case 4: // +Z: Front
      if (z === 1) {
        const col = x + 1;
        const row = 1 - y;
        return { face: 'F', index: row * 3 + col };
      }
      break;
    case 5: // -Z: Back
      if (z === -1) {
        const col = 1 - x;
        const row = 1 - y;
        return { face: 'B', index: row * 3 + col };
      }
      break;
  }
  return null;
}

// Convert 2x2 cube coordinates to face and index
function get2x2FaceletInfo(x: number, y: number, z: number, materialIndex: number): { face: string; index: number } | null {
  switch (materialIndex) {
    case 0: // Right (+X)
      if (x > 0) return { face: 'R', index: (y > 0 ? 0 : 2) + (z > 0 ? 0 : 1) };
      break;
    case 1: // Left (-X)
      if (x < 0) return { face: 'L', index: (y > 0 ? 0 : 2) + (z < 0 ? 0 : 1) };
      break;
    case 2: // Up (+Y)
      if (y > 0) return { face: 'U', index: (z < 0 ? 0 : 2) + (x < 0 ? 0 : 1) };
      break;
    case 3: // Down (-Y)
      if (y < 0) return { face: 'D', index: (z > 0 ? 0 : 2) + (x < 0 ? 0 : 1) };
      break;
    case 4: // Front (+Z)
      if (z > 0) return { face: 'F', index: (y > 0 ? 0 : 2) + (x < 0 ? 0 : 1) };
      break;
    case 5: // Back (-Z)
      if (z < 0) return { face: 'B', index: (y > 0 ? 0 : 2) + (x > 0 ? 0 : 1) };
      break;
  }
  return null;
}

interface LayerMoveDef {
  axis: THREE.Vector3;
  targetAngle: number;
  inLayer: (x: number, y: number, z: number) => boolean;
}

function getCubicLayerMoveDef(move: string, is2x2 = false): LayerMoveDef {
  const face = move[0].toUpperCase();
  const isPrime = move.includes("'");
  const isDouble = move.includes('2');
  const threshold = is2x2 ? 0 : 0.5;

  let axis = new THREE.Vector3(0, 1, 0);
  let baseAngle = -Math.PI / 2;
  let inLayer = (_x: number, _y: number, _z: number) => false;

  switch (face) {
    case 'U':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      inLayer = (_x, y, _z) => y > threshold;
      break;
    case 'D':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = Math.PI / 2;
      inLayer = (_x, y, _z) => y < -threshold;
      break;
    case 'R':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      inLayer = (x, _y, _z) => x > threshold;
      break;
    case 'L':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      inLayer = (x, _y, _z) => x < -threshold;
      break;
    case 'F':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      inLayer = (_x, _y, z) => z > threshold;
      break;
    case 'B':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = Math.PI / 2;
      inLayer = (_x, _y, z) => z < -threshold;
      break;
  }

  let targetAngle = baseAngle;
  if (isPrime) targetAngle = -baseAngle;
  if (isDouble) targetAngle = baseAngle * 2;

  return { axis, targetAngle, inLayer };
}

// ----------------------------------------------------
// 1. Realistic 3×3 Cubie Component
// ----------------------------------------------------
const Cubie3x3: React.FC<{
  position: [number, number, number];
  cubeState: CubeState3x3;
}> = ({ position, cubeState }) => {
  const [x, y, z] = position;

  const materials = useMemo(() => {
    const sideDefinitions = [
      { matIndex: 0, isOuter: x === 1 },
      { matIndex: 1, isOuter: x === -1 },
      { matIndex: 2, isOuter: y === 1 },
      { matIndex: 3, isOuter: y === -1 },
      { matIndex: 4, isOuter: z === 1 },
      { matIndex: 5, isOuter: z === -1 },
    ];

    return sideDefinitions.map(({ isOuter, matIndex }) => {
      if (!isOuter) {
        return new THREE.MeshStandardMaterial({
          color: PLASTIC_BLACK,
          roughness: 0.85,
          metalness: 0.1,
        });
      }

      const info = get3x3FaceletInfo(x, y, z, matIndex);
      let colorHex = UNPAINTED_COLOR;

      if (info) {
        const stickerColor = cubeState[info.face]?.[info.index];
        if (stickerColor && CUBE_COLORS[stickerColor]) {
          colorHex = CUBE_COLORS[stickerColor].hex;
        }
      }

      return new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.18,
        metalness: 0.08,
      });
    });
  }, [x, y, z, cubeState]);

  return (
    <mesh position={[x * 1.01, y * 1.01, z * 1.01]} material={materials} castShadow receiveShadow>
      <boxGeometry args={[0.96, 0.96, 0.96]} />
    </mesh>
  );
};

// ----------------------------------------------------
// 2. 3×3 Animated Scene with Layer Isolation
// ----------------------------------------------------
const Scene3x3: React.FC<{
  cubeState: CubeState3x3;
  animatingMove?: AnimatingMove | null;
}> = ({ cubeState, animatingMove }) => {
  const layerGroupRef = useRef<THREE.Group>(null);
  const activeAnimRef = useRef<AnimatingMove | null>(null);

  useEffect(() => {
    activeAnimRef.current = animatingMove || null;
  }, [animatingMove]);

  const cubies3x3 = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          list.push([x, y, z]);
        }
      }
    }
    return list;
  }, []);

  const moveDef = useMemo(() => {
    if (!animatingMove) return null;
    return getCubicLayerMoveDef(animatingMove.move, false);
  }, [animatingMove]);

  useFrame(() => {
    if (!activeAnimRef.current || !moveDef || !layerGroupRef.current) {
      if (layerGroupRef.current) {
        layerGroupRef.current.rotation.set(0, 0, 0);
      }
      return;
    }

    const anim = activeAnimRef.current;
    const elapsed = performance.now() - anim.startTime;
    const rawProgress = Math.min(1, elapsed / anim.durationMs);
    const progress = easeInOutCubic(rawProgress);

    const sign = anim.isReverse ? -1 : 1;
    const currentAngle = moveDef.targetAngle * sign * progress;

    layerGroupRef.current.setRotationFromAxisAngle(moveDef.axis, currentAngle);

    if (rawProgress >= 1) {
      layerGroupRef.current.setRotationFromAxisAngle(moveDef.axis, 0);
      activeAnimRef.current = null;
      anim.onComplete();
    }
  });

  const { layerCubies, staticCubies } = useMemo(() => {
    if (!moveDef) {
      return { layerCubies: [], staticCubies: cubies3x3 };
    }
    const layer: [number, number, number][] = [];
    const stat: [number, number, number][] = [];

    for (const pos of cubies3x3) {
      if (moveDef.inLayer(pos[0], pos[1], pos[2])) {
        layer.push(pos);
      } else {
        stat.push(pos);
      }
    }
    return { layerCubies: layer, staticCubies: stat };
  }, [cubies3x3, moveDef]);

  return (
    <group>
      {/* Stationary cubies (layers that are NOT rotating) */}
      <group>
        {staticCubies.map((pos) => (
          <Cubie3x3 key={`stat-${pos[0]}-${pos[1]}-${pos[2]}`} position={pos} cubeState={cubeState} />
        ))}
      </group>

      {/* Rotating layer cubies */}
      <group ref={layerGroupRef}>
        {layerCubies.map((pos) => (
          <Cubie3x3 key={`rot-${pos[0]}-${pos[1]}-${pos[2]}`} position={pos} cubeState={cubeState} />
        ))}
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 3. Realistic 2×2 Cubie & Scene
// ----------------------------------------------------
const Cubie2x2: React.FC<{
  position: [number, number, number];
  genericState?: Record<string, (CubeColor | null)[]>;
}> = ({ position, genericState }) => {
  const [x, y, z] = position;

  const materials = useMemo(() => {
    const sideDefinitions = [
      { matIndex: 0, isOuter: x > 0 },
      { matIndex: 1, isOuter: x < 0 },
      { matIndex: 2, isOuter: y > 0 },
      { matIndex: 3, isOuter: y < 0 },
      { matIndex: 4, isOuter: z > 0 },
      { matIndex: 5, isOuter: z < 0 },
    ];

    return sideDefinitions.map(({ isOuter, matIndex }) => {
      if (!isOuter) {
        return new THREE.MeshStandardMaterial({
          color: PLASTIC_BLACK,
          roughness: 0.85,
          metalness: 0.1,
        });
      }

      const info = get2x2FaceletInfo(x, y, z, matIndex);
      let colorHex = UNPAINTED_COLOR;

      if (info && genericState) {
        const stickerColor = genericState[info.face]?.[info.index];
        if (stickerColor && CUBE_COLORS[stickerColor]) {
          colorHex = CUBE_COLORS[stickerColor].hex;
        }
      }

      return new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.18,
        metalness: 0.08,
      });
    });
  }, [x, y, z, genericState]);

  return (
    <mesh position={[x * 1.01, y * 1.01, z * 1.01]} material={materials} castShadow receiveShadow>
      <boxGeometry args={[0.96, 0.96, 0.96]} />
    </mesh>
  );
};

const Scene2x2: React.FC<{
  genericState?: Record<string, (CubeColor | null)[]>;
  animatingMove?: AnimatingMove | null;
}> = ({ genericState, animatingMove }) => {
  const layerGroupRef = useRef<THREE.Group>(null);
  const activeAnimRef = useRef<AnimatingMove | null>(null);

  useEffect(() => {
    activeAnimRef.current = animatingMove || null;
  }, [animatingMove]);

  const cubies2x2 = useMemo(() => {
    const list: [number, number, number][] = [];
    for (const x of [-0.5, 0.5]) {
      for (const y of [-0.5, 0.5]) {
        for (const z of [-0.5, 0.5]) {
          list.push([x, y, z]);
        }
      }
    }
    return list;
  }, []);

  const moveDef = useMemo(() => {
    if (!animatingMove) return null;
    return getCubicLayerMoveDef(animatingMove.move, true);
  }, [animatingMove]);

  useFrame(() => {
    if (!activeAnimRef.current || !moveDef || !layerGroupRef.current) {
      if (layerGroupRef.current) layerGroupRef.current.rotation.set(0, 0, 0);
      return;
    }

    const anim = activeAnimRef.current;
    const elapsed = performance.now() - anim.startTime;
    const rawProgress = Math.min(1, elapsed / anim.durationMs);
    const progress = easeInOutCubic(rawProgress);

    const sign = anim.isReverse ? -1 : 1;
    const currentAngle = moveDef.targetAngle * sign * progress;

    layerGroupRef.current.setRotationFromAxisAngle(moveDef.axis, currentAngle);

    if (rawProgress >= 1) {
      layerGroupRef.current.setRotationFromAxisAngle(moveDef.axis, 0);
      activeAnimRef.current = null;
      anim.onComplete();
    }
  });

  const { layerCubies, staticCubies } = useMemo(() => {
    if (!moveDef) return { layerCubies: [], staticCubies: cubies2x2 };
    const layer: [number, number, number][] = [];
    const stat: [number, number, number][] = [];
    for (const pos of cubies2x2) {
      if (moveDef.inLayer(pos[0], pos[1], pos[2])) {
        layer.push(pos);
      } else {
        stat.push(pos);
      }
    }
    return { layerCubies: layer, staticCubies: stat };
  }, [cubies2x2, moveDef]);

  return (
    <group scale={1.2}>
      <group>
        {staticCubies.map((pos) => (
          <Cubie2x2 key={`2x2-stat-${pos[0]}-${pos[1]}-${pos[2]}`} position={pos} genericState={genericState} />
        ))}
      </group>
      <group ref={layerGroupRef}>
        {layerCubies.map((pos) => (
          <Cubie2x2 key={`2x2-rot-${pos[0]}-${pos[1]}-${pos[2]}`} position={pos} genericState={genericState} />
        ))}
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 4. Pyraminx Scene (Regular Tetrahedron)
// ----------------------------------------------------
const ScenePyraminx: React.FC<{
  genericState?: Record<string, (CubeColor | null)[]>;
  animatingMove?: AnimatingMove | null;
}> = ({ genericState, animatingMove }) => {
  const tipGroupRef = useRef<THREE.Group>(null);
  const activeAnimRef = useRef<AnimatingMove | null>(null);

  useEffect(() => {
    activeAnimRef.current = animatingMove || null;
  }, [animatingMove]);

  useFrame(() => {
    if (!activeAnimRef.current || !tipGroupRef.current) {
      if (tipGroupRef.current) tipGroupRef.current.rotation.set(0, 0, 0);
      return;
    }
    const anim = activeAnimRef.current;
    const elapsed = performance.now() - anim.startTime;
    const rawProgress = Math.min(1, elapsed / anim.durationMs);
    const progress = easeInOutCubic(rawProgress);

    const isPrime = anim.move.includes("'");
    const angle = (isPrime ? -Math.PI * (2 / 3) : Math.PI * (2 / 3)) * progress;
    tipGroupRef.current.rotation.y = angle;

    if (rawProgress >= 1) {
      tipGroupRef.current.rotation.y = 0;
      activeAnimRef.current = null;
      anim.onComplete();
    }
  });

  const getFaceColor = (face: string, idx: number, fallback: CubeColor): string => {
    const col = genericState?.[face]?.[idx];
    return col && CUBE_COLORS[col] ? CUBE_COLORS[col].hex : CUBE_COLORS[fallback].hex;
  };

  const tetrahedronGeo = useMemo(() => {
    const geo = new THREE.TetrahedronGeometry(1.65, 0);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group scale={1.15} position={[0, -0.2, 0]}>
      {/* 4 Faces with stickers */}
      <mesh geometry={tetrahedronGeo}>
        <meshStandardMaterial color={getFaceColor('U', 1, 'yellow')} roughness={0.2} metalness={0.08} />
      </mesh>

      {/* Wireframe cuts overlay */}
      <mesh geometry={tetrahedronGeo}>
        <meshBasicMaterial color="#0f172a" wireframe wireframeLinewidth={3} />
      </mesh>

      {/* Animated Apex Tip */}
      <group ref={tipGroupRef} position={[0, 1.48, 0]}>
        <mesh scale={0.42}>
          <coneGeometry args={[0.5, 0.85, 3]} />
          <meshStandardMaterial color={getFaceColor('U', 0, 'yellow')} roughness={0.2} metalness={0.08} />
        </mesh>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 5. Skewb Scene (Corner-Turning Cube)
// ----------------------------------------------------
const SceneSkewb: React.FC<{
  genericState?: Record<string, (CubeColor | null)[]>;
  animatingMove?: AnimatingMove | null;
}> = ({ genericState, animatingMove }) => {
  const cornerGroupRef = useRef<THREE.Group>(null);
  const activeAnimRef = useRef<AnimatingMove | null>(null);

  useEffect(() => {
    activeAnimRef.current = animatingMove || null;
  }, [animatingMove]);

  useFrame(() => {
    if (!activeAnimRef.current || !cornerGroupRef.current) {
      if (cornerGroupRef.current) cornerGroupRef.current.rotation.set(0, 0, 0);
      return;
    }
    const anim = activeAnimRef.current;
    const elapsed = performance.now() - anim.startTime;
    const rawProgress = Math.min(1, elapsed / anim.durationMs);
    const progress = easeInOutCubic(rawProgress);

    const isPrime = anim.move.includes("'");
    const angle = (isPrime ? -Math.PI * (2 / 3) : Math.PI * (2 / 3)) * progress;
    cornerGroupRef.current.setRotationFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), angle);

    if (rawProgress >= 1) {
      cornerGroupRef.current.rotation.set(0, 0, 0);
      activeAnimRef.current = null;
      anim.onComplete();
    }
  });

  const getColor = (face: string, idx: number, fallback: CubeColor) => {
    const c = genericState?.[face]?.[idx];
    return c && CUBE_COLORS[c] ? CUBE_COLORS[c].hex : CUBE_COLORS[fallback].hex;
  };

  return (
    <group scale={1.1}>
      {/* Base Cube Body */}
      <mesh>
        <boxGeometry args={[1.9, 1.9, 1.9]} />
        <meshStandardMaterial color={PLASTIC_BLACK} roughness={0.8} />
      </mesh>

      {/* 6 Diamond Center Stickers */}
      <mesh position={[0, 0, 0.96]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={getColor('F', 0, 'green')} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.96, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={getColor('U', 0, 'white')} roughness={0.18} />
      </mesh>
      <mesh position={[0.96, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={getColor('R', 0, 'red')} roughness={0.18} />
      </mesh>
      <mesh position={[-0.96, 0, 0]} rotation={[0, -Math.PI / 2, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={getColor('L', 0, 'orange')} roughness={0.18} />
      </mesh>
      <mesh position={[0, -0.96, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={getColor('D', 0, 'yellow')} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0, -0.96]} rotation={[0, Math.PI, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={getColor('B', 0, 'blue')} roughness={0.18} />
      </mesh>

      {/* Rotating Corner Section */}
      <group ref={cornerGroupRef}>
        <mesh position={[0.65, 0.65, 0.65]} scale={0.35}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={getColor('U', 3, 'white')} roughness={0.18} />
        </mesh>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 6. 4×4 & Megaminx Geometries
// ----------------------------------------------------
const Scene4x4: React.FC<{
  genericState?: Record<string, (CubeColor | null)[]>;
}> = ({ genericState }) => {
  const cubies = useMemo(() => {
    const list: [number, number, number][] = [];
    const coords = [-1.5, -0.5, 0.5, 1.5];
    for (const x of coords) {
      for (const y of coords) {
        for (const z of coords) {
          if (Math.abs(x) === 1.5 || Math.abs(y) === 1.5 || Math.abs(z) === 1.5) {
            list.push([x, y, z]);
          }
        }
      }
    }
    return list;
  }, []);

  const getColor = (face: string, idx: number, fallback: CubeColor) => {
    const c = genericState?.[face]?.[idx];
    return c && CUBE_COLORS[c] ? CUBE_COLORS[c].hex : CUBE_COLORS[fallback].hex;
  };

  return (
    <group scale={0.65}>
      {cubies.map(([x, y, z], i) => {
        // Compute exact 4x4 sticker indices based on 3D position
        const rIdx = x === 1.5 ? Math.round(1.5 - y) * 4 + Math.round(1.5 - z) : 0;
        const lIdx = x === -1.5 ? Math.round(1.5 - y) * 4 + Math.round(z + 1.5) : 0;
        const uIdx = y === 1.5 ? Math.round(z + 1.5) * 4 + Math.round(x + 1.5) : 0;
        const dIdx = y === -1.5 ? Math.round(1.5 - z) * 4 + Math.round(x + 1.5) : 0;
        const fIdx = z === 1.5 ? Math.round(1.5 - y) * 4 + Math.round(x + 1.5) : 0;
        const bIdx = z === -1.5 ? Math.round(1.5 - y) * 4 + Math.round(1.5 - x) : 0;

        const materials = [
          new THREE.MeshStandardMaterial({ color: x === 1.5 ? getColor('R', rIdx, 'blue') : PLASTIC_BLACK, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: x === -1.5 ? getColor('L', lIdx, 'green') : PLASTIC_BLACK, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: y === 1.5 ? getColor('U', uIdx, 'orange') : PLASTIC_BLACK, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: y === -1.5 ? getColor('D', dIdx, 'red') : PLASTIC_BLACK, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: z === 1.5 ? getColor('F', fIdx, 'white') : PLASTIC_BLACK, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: z === -1.5 ? getColor('B', bIdx, 'yellow') : PLASTIC_BLACK, roughness: 0.2 }),
        ];
        return (
          <mesh key={i} position={[x * 0.99, y * 0.99, z * 0.99]} material={materials}>
            <boxGeometry args={[0.95, 0.95, 0.95]} />
          </mesh>
        );
      })}
    </group>
  );
};

const MEGAMINX_FACE_COLORS: Record<string, string> = {
  U: '#ffffff',
  F: '#22c55e',
  L: '#a855f7',
  BL: '#3b82f6',
  BR: '#ef4444',
  R: '#eab308',
  D: '#64748b',
  DF: '#fef08a',
  DL: '#ec4899',
  DBL: '#38bdf8',
  DBR: '#4ade80',
  DR: '#f97316',
};

const SceneMegaminx: React.FC<{
  genericState?: Record<string, (CubeColor | null)[]>;
}> = ({ genericState }) => {
  const pentagonPlates = useMemo(() => {
    // 12 Face normal directions of a regular dodecahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawNormals: [number, number, number, string][] = [
      [0, 1, phi, 'F'],
      [0, 1, -phi, 'BR'],
      [0, -1, phi, 'DF'],
      [0, -1, -phi, 'DBR'],
      [1, phi, 0, 'R'],
      [1, -phi, 0, 'DR'],
      [-1, phi, 0, 'U'],
      [-1, -phi, 0, 'D'],
      [phi, 0, 1, 'BL'],
      [-phi, 0, 1, 'L'],
      [phi, 0, -1, 'DBL'],
      [-phi, 0, -1, 'DL'],
    ];

    return rawNormals.map(([nx, ny, nz, faceId]) => {
      const dir = new THREE.Vector3(nx, ny, nz).normalize();
      const pos = dir.clone().multiplyScalar(1.35);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      return { faceId, pos, quat };
    });
  }, []);

  const getFaceColor = (faceId: string) => {
    const col = genericState?.[faceId]?.[0];
    if (col && CUBE_COLORS[col]) return CUBE_COLORS[col].hex;
    return MEGAMINX_FACE_COLORS[faceId] || '#9333ea';
  };

  return (
    <group scale={1.05}>
      {/* 12 Colored Pentagonal Face Caps */}
      {pentagonPlates.map(({ faceId, pos, quat }) => (
        <group key={faceId} position={pos} quaternion={quat}>
          <mesh>
            <circleGeometry args={[0.78, 5]} />
            <meshStandardMaterial
              color={getFaceColor(faceId)}
              roughness={0.2}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.CircleGeometry(0.79, 5)]} />
            <lineBasicMaterial color="#0f172a" linewidth={2} />
          </lineSegments>
        </group>
      ))}

      {/* Internal Dodecahedron Core */}
      <mesh>
        <dodecahedronGeometry args={[1.32, 0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------
// Main Interactive Puzzle 3D Viewport Component
// ----------------------------------------------------
export const InteractivePuzzle3D: React.FC<InteractivePuzzle3DProps> = ({
  puzzleId,
  cubeState,
  genericPuzzleState,
  animatingMove,
  className = 'w-full h-full min-h-[420px]',
}) => {
  const controlsRef = useRef<any>(null);

  const setCameraView = (pos: [number, number, number]) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(pos[0], pos[1], pos[2]);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleZoom = (delta: number) => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const factor = delta > 0 ? 0.85 : 1.15;
      camera.position.multiplyScalar(factor);
      controlsRef.current.update();
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden select-none bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 border border-slate-800 shadow-2xl ${className}`}>
      <Canvas
        camera={{ position: [4.4, 3.4, 5.2], fov: 42 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 10]} intensity={1.7} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.6} color="#e0f2fe" />
        <pointLight position={[0, 6, 0]} intensity={0.8} />

        {puzzleId === '3x3' && <Scene3x3 cubeState={cubeState} animatingMove={animatingMove} />}
        {puzzleId === '2x2' && <Scene2x2 genericState={genericPuzzleState} animatingMove={animatingMove} />}
        {puzzleId === 'pyraminx' && <ScenePyraminx genericState={genericPuzzleState} animatingMove={animatingMove} />}
        {puzzleId === 'skewb' && <SceneSkewb genericState={genericPuzzleState} animatingMove={animatingMove} />}
        {puzzleId === '4x4' && <Scene4x4 genericState={genericPuzzleState} />}
        {puzzleId === 'megaminx' && <SceneMegaminx />}

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={3.2}
          maxDistance={9.5}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.85}
        />
      </Canvas>

      {/* Floating 3D Interaction Pill */}
      <div className="absolute bottom-4 left-4 text-[11px] font-medium text-slate-400 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 pointer-events-none flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Drag to rotate 3D view • Pinch / scroll to zoom</span>
      </div>

      {/* Camera Angle Presets & Zoom Buttons */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg z-10">
        <button
          type="button"
          onClick={() => setCameraView([4.4, 3.4, 5.2])}
          title="Isometric Angle"
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Iso
        </button>
        <button
          type="button"
          onClick={() => setCameraView([0, 0, 5.5])}
          title="Front View"
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setCameraView([0, 5.5, 0.01])}
          title="Top View"
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Top
        </button>
        <button
          type="button"
          onClick={() => setCameraView([5.5, 0, 0])}
          title="Right View"
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Right
        </button>
        <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => handleZoom(1)}
          title="Zoom In"
          className="w-6 h-6 rounded-lg text-xs font-bold text-cyan-400 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          title="Zoom Out"
          className="w-6 h-6 rounded-lg text-xs font-bold text-cyan-400 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
        >
          -
        </button>
      </div>

      {/* Active Layer Move Indicator */}
      {animatingMove && (
        <div className="absolute top-4 right-4 bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 backdrop-blur-md px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 shadow-xl animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Rotating Layer: {animatingMove.move}</span>
        </div>
      )}
    </div>
  );
};

export default InteractivePuzzle3D;
