import * as THREE from "three";

const CAMERA_COLLISION_CENTER = new THREE.Vector3();
const CAMERA_COLLISION_OFFSET = new THREE.Vector3();
const CAMERA_COLLISION_CLEARANCE_MULTIPLIER = 0.03;
const CAMERA_COLLISION_MIN_CLEARANCE = 0.04;
export const FALLBACK_VIEW_DIRECTION = new THREE.Vector3(
  1.25,
  0.75,
  1.15,
).normalize();

function getCameraCollisionClearance(
  object: THREE.Object3D,
  focusRadius: number,
) {
  const override = Number(object.userData.cameraCollisionClearance);
  if (Number.isFinite(override) && override >= 0) {
    return override;
  }

  return Math.max(
    focusRadius * CAMERA_COLLISION_CLEARANCE_MULTIPLIER,
    CAMERA_COLLISION_MIN_CLEARANCE,
  );
}

export function preventCameraBodyIntersection(
  scene: THREE.Scene,
  cameraPosition: THREE.Vector3,
  target: THREE.Vector3,
  preventMoonCameraIntersection: boolean,
) {
  scene.traverse((object) => {
    const focusLabel = String(object.userData.focusLabel ?? "").toLowerCase();
    if (
      focusLabel !== "earth" &&
      focusLabel !== "moon" &&
      focusLabel !== "rocket"
    ) {
      return;
    }
    if (focusLabel === "moon" && !preventMoonCameraIntersection) return;

    const focusRadius = Number(object.userData.focusRadius ?? 0);
    if (!Number.isFinite(focusRadius) || focusRadius <= 0) return;

    object.getWorldPosition(CAMERA_COLLISION_CENTER);
    CAMERA_COLLISION_OFFSET.copy(cameraPosition).sub(CAMERA_COLLISION_CENTER);

    if (CAMERA_COLLISION_OFFSET.lengthSq() <= 1e-9) {
      CAMERA_COLLISION_OFFSET.copy(FALLBACK_VIEW_DIRECTION);
    }

    const minimumDistance =
      focusRadius + getCameraCollisionClearance(object, focusRadius);

    if (CAMERA_COLLISION_OFFSET.length() >= minimumDistance) return;

    const targetOffset = target.clone().sub(CAMERA_COLLISION_CENTER);
    if (targetOffset.lengthSq() > 1e-9) {
      const targetDistance = targetOffset.length();
      const targetNormal = targetOffset.normalize();
      const cameraOffsetFromTarget = cameraPosition.clone().sub(target);
      const tangentialOffset = cameraOffsetFromTarget
        .clone()
        .sub(
          targetNormal
            .clone()
            .multiplyScalar(cameraOffsetFromTarget.dot(targetNormal)),
        );
      const minimumRadialOffset = minimumDistance - targetDistance;

      cameraPosition
        .copy(target)
        .add(tangentialOffset)
        .addScaledVector(targetNormal, minimumRadialOffset);
      return;
    }

    cameraPosition
      .copy(CAMERA_COLLISION_CENTER)
      .add(CAMERA_COLLISION_OFFSET.setLength(minimumDistance));
  });
}
