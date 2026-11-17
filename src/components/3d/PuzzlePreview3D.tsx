import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import type { CubeColor, PuzzleTypeId } from '../../types/cube';
import { CUBE_COLORS } from '../../types/cube';

interface PuzzlePreview3DProps {
  puzzleId: PuzzleTypeId;
  puzzleState?: Record<string, (CubeColor | null)[]>;
  autoRotate?: boolean;
  className?: string;
}

const UNPAINTED_HEX = '#334155';

function getStickerHex(
  puzzleState: Record<string, (CubeColor | null)[]> | undefined,
  faceId: string,
  idx: number,
  fallbackColor: CubeColor
): string {
  if (!puzzleState || !puzzleState[faceId]) {
    return CUBE_COLORS[fallbackColor]?.hex || '#ffffff';
  }
  const color = puzzleState[faceId][idx];
  if (!color) return UNPAINTED_HEX;
  return CUBE_COLORS[color]?.hex || UNPAINTED_HEX;
}

// 1. 2×2 Preview (8 cubies)
const Preview2x2: React.FC<{ puzzleState?: Record<string, (CubeColor | null)[]> }> = ({ puzzleState }) => {
  const cubies = useMemo(() => {
    const list: [number, number, number][] = [];
    for (const x of [-0.52, 0.52]) {
      for (const y of [-0.52, 0.52]) {
        for (const z of [-0.52, 0.52]) {
          list.push([x, y, z]);
        }
      }
    }
    return list;
  }, []);

  return (
    <group scale={1.2}>
      {cubies.map(([x, y, z], i) => {
        const materials = [
          new THREE.MeshStandardMaterial({
            color: x > 0 ? getStickerHex(puzzleState, 'R', i % 4, 'red') : '#181b22',
            roughness: 0.2,
          }),
          new THREE.MeshStandardMaterial({
            color: x < 0 ? getStickerHex(puzzleState, 'L', i % 4, 'orange') : '#181b22',
            roughness: 0.2,
          }),
          new THREE.MeshStandardMaterial({
            color: y > 0 ? getStickerHex(puzzleState, 'U', i % 4, 'white') : '#181b22',
            roughness: 0.2,
          }),
          new THREE.MeshStandardMaterial({
            color: y < 0 ? getStickerHex(puzzleState, 'D', i % 4, 'yellow') : '#181b22',
            roughness: 0.2,
          }),
          new THREE.MeshStandardMaterial({
            color: z > 0 ? getStickerHex(puzzleState, 'F', i % 4, 'green') : '#181b22',
            roughness: 0.2,
          }),
          new THREE.MeshStandardMaterial({
            color: z < 0 ? getStickerHex(puzzleState, 'B', i % 4, 'blue') : '#181b22',
            roughness: 0.2,
          }),
        ];

        return (
          <mesh key={i} position={[x, y, z]} material={materials}>
            <boxGeometry args={[0.96, 0.96, 0.96]} />
          </mesh>
        );
      })}
    </group>
  );
};

// 2. 3×3 Preview (26 cubies)
const Preview3x3: React.FC = () => {
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
    <group scale={0.82}>
      {cubies.map(([x, y, z], i) => {
        const materials = [
          new THREE.MeshStandardMaterial({ color: x === 1 ? CUBE_COLORS.red.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: x === -1 ? CUBE_COLORS.orange.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: y === 1 ? CUBE_COLORS.white.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: y === -1 ? CUBE_COLORS.yellow.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: z === 1 ? CUBE_COLORS.green.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: z === -1 ? CUBE_COLORS.blue.hex : '#181b22', roughness: 0.2 }),
        ];

        return (
          <mesh key={i} position={[x * 1.02, y * 1.02, z * 1.02]} material={materials}>
            <boxGeometry args={[0.96, 0.96, 0.96]} />
          </mesh>
        );
      })}
    </group>
  );
};

// 3. 4×4 Preview (56 outer cubies)
const Preview4x4: React.FC = () => {
  const cubies = useMemo(() => {
    const list: [number, number, number][] = [];
    const coords = [-1.5, -0.5, 0.5, 1.5];
    for (const x of coords) {
      for (const y of coords) {
        for (const z of coords) {
          // Only outer shell
          if (Math.abs(x) === 1.5 || Math.abs(y) === 1.5 || Math.abs(z) === 1.5) {
            list.push([x, y, z]);
          }
        }
      }
    }
    return list;
  }, []);

  return (
    <group scale={0.62}>
      {cubies.map(([x, y, z], i) => {
        const materials = [
          new THREE.MeshStandardMaterial({ color: x === 1.5 ? CUBE_COLORS.red.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: x === -1.5 ? CUBE_COLORS.orange.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: y === 1.5 ? CUBE_COLORS.white.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: y === -1.5 ? CUBE_COLORS.yellow.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: z === 1.5 ? CUBE_COLORS.green.hex : '#181b22', roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: z === -1.5 ? CUBE_COLORS.blue.hex : '#181b22', roughness: 0.2 }),
        ];

        return (
          <mesh key={i} position={[x * 0.98, y * 0.98, z * 0.98]} material={materials}>
            <boxGeometry args={[0.94, 0.94, 0.94]} />
          </mesh>
        );
      })}
    </group>
  );
};

// 4. Pyraminx Preview (Regular Tetrahedron)
const PreviewPyraminx: React.FC = () => {
  const tetrahedronGeo = useMemo(() => {
    const geo = new THREE.TetrahedronGeometry(1.6, 0);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const faceColors = [
    CUBE_COLORS.yellow.hex,
    CUBE_COLORS.green.hex,
    CUBE_COLORS.red.hex,
    CUBE_COLORS.blue.hex,
  ];

  return (
    <group scale={1.1} position={[0, -0.2, 0]}>
      {/* 4 triangular faces */}
      {faceColors.map((color, i) => (
        <mesh key={i} geometry={tetrahedronGeo}>
          <meshStandardMaterial
            color={color}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Edge wireframe overlay to show triangular facets */}
      <mesh geometry={tetrahedronGeo}>
        <meshBasicMaterial color="#0f172a" wireframe wireframeLinewidth={3} />
      </mesh>

      {/* Mini Tips */}
      <mesh position={[0, 1.45, 0]} scale={0.4}>
        <coneGeometry args={[0.5, 0.8, 3]} />
        <meshStandardMaterial color={CUBE_COLORS.yellow.hex} roughness={0.3} />
      </mesh>
    </group>
  );
};

// 5. Skewb Preview (Deep-Cut Corner-Turning Cube)
const PreviewSkewb: React.FC = () => {
  return (
    <group scale={1.0}>
      {/* Base Cube */}
      <mesh>
        <boxGeometry args={[1.9, 1.9, 1.9]} />
        <meshStandardMaterial color="#181b22" roughness={0.7} />
      </mesh>

      {/* Front Face Diamond Center */}
      <mesh position={[0, 0, 0.96]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={CUBE_COLORS.green.hex} roughness={0.2} />
      </mesh>

      {/* Top Face Diamond Center */}
      <mesh position={[0, 0.96, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={CUBE_COLORS.white.hex} roughness={0.2} />
      </mesh>

      {/* Right Face Diamond Center */}
      <mesh position={[0.96, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={CUBE_COLORS.red.hex} roughness={0.2} />
      </mesh>

      {/* Left Face Diamond Center */}
      <mesh position={[-0.96, 0, 0]} rotation={[0, -Math.PI / 2, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={CUBE_COLORS.orange.hex} roughness={0.2} />
      </mesh>

      {/* Down Face Diamond Center */}
      <mesh position={[0, -0.96, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={CUBE_COLORS.yellow.hex} roughness={0.2} />
      </mesh>

      {/* Back Face Diamond Center */}
      <mesh position={[0, 0, -0.96]} rotation={[0, Math.PI, Math.PI / 4]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={CUBE_COLORS.blue.hex} roughness={0.2} />
      </mesh>

      {/* Subtle diagonal cut wireframe lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.92, 1.92, 1.92)]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
};

// 6. Megaminx Preview (Regular Dodecahedron, 12 Pentagonal Faces)
const PreviewMegaminx: React.FC = () => {
  const dodecaGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.35, 0);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group scale={1.05}>
      {/* 12-sided Dodecahedron body */}
      <mesh geometry={dodecaGeo}>
        <meshStandardMaterial
          color="#9333ea"
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Wireframe edges showing pentagonal cuts */}
      <lineSegments>
        <edgesGeometry args={[new THREE.DodecahedronGeometry(1.37, 0)]} />
        <lineBasicMaterial color="#facc15" linewidth={2} />
      </lineSegments>

      {/* Inner star accents */}
      <mesh position={[0, 0, 1.25]} scale={0.4}>
        <circleGeometry args={[0.6, 5]} />
        <meshStandardMaterial color={CUBE_COLORS.white.hex} roughness={0.2} />
      </mesh>
    </group>
  );
};

const RotatingScene: React.FC<{
  puzzleId: PuzzleTypeId;
  puzzleState?: Record<string, (CubeColor | null)[]>;
  autoRotate: boolean;
}> = ({
  puzzleId,
  puzzleState,
  autoRotate,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={groupRef}>
        {puzzleId === '2x2' && <Preview2x2 puzzleState={puzzleState} />}
        {puzzleId === '3x3' && <Preview3x3 />}
        {puzzleId === '4x4' && <Preview4x4 />}
        {puzzleId === 'pyraminx' && <PreviewPyraminx />}
        {puzzleId === 'skewb' && <PreviewSkewb />}
        {puzzleId === 'megaminx' && <PreviewMegaminx />}
      </group>
    </Float>
  );
};

export const PuzzlePreview3D: React.FC<PuzzlePreview3DProps> = ({
  puzzleId,
  puzzleState,
  autoRotate = true,
  className = 'w-full h-44',
}) => {
  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      <Canvas
        camera={{ position: [2.8, 2.2, 3.4], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 10, 10]} intensity={1.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.7} color="#38bdf8" />
        <pointLight position={[0, 4, 0]} intensity={0.8} />

        <RotatingScene puzzleId={puzzleId} puzzleState={puzzleState} autoRotate={autoRotate} />
      </Canvas>
    </div>
  );
};

export default PuzzlePreview3D;
