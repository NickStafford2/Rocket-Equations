import { useRef } from "react";
import * as THREE from "three";
import { EarthCloudSystem } from "./clouds/EarthCloudSystem";

export function SpaceScene() {
  const rocketRef = useRef<THREE.Group>(null);

  const earthRadius = 100;

  return (
    <>
      <group ref={rocketRef}>
        <Rocket />
      </group>

      <Earth radius={earthRadius} />

      <EarthCloudSystem
        rocketRef={rocketRef}
        earthRadius={earthRadius}
      />
    </>
  );
}
