'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group, LineSegments, Mesh, Points as PointsType } from 'three';
import {
  CAMERA_FOV_END,
  CAMERA_FOV_START,
  CAMERA_TRAVEL_MS,
  CAMERA_Z,
  LANDING_SCENES,
  SECTION_HEIGHT,
  sectionWorldY,
} from '@/lib/landing/scenes';

const VOID = '#070b14';
const ICE = '#b8e6ff';
const ACCENT = '#4db8ff';

type ExperienceSceneProps = {
  sectionIndex: number;
  active: boolean;
  intro: boolean;
  compact?: boolean;
};

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (Math.pow(-2 * t + 2, 3) / 2);
}

function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function seeded(n: number, min: number, max: number) {
  return min + hash01(n) * (max - min);
}

function CameraRig({
  sectionIndex,
  intro,
  travelSpeedRef,
}: {
  sectionIndex: number;
  intro: boolean;
  travelSpeedRef: React.MutableRefObject<number>;
}) {
  const mouseX = useRef(0);
  const shake = useRef(0);
  const introT = useRef(0);
  const introDone = useRef(false);
  const prevIntro = useRef(intro);
  const yPos = useRef(0);
  const indexRef = useRef(sectionIndex);
  const travel = useRef({
    from: 0,
    to: 0,
    start: 0,
    running: false,
  });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      mouseX.current = (event.clientX / window.innerWidth) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      return;
    }

    if (prevIntro.current !== intro) {
      prevIntro.current = intro;
      if (!intro) {
        introT.current = 0;
        introDone.current = false;
        camera.fov = CAMERA_FOV_START;
        camera.updateProjectionMatrix();
      }
    }

    if (indexRef.current !== sectionIndex) {
      travel.current = {
        from: yPos.current,
        to: sectionWorldY(sectionIndex),
        start: performance.now(),
        running: true,
      };
      indexRef.current = sectionIndex;
    }

    if (intro && !introDone.current) {
      introT.current = Math.min(1, introT.current + delta / 2);
      const k = easeInOutCubic(introT.current);
      camera.fov = THREE.MathUtils.lerp(CAMERA_FOV_START, CAMERA_FOV_END, k);
      camera.updateProjectionMatrix();
      travelSpeedRef.current = Math.sin(k * Math.PI) * 18;
      if (introT.current >= 1) {
        introDone.current = true;
        travelSpeedRef.current = 0;
      }
    } else if (!intro) {
      camera.fov = CAMERA_FOV_START;
      camera.updateProjectionMatrix();
    }

    const trip = travel.current;
    if (trip.running) {
      const t = Math.min(1, (performance.now() - trip.start) / CAMERA_TRAVEL_MS);
      const k = easeInOutCubic(t);
      yPos.current = THREE.MathUtils.lerp(trip.from, trip.to, k);
      travelSpeedRef.current = Math.sin(k * Math.PI) * 14;
      if (t >= 1) {
        trip.running = false;
        yPos.current = trip.to;
        travelSpeedRef.current = 0;
      }
    }

    shake.current += 0.02;
    camera.position.y = yPos.current + Math.cos(shake.current) / 50;
    camera.position.x += (mouseX.current * 5 - camera.position.x) * 0.03;
    camera.position.z = CAMERA_Z;
  });

  return null;
}

function BackgroundField({
  travelSpeedRef,
  compact,
}: {
  travelSpeedRef: React.MutableRefObject<number>;
  compact: boolean;
}) {
  const particleCount = compact ? 360 : 720;
  const lineCount = compact ? 50 : 110;
  const yMax = 60;
  const yMin = -(LANDING_SCENES.length * SECTION_HEIGHT) - 60;

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = seeded(i * 3.1, -50, 50);
      arr[i * 3 + 1] = seeded(i * 5.7, yMin, yMax);
      arr[i * 3 + 2] = seeded(i * 9.3, -50, 100);
    }
    return arr;
  }, [particleCount, yMin, yMax]);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(lineCount * 6);
    for (let i = 0; i < lineCount; i++) {
      const x = seeded(i * 2.2, -50, 50);
      const y = seeded(i * 4.8, yMin, yMax);
      const z = seeded(i * 7.1, -40, 40);
      const len = seeded(i * 11.4, 6, 22);
      const i6 = i * 6;
      positions[i6] = x;
      positions[i6 + 1] = y;
      positions[i6 + 2] = z;
      positions[i6 + 3] = x;
      positions[i6 + 4] = y;
      positions[i6 + 5] = z + len;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [lineCount, yMin, yMax]);

  const particleGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3),
    );
    return geom;
  }, [particlePositions]);

  const pointsRef = useRef<PointsType>(null);
  const linesRef = useRef<LineSegments>(null);

  useFrame((_, delta) => {
    const zDrift = travelSpeedRef.current * delta * 0.35;
    if (pointsRef.current) {
      pointsRef.current.position.z += zDrift * 0.15;
      if (pointsRef.current.position.z > 12) {
        pointsRef.current.position.z = 0;
      }
    }
    if (linesRef.current) {
      linesRef.current.position.z += zDrift;
      if (linesRef.current.position.z > 30) {
        linesRef.current.position.z = 0;
      }
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={particleGeometry}>
        <pointsMaterial
          size={compact ? 0.28 : 0.4}
          color={ICE}
          transparent
          opacity={0.42}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#3d6a8a" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

function SectionGroup({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame(({ camera }) => {
    if (!group.current) {
      return;
    }
    const d = Math.abs(camera.position.y - sectionWorldY(index));
    group.current.visible = d < SECTION_HEIGHT * 1.15;
  });
  return (
    <group ref={group} position={[0, sectionWorldY(index), 0]}>
      {children}
    </group>
  );
}

function SmokePuffs() {
  const group = useRef<Group>(null);
  const layers = useMemo(
    () => [
      { x: 8.2, y: 2.4, z: 6, s: 7.2, c: '#3d6a8a' },
      { x: -6.4, y: 1.2, z: -4, s: 9.4, c: '#c8e8ff' },
      { x: 3.1, y: -2.6, z: 2, s: 5.8, c: '#6a9bb8' },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) {
      return;
    }
    group.current.children.forEach((child, i) => {
      child.rotation.z = t * (0.08 + i * 0.03);
      child.position.y = layers[i].y + Math.sin(t * 0.4 + i) * 0.35;
    });
  });

  return (
    <group ref={group}>
      {layers.map((layer) => (
        <mesh
          key={`${layer.x}-${layer.y}`}
          position={[layer.x, layer.y, layer.z]}
          scale={layer.s}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshLambertMaterial
            color={layer.c}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function WireSeed() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.y = state.clock.elapsedTime * 0.18;
    ref.current.rotation.x = state.clock.elapsedTime * 0.08;
  });
  return (
    <mesh ref={ref} position={[6, -1, -8]}>
      <icosahedronGeometry args={[3.2, 0]} />
      <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.7} />
    </mesh>
  );
}

function SceneWorld({
  sectionIndex,
  intro,
  compact,
}: {
  sectionIndex: number;
  intro: boolean;
  compact: boolean;
}) {
  const travelSpeedRef = useRef(0);

  return (
    <>
      <color attach="background" args={[VOID]} />
      <fogExp2 attach="fog" args={[VOID, 0.013]} />
      <ambientLight intensity={0.2} />
      <directionalLight intensity={0.55} position={[0.2, 1, 0.5]} color="#ffffff" />
      <pointLight intensity={0.7} position={[4, 6, 8]} color={ACCENT} distance={40} />
      <CameraRig
        sectionIndex={sectionIndex}
        intro={intro}
        travelSpeedRef={travelSpeedRef}
      />
      <BackgroundField travelSpeedRef={travelSpeedRef} compact={compact} />
      <SectionGroup index={0}>
        <SmokePuffs />
        <WireSeed />
      </SectionGroup>
    </>
  );
}

export function ExperienceScene({
  sectionIndex,
  active,
  intro,
  compact = false,
}: ExperienceSceneProps) {
  return (
    <Canvas
      className="!h-full !w-full"
      camera={{
        position: [0, 0, CAMERA_Z],
        fov: CAMERA_FOV_START,
        near: 1,
        far: 4000,
      }}
      dpr={compact ? [1, 1.15] : [1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{
        alpha: false,
        antialias: false,
        powerPreference: compact ? 'low-power' : 'high-performance',
      }}
    >
      <SceneWorld
        sectionIndex={sectionIndex}
        intro={intro}
        compact={compact}
      />
    </Canvas>
  );
}
