import * as THREE from "three";
import type { CameraTarget } from "../../mission";
import {
  FALLBACK_VIEW_DIRECTION,
  preventCameraBodyIntersection,
} from "./camera-collisions";

export type CameraRigMode = "free" | "overview" | "tracking";

export type CameraRigSelection = {
  overview: boolean;
  followTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
};

export type CameraRigTarget = {
  key: CameraTarget;
  object: THREE.Object3D;
};

export type CameraRigDebugSnapshot = {
  mode: string;
  position: {
    x: string;
    y: string;
    z: string;
  };
  target: {
    x: string;
    y: string;
    z: string;
  };
};

type CameraRigOptions = {
  overviewPosition: THREE.Vector3;
  overviewTarget: THREE.Vector3;
  transitionAlpha?: number;
  positionEpsilon?: number;
  targetEpsilon?: number;
};

type CameraRigUpdateOptions = {
  camera: THREE.PerspectiveCamera;
  controls: CameraRigControls;
  scene: THREE.Scene;
  deltaSeconds: number;
  preventMoonCameraIntersection?: boolean;
};

type CameraRigControls = {
  getTarget: (out: THREE.Vector3, receiveEndValue?: boolean) => THREE.Vector3;
  setLookAt: (
    positionX: number,
    positionY: number,
    positionZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    enableTransition?: boolean,
  ) => Promise<void>;
  update: (deltaSeconds: number) => boolean;
};

const DEFAULT_TRANSITION_ALPHA = 0.12;
const DEFAULT_POSITION_EPSILON = 0.8;
const DEFAULT_TARGET_EPSILON = 0.35;
const FOLLOW_WORLD_POSITION = new THREE.Vector3();
const LOOK_WORLD_POSITION = new THREE.Vector3();
const CURRENT_TARGET = new THREE.Vector3();
const NEXT_TARGET = new THREE.Vector3();
const FOLLOW_MIN_DISTANCE_MULTIPLIER = 0.3;
const FOLLOW_MAX_DISTANCE_MULTIPLIER = 8;
const FOLLOW_DEFAULT_DISTANCE_MULTIPLIER = 1.05;

export type CameraRigState = {
  mode: CameraRigMode;
  follow: CameraRigTarget | null;
  look: CameraRigTarget | null;
  offset: THREE.Vector3;
  desiredPosition: THREE.Vector3;
  desiredTarget: THREE.Vector3;
  transitionAlpha: number;
  overviewPosition: THREE.Vector3;
  overviewTarget: THREE.Vector3;
  positionTransitioning: boolean;
  targetTransitioning: boolean;
  positionEpsilon: number;
  targetEpsilon: number;
  pendingPositionStatus: string | null;
  pendingTargetStatus: string | null;
  pendingOverviewStatus: string | null;
};

export function createCameraRig({
  overviewPosition,
  overviewTarget,
  transitionAlpha = DEFAULT_TRANSITION_ALPHA,
  positionEpsilon = DEFAULT_POSITION_EPSILON,
  targetEpsilon = DEFAULT_TARGET_EPSILON,
}: CameraRigOptions): CameraRigState {
  return {
    mode: "overview",
    follow: null,
    look: null,
    offset: overviewPosition.clone().sub(overviewTarget),
    desiredPosition: overviewPosition.clone(),
    desiredTarget: overviewTarget.clone(),
    transitionAlpha,
    overviewPosition: overviewPosition.clone(),
    overviewTarget: overviewTarget.clone(),
    positionTransitioning: false,
    targetTransitioning: false,
    positionEpsilon,
    targetEpsilon,
    pendingPositionStatus: null,
    pendingTargetStatus: null,
    pendingOverviewStatus: null,
  };
}

export function setOverview(rig: CameraRigState) {
  rig.mode = "overview";
  rig.follow = null;
  rig.look = null;
  rig.positionTransitioning = true;
  rig.targetTransitioning = true;
  rig.pendingPositionStatus = null;
  rig.pendingTargetStatus = null;
  rig.pendingOverviewStatus = "Overview camera restored.";
  rig.desiredPosition.copy(rig.overviewPosition);
  rig.desiredTarget.copy(rig.overviewTarget);
}

export function setFollowTarget(
  rig: CameraRigState,
  target: CameraRigTarget,
  camera: THREE.PerspectiveCamera,
  controls: CameraRigControls,
) {
  rig.mode = "tracking";
  rig.follow = target;
  rig.offset.copy(getInitialFollowOffset(target.object, camera, controls));
  rig.positionTransitioning = true;
  rig.pendingPositionStatus = `Locked on ${getTargetLabel(target)}.`;
  rig.pendingOverviewStatus = null;
}

export function setLookTarget(rig: CameraRigState, target: CameraRigTarget) {
  rig.mode = "tracking";
  rig.look = target;
  rig.targetTransitioning = true;
  rig.pendingTargetStatus = `Looking at ${getTargetLabel(target)}.`;
  rig.pendingOverviewStatus = null;
}

export function clearFollowTarget(rig: CameraRigState) {
  rig.follow = null;
  rig.positionTransitioning = false;
  rig.pendingPositionStatus = null;
  syncMode(rig);
}

export function clearLookTarget(rig: CameraRigState) {
  rig.look = null;
  rig.targetTransitioning = false;
  rig.pendingTargetStatus = null;
  syncMode(rig);
}

export function clearAllTracking(rig: CameraRigState) {
  rig.mode = "free";
  rig.follow = null;
  rig.look = null;
  rig.positionTransitioning = false;
  rig.targetTransitioning = false;
  rig.pendingPositionStatus = null;
  rig.pendingTargetStatus = null;
  rig.pendingOverviewStatus = null;
}

export function syncSelection(rig: CameraRigState): CameraRigSelection {
  return {
    overview: rig.mode === "overview",
    followTarget: rig.follow?.key ?? null,
    lookTarget: rig.look?.key ?? null,
  };
}

export function updateFromControlsStart(rig: CameraRigState): string | null {
  if (rig.mode === "free") {
    return null;
  }

  const status =
    rig.mode === "overview"
      ? rig.positionTransitioning || rig.targetTransitioning
        ? "Overview transition canceled."
        : "Free camera enabled."
      : "Camera tracking canceled.";
  clearAllTracking(rig);
  return status;
}

export function updateFromControlsChange(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
) {
  if (!rig.follow || rig.positionTransitioning) return;

  rig.follow.object.getWorldPosition(FOLLOW_WORLD_POSITION);
  rig.offset.copy(camera.position).sub(FOLLOW_WORLD_POSITION);
}

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
  syncMode(rig);
  scene.updateMatrixWorld(true);
  controls.update(deltaSeconds);
  controls.getTarget(CURRENT_TARGET, false);

  const followPosition = rig.follow
    ? rig.follow.object.getWorldPosition(FOLLOW_WORLD_POSITION)
    : null;
  const lookPosition = rig.look
    ? rig.look.object.getWorldPosition(LOOK_WORLD_POSITION)
    : null;

  if (rig.mode === "overview") {
    rig.desiredPosition.copy(rig.overviewPosition);
    rig.desiredTarget.copy(rig.overviewTarget);
  } else if (rig.mode === "tracking") {
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
  } else {
    rig.desiredPosition.copy(camera.position);
    rig.desiredTarget.copy(CURRENT_TARGET);
  }

  if (rig.mode !== "free") {
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
  controls.getTarget(CURRENT_TARGET, false);

  if (followPosition && !rig.positionTransitioning) {
    rig.offset.copy(camera.position).sub(followPosition);
  }

  const statuses: string[] = [];
  const positionSettled =
    camera.position.distanceTo(rig.desiredPosition) < rig.positionEpsilon;
  const targetSettled =
    CURRENT_TARGET.distanceTo(rig.desiredTarget) < rig.targetEpsilon;

  if (rig.mode === "overview") {
    if (rig.positionTransitioning && positionSettled) {
      rig.positionTransitioning = false;
    }
    if (rig.targetTransitioning && targetSettled) {
      rig.targetTransitioning = false;
    }

    if (
      !rig.positionTransitioning &&
      !rig.targetTransitioning &&
      rig.pendingOverviewStatus
    ) {
      statuses.push(rig.pendingOverviewStatus);
      rig.pendingOverviewStatus = null;
    }

    return statuses;
  }

  if (rig.positionTransitioning && positionSettled) {
    rig.positionTransitioning = false;
    if (rig.pendingPositionStatus) {
      statuses.push(rig.pendingPositionStatus);
      rig.pendingPositionStatus = null;
    }
  }

  if (rig.targetTransitioning && targetSettled) {
    rig.targetTransitioning = false;
    if (rig.pendingTargetStatus) {
      statuses.push(rig.pendingTargetStatus);
      rig.pendingTargetStatus = null;
    }
  }

  return statuses;
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

function syncMode(rig: CameraRigState) {
  if (rig.mode === "overview") return;

  if (!rig.follow && !rig.look) {
    rig.mode = "free";
    rig.positionTransitioning = false;
    rig.targetTransitioning = false;
    rig.pendingPositionStatus = null;
    rig.pendingTargetStatus = null;
    rig.pendingOverviewStatus = null;
    return;
  }

  rig.pendingOverviewStatus = null;
  rig.mode = "tracking";
}

function getModeSummary(rig: CameraRigState): string {
  if (rig.mode === "overview") return "overview";
  if (!rig.follow && !rig.look) return "free";
  if (rig.follow && rig.look) {
    return `follow:${rig.follow.key} look:${rig.look.key}`;
  }
  if (rig.follow) return `follow:${rig.follow.key}`;
  if (rig.look) return `look:${rig.look.key}`;
  return "free";
}

function getTargetLabel(target: CameraRigTarget): string {
  return String(target.object.userData.focusLabel ?? target.key);
}

function getInitialFollowOffset(
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

export function isCameraRigAnimating(rig: CameraRigState): boolean {
  return rig.positionTransitioning || rig.targetTransitioning;
}
