import * as THREE from "three";
import type { CameraRigState } from "./camera-types";

export function updateCameraRigTransitions(
  rig: CameraRigState,
  camera: THREE.PerspectiveCamera,
  currentTarget: THREE.Vector3,
): string[] {
  const statuses: string[] = [];

  const positionSettled =
    camera.position.distanceTo(rig.desiredPosition) < rig.positionEpsilon;

  const targetSettled =
    currentTarget.distanceTo(rig.desiredTarget) < rig.targetEpsilon;

  if (rig.mode === "overview") {
    updateOverviewTransitionState(
      rig,
      positionSettled,
      targetSettled,
      statuses,
    );

    return statuses;
  }

  updateTrackingTransitionState(rig, positionSettled, targetSettled, statuses);

  return statuses;
}

function updateTrackingTransitionState(
  rig: CameraRigState,
  positionSettled: boolean,
  targetSettled: boolean,
  statuses: string[],
) {
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
}

function updateOverviewTransitionState(
  rig: CameraRigState,
  positionSettled: boolean,
  targetSettled: boolean,
  statuses: string[],
) {
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
}
