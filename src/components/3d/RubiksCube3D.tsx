import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { CubeState3x3, FaceId } from '../../types/cube';
import { CUBE_COLORS } from '../../types/cube';

interface RubiksCube3DProps {
  cubeState: CubeState3x3;
  onStickerClick?: (face: FaceId, index: number) => void;
  interactive?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  highlightFace?: FaceId;
}

// Convert cube coordinates (x, y, z) to facelet index and face
function getFaceletInfo(x: number, y: number, z: number, materialIndex: number): { face: FaceId; index: number } | null {
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

const PLASTIC_BLACK = '#181b22';
const UNPAINTED_COLOR = '#334155';

interface CubieProps {
  position: [number, number, number];
  cubeState: CubeState3x3;
  onStickerClick?: (face: FaceId, index: number) => void;
  interactive?: boolean;
  highlightFace?: FaceId;
}

const Cubie: React.FC<CubieProps> = ({ position, cubeState, onStickerClick, interactive, highlightFace }) => {
  const [x, y, z] = position;

  const materials = useMemo(() => {
    const sideDefinitions: { matIndex: number; isOuter: boolean; face: FaceId }[] = [
      { matIndex: 0, isOuter: x === 1, face: 'R' },
      { matIndex: 1, isOuter: x === -1, face: 'L' },
      { matIndex: 2, isOuter: y === 1, face: 'U' },
      { matIndex: 3, isOuter: y === -1, face: 'D' },
      { matIndex: 4, isOuter: z === 1, face: 'F' },
      { matIndex: 5, isOuter: z === -1, face: 'B' },
    ];

    return sideDefinitions.map(({ isOuter, face, matIndex }) => {
      if (!isOuter) {
        return new THREE.MeshStandardMaterial({
          color: PLASTIC_BLACK,
          roughness: 0.8,
          metalness: 0.1,
        });
      }

      const info = getFaceletInfo(x, y, z, matIndex);
      let colorHex = UNPAINTED_COLOR;
      const roughness = 0.2;
      const metalness = 0.05;

      if (info) {
        const stickerColor = cubeState[info.face][info.index];
        if (stickerColor && CUBE_COLORS[stickerColor]) {
          colorHex = CUBE_COLORS[stickerColor].hex;
        }
      }

      const isFaceHighlighted = highlightFace && highlightFace === face;

      return new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: roughness,
        metalness: metalness,
        emissive: isFaceHighlighted ? new THREE.Color('#38bdf8') : new THREE.Color(0, 0, 0),
        emissiveIntensity: isFaceHighlighted ? 0.35 : 0,
      });
    });
  }, [x, y, z, cubeState, highlightFace]);

  const handleClick = (e: any) => {
    if (!interactive || !onStickerClick) return;
    e.stopPropagation();

    const matIndex = e.face?.materialIndex;
    if (matIndex !== undefined) {
      const info = getFaceletInfo(x, y, z, matIndex);
      if (info) {
        onStickerClick(info.face, info.index);
      }
    }
  };

  return (
    <mesh
      position={position}
      material={materials}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.96, 0.96, 0.96]} />
    </mesh>
  );
};

export const RubiksCubeScene: React.FC<{
  cubeState: CubeState3x3;
  onStickerClick?: (face: FaceId, index: number) => void;
  interactive?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  highlightFace?: FaceId;
}> = ({ cubeState, onStickerClick, interactive, autoRotate, autoRotateSpeed = 1, highlightFace }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4 * autoRotateSpeed;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0008) * 0.15;
    }
  });

  const cubies = useMemo(() => {
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

  return (
    <group ref={groupRef}>
      {cubies.map((pos) => (
        <Cubie
          key={`${pos[0]}-${pos[1]}-${pos[2]}`}
          position={pos}
          cubeState={cubeState}
          onStickerClick={onStickerClick}
          interactive={interactive}
          highlightFace={highlightFace}
        />
      ))}
    </group>
  );
};

export const RubiksCube3D: React.FC<RubiksCube3DProps> = ({
  cubeState,
  onStickerClick,
  interactive = true,
  autoRotate = false,
  autoRotateSpeed = 1,
  highlightFace,
}) => {
  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden select-none bg-gradient-to-b from-slate-900/60 to-slate-950/90 border border-slate-800/80 shadow-2xl">
      <Canvas
        camera={{ position: [4.2, 3.2, 5], fov: 42 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.6} />
        <pointLight position={[0, 5, 0]} intensity={0.7} />

        <RubiksCubeScene
          cubeState={cubeState}
          onStickerClick={onStickerClick}
          interactive={interactive}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          highlightFace={highlightFace}
        />

        <OrbitControls
          enablePan={false}
          minDistance={3.5}
          maxDistance={9}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.8}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 pointer-events-none flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>Drag to rotate • Scroll to zoom {interactive ? '• Click sticker to paint' : ''}</span>
      </div>
    </div>
  );
};

export default RubiksCube3D;
