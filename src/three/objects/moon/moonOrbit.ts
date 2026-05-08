import * as THREE from "three";
import { EARTH_MOON_DISTANCE } from "../../../physics/bodies";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../constants";

const MOON_ORBIT_SEGMENTS = 512;

export function createMoonOrbit(): THREE.Line {
  const moonOrbitPoints: THREE.Vector3[] = [];

  for (let i = 0; i <= MOON_ORBIT_SEGMENTS; i += 1) {
    const theta = (i / MOON_ORBIT_SEGMENTS) * Math.PI * 2;

    moonOrbitPoints.push(
      new THREE.Vector3(
        EARTH_MOON_DISTANCE * Math.cos(theta) * ORBIT_METERS_TO_SCENE_UNITS,
        0,
        EARTH_MOON_DISTANCE * Math.sin(theta) * ORBIT_METERS_TO_SCENE_UNITS,
      ),
    );
  }

  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b5f82,
      transparent: true,
      opacity: 0.7,
    }),
  );
}
