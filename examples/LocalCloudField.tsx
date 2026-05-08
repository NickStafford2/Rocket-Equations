import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CloudCoverageSampler } from "./CloudCoverageSampler";

type LocalCloudFieldProps = {
  rocketRef: React.RefObject<THREE.Object3D | null>;
  earthRadius: number;
  cloudBottomAltitude: number;
  cloudTopAltitude: number;
  sampler: CloudCoverageSampler;
  cloudSpriteUrl: string;
  count?: number;
  fieldRadius?: number;
};

type CloudParticle = {
  offset: THREE.Vector3;
  scale: number;
  opacitySeed: number;
};

export function LocalCloudField({
  rocketRef,
  earthRadius,
  cloudBottomAltitude,
  cloudTopAltitude,
  sampler,
  cloudSpriteUrl,
  count = 350,
  fieldRadius = 35,
}: LocalCloudFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const cloudTexture = useLoader(THREE.TextureLoader, cloudSpriteUrl);

  const particles = useMemo<CloudParticle[]>(() => {
    return Array.from({ length: count }, () => {
      const offset = new THREE.Vector3(
        randomRange(-fieldRadius, fieldRadius),
        randomRange(-fieldRadius * 0.45, fieldRadius * 0.45),
        randomRange(-fieldRadius, fieldRadius),
      );

      return {
        offset,
        scale: randomRange(8, 24),
        opacitySeed: randomRange(0.5, 1),
      };
    });
  }, [count, fieldRadius]);

  useFrame(({ camera }) => {
    const rocket = rocketRef.current;
    const group = groupRef.current;
    const material = materialRef.current;

    if (!rocket || !group || !material) return;

    const rocketPosition = rocket.getWorldPosition(new THREE.Vector3());
    const altitude = rocketPosition.length() - earthRadius;

    const altitudeFade = getCloudAltitudeFade(
      altitude,
      cloudBottomAltitude,
      cloudTopAltitude,
    );

    const coverage = sampler.sampleAtWorldPosition(rocketPosition);

    const finalOpacity = altitudeFade * smoothstep(0.2, 0.75, coverage);

    group.visible = finalOpacity > 0.01;
    group.position.copy(rocketPosition);

    material.opacity = finalOpacity * 0.42;

    for (const child of group.children) {
      child.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.offset}>
          <planeGeometry args={[particle.scale, particle.scale]} />
          <meshBasicMaterial
            ref={index === 0 ? materialRef : undefined}
            map={cloudTexture}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function getCloudAltitudeFade(
  altitude: number,
  cloudBottomAltitude: number,
  cloudTopAltitude: number,
) {
  const fadeIn = smoothstep(
    cloudBottomAltitude,
    cloudBottomAltitude + (cloudTopAltitude - cloudBottomAltitude) * 0.35,
    altitude,
  );

  const fadeOut =
    1 -
    smoothstep(
      cloudTopAltitude - (cloudTopAltitude - cloudBottomAltitude) * 0.35,
      cloudTopAltitude,
      altitude,
    );

  return fadeIn * fadeOut;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}
