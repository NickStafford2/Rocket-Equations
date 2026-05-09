import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
import earthClouds2kUrl from "../../assets/textures/earth/2k_earth_clouds.jpg";
import { EARTH_RADIUS_METERS } from "./constants";

const CLOUD_ALTITUDE_METERS = 12_000;

export function EarthCloudLayer() {
  const cloudTexture = useTexture(earthClouds2kUrl);

  useEffect(() => {
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 8;
    cloudTexture.needsUpdate = true;
  }, [cloudTexture]);

  return (
    <mesh>
      <sphereGeometry
        args={[EARTH_RADIUS_METERS + CLOUD_ALTITUDE_METERS, 256, 128]}
      />
      <meshBasicMaterial
        map={cloudTexture}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </mesh>
  );
}
