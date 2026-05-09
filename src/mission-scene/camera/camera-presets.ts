import * as THREE from "three";
import { createCameraRig } from "./camera-state";
import type { CameraRigSelection, CameraRigState } from "./camera-types";
import type { CameraDebugState, CameraSelection } from "../types";

export const OVERVIEW_CAMERA_POSITION = new THREE.Vector3(-840, 480, 840);
export const OVERVIEW_CAMERA_TARGET = new THREE.Vector3(224, 0, 0);

export function createInitialCameraRig(): CameraRigState {
  return createCameraRig({
    overviewPosition: OVERVIEW_CAMERA_POSITION,
    overviewTarget: OVERVIEW_CAMERA_TARGET,
  });
}

export function createInitialCameraDebugState(): CameraDebugState {
  return {
    mode: "overview",
    renderSpaceMode: "earth-local",
    renderSpaceAnchor: "earth",
    renderSpaceProjection: "body-surface-scaled",
    renderOrigin: {
      x: "0.0",
      y: "0.0",
      z: "0.0",
    },
    position: {
      x: OVERVIEW_CAMERA_POSITION.x.toFixed(1),
      y: OVERVIEW_CAMERA_POSITION.y.toFixed(1),
      z: OVERVIEW_CAMERA_POSITION.z.toFixed(1),
    },
    target: {
      x: OVERVIEW_CAMERA_TARGET.x.toFixed(1),
      y: OVERVIEW_CAMERA_TARGET.y.toFixed(1),
      z: OVERVIEW_CAMERA_TARGET.z.toFixed(1),
    },
  };
}

export function toCameraSelection(
  selection: CameraRigSelection,
): CameraSelection {
  return {
    isOverviewActive: selection.overview,
    lockTarget: selection.followTarget,
    lookTarget: selection.lookTarget,
  };
}
