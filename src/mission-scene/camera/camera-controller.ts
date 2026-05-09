import * as THREE from "three";
import CameraControls from "camera-controls";
import type { CameraTarget } from "../../mission";
import { getCameraClipPlanes } from "./camera-clip-planes";

CameraControls.install({ THREE });

const CURRENT_TARGET = new THREE.Vector3();

export type MissionCameraController = {
  bindInteractionHandlers: (
    handlers: MissionCameraInteractionHandlers,
  ) => () => void;
  dispose: () => void;
  getDistanceToTarget: () => number;
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
  syncClipPlanes: (options: MissionCameraClipPlaneOptions) => void;
  update: (deltaSeconds: number) => boolean;
};

type MissionCameraInteractionHandlers = {
  onControl?: () => void;
  onControlEnd?: () => void;
  onControlStart?: () => void;
  onUpdate?: () => void;
};

type MissionCameraClipPlaneOptions = {
  camera: THREE.PerspectiveCamera;
  followTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
};

export function createMissionCameraController({
  camera,
  domElement,
}: {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
}): MissionCameraController {
  const controls = new CameraControls(camera, domElement);

  controls.smoothTime = 0.25;
  controls.draggingSmoothTime = 0.125;
  controls.azimuthRotateSpeed = 0.55;
  controls.polarRotateSpeed = 0.55;
  controls.dollySpeed = 0.9;
  controls.truckSpeed = 0.75;
  controls.minDistance = 0.0002;
  controls.maxDistance = 5600;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI - 0.08;
  controls.setLookAt(
    camera.position.x,
    camera.position.y,
    camera.position.z,
    224,
    0,
    0,
    false,
  );
  controls.saveState();

  function bindInteractionHandlers({
    onControl,
    onControlEnd,
    onControlStart,
    onUpdate,
  }: MissionCameraInteractionHandlers) {
    if (onControlStart) {
      controls.addEventListener("controlstart", onControlStart);
    }
    if (onControl) {
      controls.addEventListener("control", onControl);
    }
    if (onControlEnd) {
      controls.addEventListener("controlend", onControlEnd);
    }
    if (onUpdate) {
      controls.addEventListener("update", onUpdate);
    }

    return () => {
      if (onControlStart) {
        controls.removeEventListener("controlstart", onControlStart);
      }
      if (onControl) {
        controls.removeEventListener("control", onControl);
      }
      if (onControlEnd) {
        controls.removeEventListener("controlend", onControlEnd);
      }
      if (onUpdate) {
        controls.removeEventListener("update", onUpdate);
      }
    };
  }

  function getDistanceToTarget() {
    controls.getTarget(CURRENT_TARGET, false);
    return camera.position.distanceTo(CURRENT_TARGET);
  }

  function syncClipPlanes({
    camera,
    followTarget,
    lookTarget,
  }: MissionCameraClipPlaneOptions) {
    const { near: nextNear, far: nextFar } = getCameraClipPlanes({
      followTarget,
      lookTarget,
      distanceToTarget: getDistanceToTarget(),
    });

    if (
      Math.abs(camera.near - nextNear) <= 1e-6 &&
      Math.abs(camera.far - nextFar) <= 1e-3
    ) {
      return;
    }

    camera.near = nextNear;
    camera.far = nextFar;
    camera.updateProjectionMatrix();
  }

  return {
    bindInteractionHandlers,
    dispose: () => {
      controls.dispose();
    },
    getDistanceToTarget,
    getTarget: (out, receiveEndValue = false) =>
      controls.getTarget(out, receiveEndValue),
    setLookAt: (
      positionX,
      positionY,
      positionZ,
      targetX,
      targetY,
      targetZ,
      enableTransition = false,
    ) =>
      controls.setLookAt(
        positionX,
        positionY,
        positionZ,
        targetX,
        targetY,
        targetZ,
        enableTransition,
      ),
    syncClipPlanes,
    update: (deltaSeconds) => controls.update(deltaSeconds),
  };
}
