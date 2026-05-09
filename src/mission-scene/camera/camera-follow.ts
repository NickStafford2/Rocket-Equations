import * as THREE from "three";
import type { CameraRigControls, CameraRigState } from "./camera-types";
import { FALLBACK_VIEW_DIRECTION } from "./camera-collisions";

const FOLLOW_WORLD_POSITION = new THREE.Vector3();
const CURRENT_TARGET = new THREE.Vector3();

const FOLLOW_MIN_DISTANCE_MULTIPLIER = 0.3;
const FOLLOW_MAX_DISTANCE_MULTIPLIER = 8;
const FOLLOW_DEFAULT_DISTANCE_MULTIPLIER = 1.05;

export function updateFollowOffset(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
  followPosition: THREE.Vector3 | null,
) {
  if (!followPosition || rig.positionTransitioning) return;

  rig.offset.copy(camera.position).sub(followPosition);
}

export function updateFollowOffsetFromControlsChange(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
) {
  if (!rig.follow || rig.positionTransitioning) return;

  rig.follow.object.getWorldPosition(FOLLOW_WORLD_POSITION);
  rig.offset.copy(camera.position).sub(FOLLOW_WORLD_POSITION);
}

export function getInitialFollowOffset(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: CameraRigControls,
): THREE.Vector3 {
  object.getWorldPosition(FOLLOW_WORLD_POSITION);

  const currentOffset = camera.position.clone().sub(FOLLOW_WORLD_POSITION);
  const focusRadius = Number(object.userData.focusRadius ?? 12);

  const minDistance = getFollowDistanceSetting(
    object,
    "followMinDistance",
    THREE.MathUtils.clamp(
      focusRadius * FOLLOW_MIN_DISTANCE_MULTIPLIER,
      0.05,
      520,
    ),
  );

  const maxDistance = getFollowDistanceSetting(
    object,
    "followMaxDistance",
    THREE.MathUtils.clamp(
      focusRadius * FOLLOW_MAX_DISTANCE_MULTIPLIER,
      0.8,
      700,
    ),
  );

  const defaultDistance = getFollowDistanceSetting(
    object,
    "followDefaultDistance",
    THREE.MathUtils.clamp(
      focusRadius * FOLLOW_DEFAULT_DISTANCE_MULTIPLIER,
      0.2,
      520,
    ),
  );

  if (currentOffset.lengthSq() > 1e-6) {
    const clampedDistance = THREE.MathUtils.clamp(
      currentOffset.length(),
      minDistance,
      maxDistance,
    );

    return currentOffset.setLength(clampedDistance);
  }

  controls.getTarget(CURRENT_TARGET, false);

  const viewDirection = camera.position.clone().sub(CURRENT_TARGET);
  if (viewDirection.lengthSq() > 1e-6) {
    return viewDirection.normalize().multiplyScalar(defaultDistance);
  }

  return FALLBACK_VIEW_DIRECTION.clone().multiplyScalar(defaultDistance);
}

function getFollowDistanceSetting(
  object: THREE.Object3D,
  key: "followMinDistance" | "followMaxDistance" | "followDefaultDistance",
  fallback: number,
): number {
  const value = Number(object.userData[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
