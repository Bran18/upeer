'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group, InstancedMesh, Mesh } from 'three';

const BEAD_COUNT = 48;
const _position = new THREE.Vector3();

function Knot({
  args,
  color,
  speed,
  scale,
}: {
  args: [number, number, number, number, number, number];
  color: string;
  speed: number;
  scale: number;
}) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) {
      return;
    }
    const t = state.clock.elapsedTime * speed;
    mesh.rotation.x = t * 0.35;
    mesh.rotation.y = t * 0.22;
    mesh.rotation.z = Math.sin(t * 0.4) * 0.15;
  });

  return (
    <mesh ref={ref} scale={scale}>
      <torusKnotGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        roughness={0.25}
        metalness={0.55}
        transparent
        opacity={0.55}
        wireframe
      />
    </mesh>
  );
}

function HelixBeads() {
  const meshRef = useRef<InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const t = state.clock.elapsedTime;
    for (let i = 0; i < BEAD_COUNT; i++) {
      const u = i / BEAD_COUNT;
      const a = u * Math.PI * 6 + t * 0.55;
      _position.set(
        Math.cos(a) * 2.15,
        (u - 0.5) * 4.2,
        Math.sin(a * 0.92) * 2.15,
      );
      dummy.position.copy(_position);
      dummy.scale.setScalar(0.045 + Math.sin(t * 2 + i) * 0.012);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.rotation.y = t * 0.08;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BEAD_COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color="#64d2ff"
        emissive="#0a84ff"
        emissiveIntensity={1.1}
        roughness={0.2}
        metalness={0.4}
      />
    </instancedMesh>
  );
}

function Core() {
  const group = useRef<Group>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) {
      return;
    }
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 0.18;
    g.rotation.x = Math.sin(t * 0.25) * 0.12;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#0071e3"
          emissive="#0a84ff"
          emissiveIntensity={1.2}
          roughness={0.15}
          metalness={0.7}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.82, 0]} />
        <meshBasicMaterial color="#64d2ff" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function FlowContent() {
  return (
    <>
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 6, 14]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[3, 2, 4]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-4, -1, 2]} intensity={0.9} color="#0a84ff" />
      <Knot
        args={[1.35, 0.28, 180, 16, 2, 3]}
        color="#0a84ff"
        speed={0.35}
        scale={1.15}
      />
      <Knot
        args={[1.1, 0.12, 140, 12, 3, 5]}
        color="#64d2ff"
        speed={-0.22}
        scale={1.55}
      />
      <HelixBeads />
      <Core />
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

type FlowSceneProps = {
  active?: boolean;
};

export function FlowScene({ active = true }: FlowSceneProps) {
  return (
    <Canvas
      className="!touch-none"
      camera={{ position: [0, 0, 6.4], fov: 42 }}
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
    >
      <FlowContent />
    </Canvas>
  );
}
