import * as THREE from "three";
import { normalizeFocusLabelToPreset } from "../mission";
import type { CameraTarget } from "../mission";
import {
  createCameraRig,
  type CameraRigSelection,
  type CameraRigState,
  type CameraRigTarget,
} from "../three/camera-rig";
import type { CameraDebugState, CameraSelection } from "./types";

export const OVERVIEW_CAMERA_POSITION = new THREE.Vector3(-210, 120, 210);
export const OVERVIEW_CAMERA_TARGET = new THREE.Vector3(56, 0, 0);

export function createInitialCameraRig(): CameraRigState {
  return createCameraRig({
    overviewPosition: OVERVIEW_CAMERA_POSITION,
    overviewTarget: OVERVIEW_CAMERA_TARGET,
  });
}

export function createInitialCameraDebugState(): CameraDebugState {
  return {
    mode: "overview",
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

export function getFocusLabel(object: THREE.Object3D): string {
  return String(object.userData.focusLabel ?? "target");
}

export function findFocusableByPreset(
  scene: THREE.Scene,
  preset: CameraTarget,
): CameraRigTarget | null {
  let focusable: CameraRigTarget | null = null;
  scene.traverse((object) => {
    if (focusable) return;
    const target = toCameraRigTarget(object);
    if (target?.key === preset) {
      focusable = target;
    }
  });

  return focusable;
}

export function findFocusableObject(
  object: THREE.Object3D | null,
): CameraRigTarget | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    const target = toCameraRigTarget(current);
    if (target) return target;
    current = current.parent;
  }

  return null;
}

function toCameraRigTarget(object: THREE.Object3D): CameraRigTarget | null {
  const key = normalizeFocusLabelToPreset(object.userData.focusLabel);
  if (!key || key === "overview") return null;

  return {
    key,
    object,
  };
}
