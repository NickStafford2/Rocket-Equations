import * as THREE from "three";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../../constants";
import { CLOUD_HEIGHT_OFFSET_METERS } from "./constants";

export function offsetCloudHeight([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] {
  return [x, y + CLOUD_HEIGHT_OFFSET_METERS, z];
}

export function toSceneVector(
  [xMeters, yMeters, zMeters]: [number, number, number],
  visualScaleMultiplier: number,
): THREE.Vector3 {
  const scale = ORBIT_METERS_TO_SCENE_UNITS * visualScaleMultiplier;

  return new THREE.Vector3(xMeters * scale, yMeters * scale, zMeters * scale);
}

export function toSceneScale(
  widthMeters: number,
  heightMeters: number,
  visualScaleMultiplier: number,
): THREE.Vector2 {
  return new THREE.Vector2(
    toSceneUnits(widthMeters, visualScaleMultiplier),
    toSceneUnits(heightMeters, visualScaleMultiplier),
  );
}

export function toSceneUnits(
  meters: number,
  visualScaleMultiplier: number,
): number {
  return meters * ORBIT_METERS_TO_SCENE_UNITS * visualScaleMultiplier;
}
