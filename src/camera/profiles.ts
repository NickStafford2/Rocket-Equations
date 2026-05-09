import * as THREE from "three";

export type CameraProfile = {
  focusRadius: number;
  collisionClearance: number;
  followMinDistance: number;
  followDefaultDistance: number;
  followMaxDistance: number;
};

const DEFAULT_FOCUS_RADIUS = 12;
const DEFAULT_FOLLOW_MIN_DISTANCE = 0.05;
const DEFAULT_FOLLOW_DEFAULT_DISTANCE = 0.2;
const DEFAULT_FOLLOW_MAX_DISTANCE = 700;
const DEFAULT_COLLISION_CLEARANCE = 0.04;

export function readCameraProfile(object: THREE.Object3D): CameraProfile {
  const focusRadius = readPositiveNumber(
    object.userData.focusRadius,
    DEFAULT_FOCUS_RADIUS,
  );

  return {
    focusRadius,
    collisionClearance: readNonNegativeNumber(
      object.userData.cameraCollisionClearance,
      DEFAULT_COLLISION_CLEARANCE,
    ),
    followMinDistance: readPositiveNumber(
      object.userData.followMinDistance,
      DEFAULT_FOLLOW_MIN_DISTANCE,
    ),
    followDefaultDistance: readPositiveNumber(
      object.userData.followDefaultDistance,
      DEFAULT_FOLLOW_DEFAULT_DISTANCE,
    ),
    followMaxDistance: readPositiveNumber(
      object.userData.followMaxDistance,
      DEFAULT_FOLLOW_MAX_DISTANCE,
    ),
  };
}

function readPositiveNumber(value: unknown, fallback: number): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : fallback;
}

function readNonNegativeNumber(value: unknown, fallback: number): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : fallback;
}
