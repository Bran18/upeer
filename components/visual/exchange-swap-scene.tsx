'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group, InstancedMesh, Mesh } from 'three';
import type { ExchangeSide } from '@/lib/exchange/match';

const MINT = '#2ee6c7';
const ICE = '#c9f4ff';
const PEER = '#9ad8c9';
const ORIGIN = new THREE.Vector3(0, 0, 0);
const LINK_COUNT = 22;

const ORBITS = [
  { radius: 1.28, peers: 8, speed: 0.24, tilt: [1.05, 0.18, 0.12] as const, color: MINT },
  { radius: 1.72, peers: 10, speed: -0.17, tilt: [0.42, 0.85, -0.38] as const, color: ICE },
  { radius: 2.22, peers: 12, speed: 0.11, tilt: [-0.62, 0.22, 0.78] as const, color: PEER },
  { radius: 2.78, peers: 14, speed: -0.07, tilt: [0.18, -0.55, 0.32] as const, color: '#7ec8c0' },
] as const;

type ExchangeSwapSceneProps = {
  side?: ExchangeSide;
  active?: boolean;
  compact?: boolean;
};

function MarketSphere({ inbound }: { inbound: boolean }) {
  const core = useRef<Mesh>(null);
  const shell = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = inbound ? 1 : -1;
    if (core.current) {
      const s = 1 + Math.sin(t * 2.1) * 0.04;
      core.current.scale.setScalar(s);
      const material = core.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.7 + Math.sin(t * 2.4) * 0.15;
    }
    if (shell.current) {
      shell.current.rotation.y = t * 0.18 * pulse;
      shell.current.rotation.z = t * 0.08;
    }
    if (halo.current) {
      const s = 1.05 + Math.sin(t * 1.4) * 0.03;
      halo.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.52, 64, 64]} />
        <meshStandardMaterial
          color={MINT}
          emissive={MINT}
          emissiveIntensity={0.75}
          roughness={0.18}
          metalness={0.35}
        />
      </mesh>
      <mesh ref={shell}>
        <sphereGeometry args={[0.78, 64, 64]} />
        <meshPhysicalMaterial
          color="#e7fff9"
          transparent
          opacity={0.2}
          roughness={0.1}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[1.02, 32, 32]} />
        <meshBasicMaterial
          color={MINT}
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function PeerOrbit({
  radius,
  peers,
  speed,
  tilt,
  color,
}: (typeof ORBITS)[number]) {
  const group = useRef<Group>(null);
  const people = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.z += delta * speed;
    }
    const mesh = people.current;
    if (!mesh) {
      return;
    }
    const t = state.clock.elapsedTime;
    for (let i = 0; i < peers; i++) {
      const a = (i / peers) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      dummy.scale.setScalar(0.07 + Math.sin(t * 2.2 + i) * 0.01);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} rotation={[...tilt]}>
      <mesh>
        <torusGeometry args={[radius, 0.012, 10, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <instancedMesh ref={people} args={[undefined, undefined, peers]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.3}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
}

function PeerLinks({ inbound }: { inbound: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const from = useMemo(() => new THREE.Vector3(), []);
  const to = useMemo(() => new THREE.Vector3(), []);

  const routes = useMemo(() => {
    return Array.from({ length: LINK_COUNT }, (_, i) => {
      const orbit = ORBITS[i % ORBITS.length];
      const a = (i / LINK_COUNT) * Math.PI * 2;
      const b = a + Math.PI * (0.55 + (i % 5) * 0.08);
      return {
        radius: orbit.radius,
        ax: Math.cos(a),
        ay: Math.sin(a),
        bx: Math.cos(b),
        by: Math.sin(b),
        tilt: orbit.tilt,
        phase: i * 0.37,
        speed: 0.16 + (i % 4) * 0.035,
      };
    });
  }, []);

  const euler = useMemo(() => new THREE.Euler(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const t = state.clock.elapsedTime;
    const dir = inbound ? 1 : -1;
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      euler.set(
        route.tilt[0],
        route.tilt[1],
        route.tilt[2] + t * ORBITS[i % ORBITS.length].speed,
      );
      quat.setFromEuler(euler);
      from.set(route.ax * route.radius, route.ay * route.radius, 0).applyQuaternion(quat);
      to.set(route.bx * route.radius, route.by * route.radius, 0).applyQuaternion(quat);
      let u = (t * route.speed * dir + route.phase) % 1;
      if (u < 0) {
        u += 1;
      }
      if (u < 0.5) {
        point.lerpVectors(from, ORIGIN, u * 2);
      } else {
        point.lerpVectors(ORIGIN, to, (u - 0.5) * 2);
      }
      dummy.position.copy(point);
      dummy.scale.setScalar(0.04 + Math.sin(t * 5 + i) * 0.01);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, LINK_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={ICE}
        emissive={MINT}
        emissiveIntensity={0.9}
        roughness={0.2}
        metalness={0.15}
      />
    </instancedMesh>
  );
}

function SceneWorld({
  side,
  compact,
}: {
  side: ExchangeSide;
  compact: boolean;
}) {
  const rig = useRef<Group>(null);
  const inbound = side === 'buy';

  useFrame((state) => {
    if (!rig.current) {
      return;
    }
    rig.current.rotation.y = THREE.MathUtils.lerp(
      rig.current.rotation.y,
      state.pointer.x * 0.42,
      0.045,
    );
    rig.current.rotation.x = THREE.MathUtils.lerp(
      rig.current.rotation.x,
      -state.pointer.y * 0.2,
      0.045,
    );
  });

  return (
    <group ref={rig} position={compact ? [0, 0.35, 0] : [0.85, 0.08, 0]}>
      <ambientLight intensity={0.42} />
      <directionalLight position={[2.2, 2.6, 4]} intensity={1.05} color="#ffffff" />
      <pointLight position={[0, 0.2, 1.8]} intensity={1.45} color={MINT} distance={10} />
      <pointLight position={[-2, -1, 1]} intensity={0.4} color={ICE} distance={8} />
      <MarketSphere inbound={inbound} />
      {ORBITS.map((orbit) => (
        <PeerOrbit key={orbit.radius} {...orbit} />
      ))}
      <PeerLinks inbound={inbound} />
    </group>
  );
}

export function ExchangeSwapScene({
  side = 'buy',
  active = true,
  compact = false,
}: ExchangeSwapSceneProps) {
  return (
    <Canvas
      className="!h-full !w-full"
      camera={{
        position: [0, 0.2, compact ? 6.4 : 6.05],
        fov: compact ? 38 : 36,
        near: 0.1,
        far: 60,
      }}
      dpr={compact ? [1, 1.2] : [1, 1.7]}
      frameloop={active ? 'always' : 'never'}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: compact ? 'low-power' : 'high-performance',
      }}
    >
      <SceneWorld side={side} compact={compact} />
    </Canvas>
  );
}
