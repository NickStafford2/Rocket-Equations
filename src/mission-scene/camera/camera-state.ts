import * as THREE from "three";
import {
  getInitialFollowOffset,
  updateFollowOffsetFromControlsChange,
} from "./camera-follow";
import { syncCameraRigMode } from "./camera-mode";
import {
  getControlsStartStatus,
  getFollowTargetStatus,
  getLookTargetStatus,
} from "./camera-status";
import type {
  CameraRigControls,
  CameraRigOptions,
  CameraRigSelection,
  CameraRigState,
  CameraRigTarget,
} from "./camera-types";

const DEFAULT_TRANSITION_ALPHA = 0.12;
const DEFAULT_POSITION_EPSILON = 0.8;
const DEFAULT_TARGET_EPSILON = 0.35;

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
  rig.pendingPositionStatus = getFollowTargetStatus(target);
  rig.pendingOverviewStatus = null;
}

export function setLookTarget(rig: CameraRigState, target: CameraRigTarget) {
  rig.mode = "tracking";
  rig.look = target;
  rig.targetTransitioning = true;
  rig.pendingTargetStatus = getLookTargetStatus(target);
  rig.pendingOverviewStatus = null;
}

export function clearFollowTarget(rig: CameraRigState) {
  rig.follow = null;
  rig.positionTransitioning = false;
  rig.pendingPositionStatus = null;
  syncCameraRigMode(rig);
}

export function clearLookTarget(rig: CameraRigState) {
  rig.look = null;
  rig.targetTransitioning = false;
  rig.pendingTargetStatus = null;
  syncCameraRigMode(rig);
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
  const status = getControlsStartStatus(rig);

  if (status) {
    clearAllTracking(rig);
  }

  return status;
}

export function updateFromControlsChange(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
) {
  updateFollowOffsetFromControlsChange(rig, camera);
}

export function isCameraRigAnimating(rig: CameraRigState): boolean {
  return rig.positionTransitioning || rig.targetTransitioning;
}
