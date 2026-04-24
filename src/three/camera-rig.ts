import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CameraTarget } from "../mission";

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
  controls: OrbitControls;
  scene: THREE.Scene;
};

const DEFAULT_TRANSITION_ALPHA = 0.12;
const DEFAULT_POSITION_EPSILON = 0.8;
const DEFAULT_TARGET_EPSILON = 0.35;
const FALLBACK_VIEW_DIRECTION = new THREE.Vector3(1.25, 0.75, 1.15).normalize();
const FOLLOW_WORLD_POSITION = new THREE.Vector3();
const LOOK_WORLD_POSITION = new THREE.Vector3();

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
  controls: OrbitControls,
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
  if (rig.mode !== "overview") return null;

  const status = rig.positionTransitioning || rig.targetTransitioning
    ? "Overview transition canceled."
    : "Free camera enabled.";
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
  { camera, controls, scene }: CameraRigUpdateOptions,
): string[] {
  syncMode(rig);
  scene.updateMatrixWorld(true);

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
      rig.desiredTarget.copy(controls.target);
    }
  } else {
    rig.desiredPosition.copy(camera.position);
    rig.desiredTarget.copy(controls.target);
  }

  const positionAlpha = rig.positionTransitioning ? rig.transitionAlpha : 1;
  const targetAlpha = rig.targetTransitioning ? rig.transitionAlpha : 1;
  camera.position.lerp(rig.desiredPosition, positionAlpha);
  controls.target.lerp(rig.desiredTarget, targetAlpha);
  controls.update();

  const statuses: string[] = [];
  const positionSettled =
    camera.position.distanceTo(rig.desiredPosition) < rig.positionEpsilon;
  const targetSettled =
    controls.target.distanceTo(rig.desiredTarget) < rig.targetEpsilon;

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
  controls: OrbitControls,
): CameraRigDebugSnapshot {
  return {
    mode: getModeSummary(rig),
    position: {
      x: camera.position.x.toFixed(1),
      y: camera.position.y.toFixed(1),
      z: camera.position.z.toFixed(1),
    },
    target: {
      x: controls.target.x.toFixed(1),
      y: controls.target.y.toFixed(1),
      z: controls.target.z.toFixed(1),
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
  controls: OrbitControls,
): THREE.Vector3 {
  object.getWorldPosition(FOLLOW_WORLD_POSITION);

  const currentOffset = camera.position.clone().sub(FOLLOW_WORLD_POSITION);
  const focusRadius = Number(object.userData.focusRadius ?? 12);
  const minDistance = THREE.MathUtils.clamp(focusRadius * 2.5, 0.18, 520);
  const maxDistance = THREE.MathUtils.clamp(focusRadius * 12, 1.25, 700);

  if (currentOffset.lengthSq() > 1e-6) {
    const clampedDistance = THREE.MathUtils.clamp(
      currentOffset.length(),
      minDistance,
      maxDistance,
    );
    return currentOffset.setLength(clampedDistance);
  }

  const viewDirection = camera.position.clone().sub(controls.target);
  if (viewDirection.lengthSq() > 1e-6) {
    return viewDirection
      .normalize()
      .multiplyScalar(THREE.MathUtils.clamp(focusRadius * 5, 0.4, 520));
  }

  return FALLBACK_VIEW_DIRECTION
    .clone()
    .multiplyScalar(THREE.MathUtils.clamp(focusRadius * 5, 0.4, 520));
}
