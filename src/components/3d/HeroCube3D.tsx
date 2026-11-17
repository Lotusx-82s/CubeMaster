import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createSolvedCubeState, applyMove } from '../../services/cubeState';
import { RubiksCubeScene } from './RubiksCube3D';

// Create a vibrant, colorful Rubik's cube state for the hero illustration
const heroScrambleMoves = ['R', 'U', 'R\'', 'U\'', 'F\'', 'U', 'F', 'R', 'B2', 'L', 'U2'];
const heroCubeState = heroScrambleMoves.reduce(applyMove, createSolvedCubeState());

const FloatingHeroScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle continuous rotation with subtle mouse parallax
      groupRef.current.rotation.y += delta * 0.35;
      const targetRotX = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + (state.pointer.y * 0.2);
      const targetRotZ = Math.cos(state.clock.elapsedTime * 0.4) * 0.15 - (state.pointer.x * 0.2);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.05);
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.4}
      floatIntensity={0.8}
      floatingRange={[-0.15, 0.15]}
    >
      <group ref={groupRef}>
        <RubiksCubeScene
          cubeState={heroCubeState}
          interactive={false}
          autoRotate={false}
        />
      </group>
    </Float>
  );
};

export const HeroCube3D: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] md:h-[480px] lg:h-[540px]">
      {/* Decorative neon backlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-tr from-cyan-500/25 via-blue-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      <Canvas
        camera={{ position: [4.2, 3.2, 5], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 10]} intensity={1.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#38bdf8" />
        <pointLight position={[0, 4, 2]} intensity={1.2} color="#facc15" />
        <pointLight position={[0, -4, -2]} intensity={0.8} color="#b71234" />

        <FloatingHeroScene />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
};

export default HeroCube3D;
