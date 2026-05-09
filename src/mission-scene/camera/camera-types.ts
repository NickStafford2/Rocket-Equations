import * as THREE from "three";
import type { CameraTarget } from "../../mission";

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

export type CameraRigOptions = {
  overviewPosition: THREE.Vector3;
  overviewTarget: THREE.Vector3;
  transitionAlpha?: number;
  positionEpsilon?: number;
  targetEpsilon?: number;
};

export type CameraRigControls = {
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

export type CameraRigUpdateOptions = {
  camera: THREE.PerspectiveCamera;
  controls: CameraRigControls;
  scene: THREE.Scene;
  deltaSeconds: number;
  preventMoonCameraIntersection?: boolean;
};

export type CameraRigTargetPositions = {
  followPosition: THREE.Vector3 | null;
  lookPosition: THREE.Vector3 | null;
};

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
