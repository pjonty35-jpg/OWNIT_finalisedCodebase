"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { DesignSide } from "@/lib/design";

export interface GarmentSceneProps {
  silhouette: string; // category key: t-shirts | hoodies | jackets | caps | bags | jerseys
  color: string; // garment hex
  designTexture?: HTMLCanvasElement | null; // rendered design canvas (per active side)
  activeSide?: DesignSide;
  autoRotate?: boolean;
  className?: string;
  interactive?: boolean;
}

function GarmentGroup({
  silhouette,
  color,
  designTexture,
  activeSide,
}: {
  silhouette: string;
  color: string;
  designTexture?: HTMLCanvasElement | null;
  activeSide: DesignSide;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  // Smooth material colour transitions.
  useFrame((_, delta) => {
    if (matRef.current) matRef.current.color.lerp(targetColor, Math.min(1, delta * 5));
  });

  // Gentle yaw when idle-facing side changes (front/back flip).
  const targetYaw = activeSide === "back" ? Math.PI : activeSide === "left" ? Math.PI / 2 : activeSide === "right" ? -Math.PI / 2 : 0;
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = targetYaw;
    }
  }, [targetYaw]);

  const texture = useMemo(() => {
    if (!designTexture) return null;
    const t = new THREE.CanvasTexture(designTexture);
    t.anisotropy = 4;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [designTexture]);

  useEffect(() => () => texture?.dispose(), [texture]);

  const isTorso = ["t-shirts", "hoodies", "jackets", "jerseys"].includes(silhouette);
  const isCap = silhouette === "caps";
  const isBag = silhouette === "bags";

  const body = (
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[0.42, 0.5, isTorso ? 1.08 : 0.7, 48, 1, false]} />
      <meshStandardMaterial ref={matRef} roughness={0.85} metalness={0.02} />
    </mesh>
  );

  return (
    <group ref={groupRef}>
      {isTorso ? (
        <group>
          {body}
          {/* shoulder dome */}
          <mesh position={[0, 0.54, 0]}>
            <sphereGeometry args={[0.42, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial ref={matRef} roughness={0.85} metalness={0.02} />
          </mesh>
          {/* collar */}
          <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.035, 12, 36]} />
            <meshStandardMaterial color="#0e0e0d" roughness={0.9} />
          </mesh>
          {(silhouette === "hoodies" || silhouette === "jackets") ? (
            <mesh position={[0, 0.72, -0.04]} rotation={[0.4, 0, 0]}>
              <torusGeometry args={[0.24, 0.09, 14, 40]} />
              <meshStandardMaterial ref={matRef} roughness={0.88} />
            </mesh>
          ) : null}
          {/* sleeves */}
          {[-1, 1].map((dir) => (
            <mesh key={dir} position={[dir * 0.53, 0.34, 0]} rotation={[0, 0, dir * 0.9]}>
              <cylinderGeometry args={[0.125, 0.155, 0.44, 24]} />
              <meshStandardMaterial ref={matRef} roughness={0.85} metalness={0.02} />
            </mesh>
          ))}
          {/* hem shadow band */}
          <mesh position={[0, -0.55, 0]}>
            <torusGeometry args={[0.5, 0.02, 10, 48]} />
            <meshStandardMaterial color="#000000" roughness={0.95} transparent opacity={0.35} />
          </mesh>
        </group>
      ) : isCap ? (
        <group>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.4, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2.05]} />
            <meshStandardMaterial ref={matRef} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.01, 0.34]} rotation={[Math.PI / 2.4, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.025, 48, 1, false, -Math.PI / 2.2, Math.PI / 1.1]} />
            <meshStandardMaterial ref={matRef} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.02, 10, 48]} />
            <meshStandardMaterial color="#0e0e0d" roughness={0.9} />
          </mesh>
        </group>
      ) : isBag ? (
        <group>
          <mesh>
            <boxGeometry args={[0.66, 0.74, 0.16]} />
            <meshStandardMaterial ref={matRef} roughness={0.92} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <torusGeometry args={[0.22, 0.022, 10, 40, Math.PI]} />
            <meshStandardMaterial color="#7d7668" roughness={0.75} />
          </mesh>
        </group>
      ) : (
        body
      )}

      {/* design decal — floats just off the surface on the active face */}
      {texture ? (
        <mesh
          position={[
            0,
            silhouette === "caps" ? 0.16 : silhouette === "bags" ? 0.02 : 0.16,
            silhouette === "bags" ? 0.085 : silhouette === "caps" ? 0.3 : 0.425,
          ]}
        >
          <planeGeometry args={[silhouette === "caps" ? 0.36 : 0.52, silhouette === "caps" ? 0.36 : 0.62]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

export default function GarmentScene({
  silhouette,
  color,
  designTexture,
  activeSide = "front",
  autoRotate = true,
  className,
  interactive = true,
}: GarmentSceneProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.1, 2.5], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[2.5, 3, 2.4]} intensity={1.2} color="#fff6e8" />
        <directionalLight position={[-3, 1.2, -2]} intensity={0.35} color="#c9d2e8" />
        <pointLight position={[0, -1.5, 1.4]} intensity={0.18} color="#f5f2ea" />
        <Suspense fallback={null}>
          <Float speed={1.05} rotationIntensity={0} floatIntensity={0.4}>
            <GarmentGroup silhouette={silhouette} color={color} designTexture={designTexture} activeSide={activeSide} />
          </Float>
          <ContactShadows position={[0, -1.02, 0]} opacity={0.6} scale={4.4} blur={2.8} far={2.4} color="#000000" />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={interactive}
          autoRotate={autoRotate}
          autoRotateSpeed={0.65}
          minDistance={1.7}
          maxDistance={4.2}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>
    </div>
  );
}
