import * as THREE from "three";
import {
  createCameraController,
  type CameraControllerSelection,
  type CameraControllerState,
} from "../camera/controller";
import {
  findRegisteredCameraTargetForObject,
  getCameraTargetById,
  type CameraTarget,
  type CameraTargetRegistry,
} from "../camera/targets";
import type { CameraTarget as MissionCameraTarget } from "../mission";
import type { CameraDebugState, CameraSelection } from "./types";

export const OVERVIEW_CAMERA_POSITION = new THREE.Vector3(-840, 480, 840);
export const OVERVIEW_CAMERA_TARGET = new THREE.Vector3(224, 0, 0);

export function createInitialCameraController(
  registry: CameraTargetRegistry,
): CameraControllerState {
  return createCameraController({
    registry,
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
  selection: CameraControllerSelection,
): CameraSelection {
  return {
    isOverviewActive: selection.overview,
    lockTarget: selection.followTarget,
    lookTarget: selection.lookTarget,
  };
}

export function findCameraTargetByPreset(
  registry: CameraTargetRegistry,
  preset: MissionCameraTarget,
): CameraTarget | null {
  return getCameraTargetById(registry, preset);
}

export function findCameraTargetForObject(
  registry: CameraTargetRegistry,
  object: THREE.Object3D | null,
): CameraTarget | null {
  return findRegisteredCameraTargetForObject(registry, object);
}
