'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  Float,
  MeshTransmissionMaterial,
  PointMaterial,
  Points,
  Sparkles,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group, Mesh, Points as PointsType } from 'three';

const PARTICLE_COUNT = 1800;

function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const px = state.pointer.x * 0.45;
    const py = state.pointer.y * 0.28;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, py, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 4.35, 0.04);
    look.current.set(px * 0.3, py * 0.2, 0);
    camera.lookAt(look.current);
  });

  return null;
}

function DriftParticles() {
  const ref = useRef<PointsType>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 2 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r - 1.5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const points = ref.current;
    if (!points) {
      return;
    }
    points.rotation.y = state.clock.elapsedTime * 0.018;
    points.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        size={0.014}
        color="#7ec8ff"
        transparent
        opacity={0.55}
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
      mid.current.rotation.y = t * 0.14;
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
        <torusGeometry args={[1.72, 0.01, 12, 160]} />
        <meshBasicMaterial color="#0a84ff" transparent opacity={0.5} />
      </mesh>
      <mesh ref={mid} rotation={[Math.PI / 2.4, 0.4, 0]}>
        <torusGeometry args={[1.95, 0.007, 12, 160]} />
        <meshBasicMaterial color="#64d2ff" transparent opacity={0.32} />
      </mesh>
      <mesh ref={inner} rotation={[0.6, 0, Math.PI / 5]}>
        <torusGeometry args={[1.38, 0.006, 12, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function GlassOrb() {
  const coreRef = useRef<Mesh>(null);
  const rigRef = useRef<Group>(null);

  useFrame((state) => {
    const core = coreRef.current;
    const rig = rigRef.current;
    if (core) {
      const pulse = 0.92 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
      core.scale.setScalar(pulse);
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
    <group ref={rigRef}>
      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.45}>
        <group>
          <mesh ref={coreRef}>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshStandardMaterial
              color="#0a84ff"
              emissive="#0071e3"
              emissiveIntensity={0.85}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.12, 72, 72]} />
            <MeshTransmissionMaterial
              backside
              samples={10}
              resolution={768}
              thickness={0.72}
              chromaticAberration={0.045}
              anisotropy={0.15}
              distortion={0.12}
              distortionScale={0.18}
              temporalDistortion={0.08}
              color="#c8e4ff"
              attenuationColor="#0071e3"
              attenuationDistance={2.2}
            />
          </mesh>
          <OrbitalRings />
          <Sparkles
            count={55}
            scale={[3.2, 3.2, 3.2]}
            size={2.2}
            speed={0.35}
            opacity={0.45}
            color="#64d2ff"
          />
        </group>
      </Float>
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

function SceneContent() {
  return (
    <>
      <CameraRig />
      <AnimatedLights />
      <DriftParticles />
      <GlassOrb />
      <Environment preset="city" />
      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function HeroScene() {
  return (
    <Canvas
      className="!touch-none"
      camera={{ position: [0, 0, 4.35], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
