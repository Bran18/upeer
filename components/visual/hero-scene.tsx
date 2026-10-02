'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  MeshTransmissionMaterial,
  PointMaterial,
  Points,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group, Mesh, Points as PointsType } from 'three';

const EMANATION_COUNT = 1400;
const ORB_SCALE = 0.82;
const SHELL_RADIUS = 0.88;
const CORE_RADIUS = 0.3;
const EMANATION_RADIUS = 7.2;

/** Mid ring dominant spin — sphere uses the inverse. */
const RING_SPIN_Y = 0.14;

function randomUnitVector(target: THREE.Vector3) {
  const theta = Math.random() * Math.PI * 2;
  const z = Math.random() * 2 - 1;
  const r = Math.sqrt(1 - z * z);
  target.set(r * Math.cos(theta), r * Math.sin(theta), z);
  return target;
}

type EmanationSim = {
  positions: Float32Array;
  directions: Float32Array;
  speeds: Float32Array;
};

function createEmanationSim(): EmanationSim {
  const positions = new Float32Array(EMANATION_COUNT * 3);
  const directions = new Float32Array(EMANATION_COUNT * 3);
  const speeds = new Float32Array(EMANATION_COUNT);
  const scratch = new THREE.Vector3();

  for (let i = 0; i < EMANATION_COUNT; i++) {
    randomUnitVector(scratch);
    const i3 = i * 3;
    directions[i3] = scratch.x;
    directions[i3 + 1] = scratch.y;
    directions[i3 + 2] = scratch.z;
    speeds[i] = 0.35 + Math.random() * 0.85;
    const spread = Math.random() * EMANATION_RADIUS;
    positions[i3] = scratch.x * spread;
    positions[i3 + 1] = scratch.y * spread;
    positions[i3 + 2] = scratch.z * spread;
  }

  return { positions, directions, speeds };
}

function respawnParticle(
  i: number,
  sim: EmanationSim,
  scratch: THREE.Vector3,
) {
  randomUnitVector(scratch);
  const i3 = i * 3;
  sim.directions[i3] = scratch.x;
  sim.directions[i3 + 1] = scratch.y;
  sim.directions[i3 + 2] = scratch.z;
  sim.speeds[i] = 0.4 + Math.random() * 0.9;
  const origin = 0.08 + Math.random() * 0.12;
  sim.positions[i3] = scratch.x * origin;
  sim.positions[i3 + 1] = scratch.y * origin;
  sim.positions[i3 + 2] = scratch.z * origin;
}

function CameraRig({ compact }: { compact?: boolean }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const targetZ = compact ? 4.85 : 4.35;

  useFrame((state) => {
    const px = state.pointer.x * (compact ? 0.28 : 0.45);
    const py = state.pointer.y * 0.28;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px, 0.04);
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      compact ? py * 0.15 - 0.15 : py,
      0.04,
    );
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.04);
    look.current.set(px * 0.3, py * 0.2, 0);
    camera.lookAt(look.current);
  });

  return null;
}

function EmanationParticles() {
  const pointsRef = useRef<PointsType>(null);
  const sim = useMemo(() => createEmanationSim(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) {
      return;
    }

    const positionAttr = points.geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute;
    const dt = Math.min(delta, 0.05);
    const thrust = 0.38;

    for (let i = 0; i < EMANATION_COUNT; i++) {
      const i3 = i * 3;
      const dx = sim.directions[i3];
      const dy = sim.directions[i3 + 1];
      const dz = sim.directions[i3 + 2];

      sim.positions[i3] += dx * sim.speeds[i] * thrust * dt;
      sim.positions[i3 + 1] += dy * sim.speeds[i] * thrust * dt;
      sim.positions[i3 + 2] += dz * sim.speeds[i] * thrust * dt;

      const x = sim.positions[i3];
      const y = sim.positions[i3 + 1];
      const z = sim.positions[i3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);

      if (dist > EMANATION_RADIUS) {
        respawnParticle(i, sim, scratch);
      }

      positionAttr.setXYZ(
        i,
        sim.positions[i3],
        sim.positions[i3 + 1],
        sim.positions[i3 + 2],
      );
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={sim.positions} stride={3} frustumCulled={false}>
      <PointMaterial
        size={0.013}
        color="#d4f4ff"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function OrbitalRings() {
  const outer = useRef<Mesh>(null);
  const mid = useRef<Mesh>(null);
  const inner = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outer.current) {
      outer.current.rotation.x = t * 0.11;
      outer.current.rotation.z = t * 0.07;
    }
    if (mid.current) {
      mid.current.rotation.y = t * RING_SPIN_Y;
      mid.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.2) * 0.08;
    }
    if (inner.current) {
      inner.current.rotation.z = -t * 0.2;
      inner.current.rotation.y = t * 0.09;
    }
  });

  return (
    <group>
      <mesh ref={outer}>
        <torusGeometry args={[1.35, 0.008, 12, 160]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.42} />
      </mesh>
      <mesh ref={mid} rotation={[Math.PI / 2.4, 0.4, 0]}>
        <torusGeometry args={[1.52, 0.006, 12, 160]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.28} />
      </mesh>
      <mesh ref={inner} rotation={[0.6, 0, Math.PI / 5]}>
        <torusGeometry args={[1.08, 0.005, 12, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function GlassOrb({ compact }: { compact?: boolean }) {
  const sphereRef = useRef<Group>(null);
  const rigRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const rig = rigRef.current;
    const sphere = sphereRef.current;

    if (sphere) {
      sphere.rotation.y = -t * RING_SPIN_Y;
      sphere.rotation.x = -t * 0.11;
      sphere.rotation.z = -t * 0.07;
    }
    if (rig) {
      rig.rotation.y = THREE.MathUtils.lerp(
        rig.rotation.y,
        state.pointer.x * 0.4,
        0.06,
      );
      rig.rotation.x = THREE.MathUtils.lerp(
        rig.rotation.x,
        -state.pointer.y * 0.22,
        0.06,
      );
    }
  });

  return (
    <group ref={rigRef} position={compact ? [0, -0.2, 0] : [1.35, 0.08, 0]}>
      <group scale={ORB_SCALE}>
        <EmanationParticles />
        <group ref={sphereRef}>
          <mesh>
            <sphereGeometry args={[CORE_RADIUS, 48, 48]} />
            <meshPhysicalMaterial
              color="#b8e6ff"
              emissive="#38bdf8"
              emissiveIntensity={0.48}
              roughness={0.08}
              metalness={0.05}
              clearcoat={1}
              clearcoatRoughness={0.06}
              transparent
              opacity={0.88}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[SHELL_RADIUS, 96, 96]} />
            <MeshTransmissionMaterial
              backside
              backsideThickness={0.25}
              samples={12}
              resolution={896}
              thickness={0.28}
              roughness={0.02}
              ior={1.62}
              chromaticAberration={0.09}
              anisotropy={0.42}
              distortion={0.1}
              distortionScale={0.38}
              temporalDistortion={0.06}
              clearcoat={1}
              clearcoatRoughness={0.02}
              color="#eef8ff"
              attenuationColor="#3b9eff"
              attenuationDistance={1.15}
            />
          </mesh>
        </group>
        <OrbitalRings />
      </group>
    </group>
  );
}

function AnimatedLights() {
  const key = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (key.current) {
      key.current.position.x = Math.sin(t * 0.5) * 2.5 + 2;
      key.current.position.y = Math.cos(t * 0.35) * 1.2 + 1;
    }
    if (fill.current) {
      fill.current.position.x = Math.cos(t * 0.4) * 2 - 2;
      fill.current.position.z = Math.sin(t * 0.3) * 1.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.28} />
      <pointLight ref={key} intensity={1.4} color="#ffffff" distance={12} />
      <pointLight ref={fill} intensity={0.65} color="#0a84ff" distance={10} />
      <pointLight intensity={0.4} color="#7dd3fc" distance={5} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.35}
        penumbra={1}
        intensity={0.9}
        color="#ffffff"
      />
    </>
  );
}

function SceneContent({ compact }: { compact?: boolean }) {
  return (
    <>
      <CameraRig compact={compact} />
      <AnimatedLights />
      <GlassOrb compact={compact} />
      <Environment preset="warehouse" />
      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={0.44}
          luminanceThreshold={0.26}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

type HeroSceneProps = {
  compact?: boolean;
};

export function HeroScene({ compact = false }: HeroSceneProps) {
  return (
    <Canvas
      className="!touch-none"
      camera={{
        position: [0, compact ? -0.15 : 0, compact ? 4.85 : 4.35],
        fov: compact ? 42 : 40,
      }}
      dpr={compact ? [1, 1.35] : [1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
    >
      <SceneContent compact={compact} />
    </Canvas>
  );
}
