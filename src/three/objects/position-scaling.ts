import * as THREE from "three";
import { R_EARTH, R_MOON } from "../../physics/bodies";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  ORBIT_METERS_TO_SCENE_UNITS,
} from "./constants";

const EARTH_CENTER_METERS = new THREE.Vector3();
const BODY_RELATIVE_POSITION = new THREE.Vector3();
const SCENE_POSITION = new THREE.Vector3();

export function copyScenePositionFromMeters(
  target: THREE.Vector3,
  positionMeters: THREE.Vector3,
  moonPositionMeters?: THREE.Vector3,
): THREE.Vector3 {
  if (!moonPositionMeters) {
    return copyBodySurfaceScaledPosition(
      target,
      positionMeters,
      EARTH_CENTER_METERS,
      R_EARTH,
      EARTH_RENDER_RADIUS_SCENE_UNITS,
    );
  }

  const altitudeEarth = positionMeters.length() - R_EARTH;
  const altitudeMoon = positionMeters.distanceTo(moonPositionMeters) - R_MOON;

  if (altitudeMoon < altitudeEarth) {
    return copyBodySurfaceScaledPosition(
      target,
      positionMeters,
      moonPositionMeters,
      R_MOON,
      MOON_RENDER_RADIUS_SCENE_UNITS,
    );
  }

  return copyBodySurfaceScaledPosition(
    target,
    positionMeters,
    EARTH_CENTER_METERS,
    R_EARTH,
    EARTH_RENDER_RADIUS_SCENE_UNITS,
  );
}

export function writeScenePositionToArray(
  target: Float32Array,
  offset: number,
  positionMeters: THREE.Vector3,
  moonPositionMeters?: THREE.Vector3,
): void {
  copyScenePositionFromMeters(
    SCENE_POSITION,
    positionMeters,
    moonPositionMeters,
  );
  target[offset] = SCENE_POSITION.x;
  target[offset + 1] = SCENE_POSITION.y;
  target[offset + 2] = SCENE_POSITION.z;
}

function copyBodySurfaceScaledPosition(
  target: THREE.Vector3,
  worldPositionMeters: THREE.Vector3,
  bodyCenterMeters: THREE.Vector3,
  bodyRadiusMeters: number,
  bodyRenderRadiusSceneUnits: number,
): THREE.Vector3 {
  BODY_RELATIVE_POSITION.copy(worldPositionMeters).sub(bodyCenterMeters);
  const bodyDistanceMeters = Math.max(BODY_RELATIVE_POSITION.length(), 1e-6);
  const altitudeMeters = Math.max(bodyDistanceMeters - bodyRadiusMeters, 0);
  const sceneDistance =
    bodyRenderRadiusSceneUnits + altitudeMeters * ORBIT_METERS_TO_SCENE_UNITS;

  target.copy(bodyCenterMeters).multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  target.addScaledVector(BODY_RELATIVE_POSITION, sceneDistance / bodyDistanceMeters);
  return target;
}
