import * as THREE from "three";
import type { CameraTarget } from "../mission";

const DEFAULT_MIN_CAMERA_NEAR = 0.01;
const CLOSE_ROCKET_MIN_CAMERA_NEAR = 0.00012;
const MAX_CAMERA_NEAR = 4;
const DEFAULT_CAMERA_NEAR_DISTANCE_FACTOR = 0.0015;
const CLOSE_ROCKET_CAMERA_NEAR_DISTANCE_FACTOR = 0.08;
const DEFAULT_CAMERA_FAR = 10000;
const CLOSE_ROCKET_CAMERA_FAR = 5000;

type CameraClipPlaneOptions = {
  followTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
  distanceToTarget: number;
};

export type CameraClipPlanes = {
  near: number;
  far: number;
};

export function getCameraClipPlanes({
  followTarget,
  lookTarget,
  distanceToTarget,
}: CameraClipPlaneOptions): CameraClipPlanes {
  const closeRocketView = followTarget === "rocket" || lookTarget === "rocket";
  const nearDistanceFactor = closeRocketView
    ? CLOSE_ROCKET_CAMERA_NEAR_DISTANCE_FACTOR
    : DEFAULT_CAMERA_NEAR_DISTANCE_FACTOR;
  const minNear = closeRocketView
    ? CLOSE_ROCKET_MIN_CAMERA_NEAR
    : DEFAULT_MIN_CAMERA_NEAR;

  return {
    near: THREE.MathUtils.clamp(
      distanceToTarget * nearDistanceFactor,
      minNear,
      MAX_CAMERA_NEAR,
    ),
    far: closeRocketView ? CLOSE_ROCKET_CAMERA_FAR : DEFAULT_CAMERA_FAR,
  };
}
