'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { PointMaterial, Points } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import type { Mesh, Points as PointsType } from 'three';

const PARTICLE_COUNT = 2400;

function ParticleField() {
  const ref = useRef<PointsType>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2.5 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = radius * Math.cos(phi) - 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const points = ref.current;
    if (!points) {
      return;
    }
    points.rotation.y = state.clock.elapsedTime * 0.035;
    points.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.04;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#5eead4"
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.75}
      />
    </Points>
  );
}

function WireKnot() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) {
      return;
    }
    mesh.rotation.x = state.clock.elapsedTime * 0.12;
    mesh.rotation.z = state.clock.elapsedTime * 0.07;
  });

  return (
    <mesh ref={ref} position={[1.8, 0.2, -1]}>
      <torusKnotGeometry args={[0.9, 0.14, 160, 24]} />
      <meshBasicMaterial color="#c4b5fd" wireframe transparent opacity={0.28} />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas
      className="!touch-none"
      camera={{ position: [0, 0, 6], fov: 48 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.15} />
      <pointLight position={[4, 2, 4]} intensity={0.6} color="#34d399" />
      <pointLight position={[-3, -1, 2]} intensity={0.35} color="#8b5cf6" />
      <ParticleField />
      <WireKnot />
    </Canvas>
  );
}
