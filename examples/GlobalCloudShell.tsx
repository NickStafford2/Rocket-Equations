import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type GlobalCloudShellProps = {
  earthRadius: number;
  textureUrl: string;
  opacity?: number;
};

export function GlobalCloudShell({
  earthRadius,
  textureUrl,
  opacity = 0.45,
}: GlobalCloudShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudTexture = useTexture(textureUrl);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.y += delta * 0.005;
  });

  return (
    <mesh ref={meshRef} renderOrder={10}>
      <sphereGeometry args={[earthRadius * 1.015, 128, 128]} />
      <meshStandardMaterial
        map={cloudTexture}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
