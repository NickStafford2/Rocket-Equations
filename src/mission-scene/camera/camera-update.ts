import * as THREE from "three";
import { preventCameraBodyIntersection } from "./camera-collisions";
import { updateFollowOffset } from "./camera-follow";
import { syncCameraRigMode } from "./camera-mode";
import { getModeSummary } from "./camera-status";
import { updateCameraRigTransitions } from "./camera-transitions";
import type {
  CameraRigControls,
  CameraRigDebugSnapshot,
  CameraRigState,
  CameraRigTargetPositions,
  CameraRigUpdateOptions,
} from "./camera-types";

const FOLLOW_WORLD_POSITION = new THREE.Vector3();
const LOOK_WORLD_POSITION = new THREE.Vector3();
const CURRENT_TARGET = new THREE.Vector3();
const NEXT_TARGET = new THREE.Vector3();

export function updateCameraRig(
  rig: CameraRigState,
  {
    camera,
    controls,
    scene,
    deltaSeconds,
    preventMoonCameraIntersection = true,
  }: CameraRigUpdateOptions,
): string[] {
  syncCameraRigMode(rig);
  scene.updateMatrixWorld(true);

  controls.update(deltaSeconds);
  controls.getTarget(CURRENT_TARGET, false);

  const targets = getCameraRigTargetPositions(rig);

  updateDesiredCameraState(rig, camera, targets);

  if (rig.mode !== "free") {
    applyCameraRigState(rig, {
      camera,
      controls,
      scene,
      preventMoonCameraIntersection,
    });
  }

  controls.getTarget(CURRENT_TARGET, false);

  updateFollowOffset(rig, camera, targets.followPosition);

  return updateCameraRigTransitions(rig, camera, CURRENT_TARGET);
}

export function getCameraDebugSnapshot(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
  controls: CameraRigControls,
): CameraRigDebugSnapshot {
  controls.getTarget(CURRENT_TARGET, false);

  return {
    mode: getModeSummary(rig),
    position: {
      x: camera.position.x.toFixed(1),
      y: camera.position.y.toFixed(1),
      z: camera.position.z.toFixed(1),
    },
    target: {
      x: CURRENT_TARGET.x.toFixed(1),
      y: CURRENT_TARGET.y.toFixed(1),
      z: CURRENT_TARGET.z.toFixed(1),
    },
  };
}

function getCameraRigTargetPositions(
  rig: CameraRigState,
): CameraRigTargetPositions {
  const followPosition = rig.follow
    ? rig.follow.object.getWorldPosition(FOLLOW_WORLD_POSITION)
    : null;

  const lookPosition = rig.look
    ? rig.look.object.getWorldPosition(LOOK_WORLD_POSITION)
    : null;

  return {
    followPosition,
    lookPosition,
  };
}

function updateDesiredCameraState(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
  { followPosition, lookPosition }: CameraRigTargetPositions,
) {
  if (rig.mode === "overview") {
    rig.desiredPosition.copy(rig.overviewPosition);
    rig.desiredTarget.copy(rig.overviewTarget);
    return;
  }

  if (rig.mode === "tracking") {
    if (followPosition) {
      rig.desiredPosition.copy(followPosition).add(rig.offset);
    } else {
      rig.desiredPosition.copy(camera.position);
    }

    if (lookPosition) {
      rig.desiredTarget.copy(lookPosition);
    } else if (followPosition) {
      rig.desiredTarget.copy(followPosition);
    } else {
      rig.desiredTarget.copy(CURRENT_TARGET);
    }

    return;
  }

  rig.desiredPosition.copy(camera.position);
  rig.desiredTarget.copy(CURRENT_TARGET);
}

function applyCameraRigState(
  rig: CameraRigState,
  {
    camera,
    controls,
    scene,
    preventMoonCameraIntersection,
  }: {
    camera: THREE.PerspectiveCamera;
    controls: CameraRigControls;
    scene: THREE.Scene;
    preventMoonCameraIntersection: boolean;
  },
) {
  const positionAlpha = rig.positionTransitioning ? rig.transitionAlpha : 1;
  const targetAlpha = rig.targetTransitioning ? rig.transitionAlpha : 1;

  camera.position.lerp(rig.desiredPosition, positionAlpha);
  NEXT_TARGET.copy(CURRENT_TARGET).lerp(rig.desiredTarget, targetAlpha);

  preventCameraBodyIntersection(
    scene,
    camera.position,
    NEXT_TARGET,
    preventMoonCameraIntersection,
  );

  void controls.setLookAt(
    camera.position.x,
    camera.position.y,
    camera.position.z,
    NEXT_TARGET.x,
    NEXT_TARGET.y,
    NEXT_TARGET.z,
    false,
  );

  controls.update(0);
}
