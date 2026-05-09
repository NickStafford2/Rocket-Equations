import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

import earthDay2kUrl from "../../assets/textures/earth/2k_earth_daymap.jpg";
import { EARTH_RADIUS_METERS } from "./constants";

export function EarthSurface() {
  const dayTexture = useTexture(earthDay2kUrl);

  useEffect(() => {
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.anisotropy = 8;
    dayTexture.needsUpdate = true;
  }, [dayTexture]);

  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[EARTH_RADIUS_METERS * 0.95, 256, 128]} />
      <meshBasicMaterial map={dayTexture} />
    </mesh>
  );
}
