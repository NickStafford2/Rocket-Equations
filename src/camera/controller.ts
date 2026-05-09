import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CameraTarget as MissionCameraTarget } from "../mission";
import {
  type CameraFrame,
  createBodyLocalFrame,
  resolveReferenceBodyForTarget,
} from "./frames";
import { resolveCameraMode, type CameraMode } from "./modes";
import type { CameraTarget, CameraTargetRegistry } from "./targets";

export type CameraControllerSelection = {
  overview: boolean;
  followTarget: MissionCameraTarget | null;
  lookTarget: MissionCameraTarget | null;
};

export type CameraControllerDebugSnapshot = {
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

type CameraControllerOptions = {
  registry: CameraTargetRegistry;
  overviewPosition: THREE.Vector3;
  overviewTarget: THREE.Vector3;
  transitionAlpha?: number;
  positionEpsilon?: number;
  targetEpsilon?: number;
};

type CameraControllerUpdateOptions = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scene: THREE.Scene;
  preventMoonCameraIntersection?: boolean;
};

type BodyOrbitState = {
  yaw: number;
  pitch: number;
  radius: number;
};

export type CameraControllerState = {
  mode: CameraMode;
  follow: CameraTarget | null;
  look: CameraTarget | null;
  referenceBody: CameraTarget | null;
  registry: CameraTargetRegistry;
  inertialOffset: THREE.Vector3;
  bodyOrbit: BodyOrbitState;
  bodyOrbitRight: THREE.Vector3;
  bodyOrbitInitialized: boolean;
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

const DEFAULT_TRANSITION_ALPHA = 0.12;
const DEFAULT_POSITION_EPSILON = 0.8;
const DEFAULT_TARGET_EPSILON = 0.35;
const FALLBACK_VIEW_DIRECTION = new THREE.Vector3(1.25, 0.75, 1.15).normalize();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const FOLLOW_WORLD_POSITION = new THREE.Vector3();
const LOOK_WORLD_POSITION = new THREE.Vector3();
const CAMERA_COLLISION_CENTER = new THREE.Vector3();
const CAMERA_COLLISION_OFFSET = new THREE.Vector3();
const TARGET_OFFSET = new THREE.Vector3();
const TARGET_NORMAL = new THREE.Vector3();
const CAMERA_OFFSET_FROM_TARGET = new THREE.Vector3();
const TANGENTIAL_OFFSET = new THREE.Vector3();
const BODY_ORBIT_OFFSET = new THREE.Vector3();
const BODY_ORBIT_MIN_PITCH = -Math.PI * 0.48;
const BODY_ORBIT_MAX_PITCH = Math.PI * 0.48;

export function createCameraController({
  registry,
  overviewPosition,
  overviewTarget,
  transitionAlpha = DEFAULT_TRANSITION_ALPHA,
  positionEpsilon = DEFAULT_POSITION_EPSILON,
  targetEpsilon = DEFAULT_TARGET_EPSILON,
}: CameraControllerOptions): CameraControllerState {
  return {
    mode: "overview",
    follow: null,
    look: null,
    referenceBody: null,
    registry,
    inertialOffset: overviewPosition.clone().sub(overviewTarget),
    bodyOrbit: {
      yaw: 0,
      pitch: 0,
      radius: 1,
    },
    bodyOrbitRight: new THREE.Vector3(1, 0, 0),
    bodyOrbitInitialized: false,
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

export function setOverview(controller: CameraControllerState) {
  controller.mode = "overview";
  controller.follow = null;
  controller.look = null;
  controller.referenceBody = null;
  controller.bodyOrbitInitialized = false;
  controller.positionTransitioning = true;
  controller.targetTransitioning = true;
  controller.pendingPositionStatus = null;
  controller.pendingTargetStatus = null;
  controller.pendingOverviewStatus = "Overview camera restored.";
  controller.desiredPosition.copy(controller.overviewPosition);
  controller.desiredTarget.copy(controller.overviewTarget);
}

export function setFollowTarget(
  controller: CameraControllerState,
  target: CameraTarget,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  controller.mode = "inertialFollow";
  controller.follow = target;
  controller.inertialOffset.copy(
    getInitialFollowOffset(target, camera, controls),
  );
  controller.referenceBody = resolveReferenceBodyForTarget(
    controller.registry,
    target,
  );
  controller.bodyOrbitInitialized = false;

  if (controller.referenceBody) {
    const frame = createBodyLocalFrame(
      controller.referenceBody,
      target,
      controller.bodyOrbitRight,
    );
    if (frame?.kind === "bodyLocal") {
      syncBodyOrbitFromCamera(controller, camera.position, target, frame);
      controller.bodyOrbitRight.copy(frame.right);
      controller.bodyOrbitInitialized = true;
    }
  }

  controller.positionTransitioning = true;
  controller.pendingPositionStatus = `Locked on ${target.label}.`;
  controller.pendingOverviewStatus = null;
}

export function setLookTarget(
  controller: CameraControllerState,
  target: CameraTarget,
) {
  if (controller.mode === "overview") {
    controller.mode = "inertialFollow";
  }
  controller.look = target;
  controller.targetTransitioning = true;
  controller.pendingTargetStatus = `Looking at ${target.label}.`;
  controller.pendingOverviewStatus = null;
}

export function clearFollowTarget(controller: CameraControllerState) {
  controller.follow = null;
  controller.referenceBody = null;
  controller.bodyOrbitInitialized = false;
  controller.positionTransitioning = false;
  controller.pendingPositionStatus = null;
  syncMode(controller, null);
}

export function clearLookTarget(controller: CameraControllerState) {
  controller.look = null;
  controller.targetTransitioning = false;
  controller.pendingTargetStatus = null;
  syncMode(controller, null);
}

export function clearAllTracking(controller: CameraControllerState) {
  controller.mode = "free";
  controller.follow = null;
  controller.look = null;
  controller.referenceBody = null;
  controller.bodyOrbitInitialized = false;
  controller.positionTransitioning = false;
  controller.targetTransitioning = false;
  controller.pendingPositionStatus = null;
  controller.pendingTargetStatus = null;
  controller.pendingOverviewStatus = null;
}

export function syncSelection(
  controller: CameraControllerState,
): CameraControllerSelection {
  return {
    overview: controller.mode === "overview",
    followTarget: controller.follow?.id ?? null,
    lookTarget: controller.look?.id ?? null,
  };
}

export function updateFromControlsStart(
  controller: CameraControllerState,
): string | null {
  if (controller.mode !== "overview") return null;

  const status =
    controller.positionTransitioning || controller.targetTransitioning
      ? "Overview transition canceled."
      : "Free camera enabled.";
  clearAllTracking(controller);
  return status;
}

export function updateFromControlsChange(
  controller: CameraControllerState,
  camera: THREE.PerspectiveCamera,
) {
  if (!controller.follow || controller.positionTransitioning) return;

  if (controller.mode === "bodyOrbit" && controller.referenceBody) {
    const frame = createBodyLocalFrame(
      controller.referenceBody,
      controller.follow,
      controller.bodyOrbitRight,
    );

    if (frame?.kind === "bodyLocal") {
      syncBodyOrbitFromCamera(controller, camera.position, controller.follow, frame);
      controller.bodyOrbitRight.copy(frame.right);
    }
    return;
  }

  controller.follow.getAnchor(FOLLOW_WORLD_POSITION);
  controller.inertialOffset.copy(camera.position).sub(FOLLOW_WORLD_POSITION);
}

export function updateCameraController(
  controller: CameraControllerState,
  {
    camera,
    controls,
    scene,
    preventMoonCameraIntersection = true,
  }: CameraControllerUpdateOptions,
): string[] {
  scene.updateMatrixWorld(true);

  const trackedFrame = resolveTrackedFrame(controller);
  syncMode(controller, trackedFrame);

  const followPosition = controller.follow
    ? controller.follow.getAnchor(FOLLOW_WORLD_POSITION)
    : null;
  const lookPosition = controller.look
    ? controller.look.getAnchor(LOOK_WORLD_POSITION)
    : null;

  if (controller.mode === "overview") {
    controller.desiredPosition.copy(controller.overviewPosition);
    controller.desiredTarget.copy(controller.overviewTarget);
    camera.up.copy(WORLD_UP);
  } else if (
    controller.mode === "bodyOrbit" &&
    followPosition &&
    trackedFrame?.kind === "bodyLocal"
  ) {
    if (!controller.bodyOrbitInitialized && controller.follow) {
      syncBodyOrbitFromCamera(
        controller,
        camera.position,
        controller.follow,
        trackedFrame,
      );
      controller.bodyOrbitInitialized = true;
    }

    controller.bodyOrbitRight.copy(trackedFrame.right);
    composeBodyOrbitOffset(controller.bodyOrbit, trackedFrame, BODY_ORBIT_OFFSET);
    controller.desiredPosition.copy(followPosition).add(BODY_ORBIT_OFFSET);
    controller.desiredTarget.copy(lookPosition ?? followPosition);
    camera.up.copy(trackedFrame.up);
  } else if (controller.mode === "inertialFollow") {
    if (followPosition) {
      controller.desiredPosition
        .copy(followPosition)
        .add(controller.inertialOffset);
    } else {
      controller.desiredPosition.copy(camera.position);
    }

    controller.desiredTarget.copy(lookPosition ?? followPosition ?? controls.target);
    camera.up.copy(WORLD_UP);
  } else {
    controller.desiredPosition.copy(camera.position);
    controller.desiredTarget.copy(controls.target);
    camera.up.copy(WORLD_UP);
  }

  const positionAlpha = controller.positionTransitioning
    ? controller.transitionAlpha
    : 1;
  const targetAlpha = controller.targetTransitioning
    ? controller.transitionAlpha
    : 1;

  camera.position.lerp(controller.desiredPosition, positionAlpha);
  controls.target.lerp(controller.desiredTarget, targetAlpha);
  preventCameraBodyIntersection(
    controller,
    camera,
    controls.target,
    preventMoonCameraIntersection,
  );
  controls.update();

  if (followPosition && !controller.positionTransitioning) {
    if (
      controller.mode === "bodyOrbit" &&
      trackedFrame?.kind === "bodyLocal" &&
      controller.follow
    ) {
      syncBodyOrbitFromCamera(
        controller,
        camera.position,
        controller.follow,
        trackedFrame,
      );
    } else {
      controller.inertialOffset.copy(camera.position).sub(followPosition);
    }
  }

  const statuses: string[] = [];
  const positionSettled =
    camera.position.distanceTo(controller.desiredPosition) <
    controller.positionEpsilon;
  const targetSettled =
    controls.target.distanceTo(controller.desiredTarget) <
    controller.targetEpsilon;

  if (controller.mode === "overview") {
    if (controller.positionTransitioning && positionSettled) {
      controller.positionTransitioning = false;
    }
    if (controller.targetTransitioning && targetSettled) {
      controller.targetTransitioning = false;
    }

    if (
      !controller.positionTransitioning &&
      !controller.targetTransitioning &&
      controller.pendingOverviewStatus
    ) {
      statuses.push(controller.pendingOverviewStatus);
      controller.pendingOverviewStatus = null;
    }

    return statuses;
  }

  if (controller.positionTransitioning && positionSettled) {
    controller.positionTransitioning = false;
    if (controller.pendingPositionStatus) {
      statuses.push(controller.pendingPositionStatus);
      controller.pendingPositionStatus = null;
    }
  }

  if (controller.targetTransitioning && targetSettled) {
    controller.targetTransitioning = false;
    if (controller.pendingTargetStatus) {
      statuses.push(controller.pendingTargetStatus);
      controller.pendingTargetStatus = null;
    }
  }

  return statuses;
}

export function getCameraDebugSnapshot(
  controller: CameraControllerState,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): CameraControllerDebugSnapshot {
  return {
    mode: getModeSummary(controller),
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

function resolveTrackedFrame(
  controller: CameraControllerState,
): CameraFrame | null {
  if (!controller.follow) {
    controller.referenceBody = null;
    return null;
  }

  const referenceBody = resolveReferenceBodyForTarget(
    controller.registry,
    controller.follow,
  );
  controller.referenceBody = referenceBody;

  if (!referenceBody) {
    return null;
  }

  return createBodyLocalFrame(
    referenceBody,
    controller.follow,
    controller.bodyOrbitRight,
  );
}

function syncMode(
  controller: CameraControllerState,
  trackedFrame: CameraFrame | null,
) {
  if (controller.mode === "overview") return;

  const nextMode = resolveCameraMode({
    overviewActive: false,
    followTarget: controller.follow,
    lookTarget: controller.look,
    frame: trackedFrame,
  });

  if (nextMode === "free") {
    controller.mode = "free";
    controller.referenceBody = null;
    controller.bodyOrbitInitialized = false;
    controller.positionTransitioning = false;
    controller.targetTransitioning = false;
    controller.pendingPositionStatus = null;
    controller.pendingTargetStatus = null;
    controller.pendingOverviewStatus = null;
    return;
  }

  controller.pendingOverviewStatus = null;

  if (controller.mode !== nextMode && nextMode !== "bodyOrbit") {
    controller.bodyOrbitInitialized = false;
  }

  controller.mode = nextMode;
}

function getModeSummary(controller: CameraControllerState): string {
  if (controller.mode === "overview") return "overview";
  if (controller.mode === "free") return "free";
  if (controller.mode === "bodyOrbit") {
    return controller.referenceBody
      ? `bodyOrbit:${controller.referenceBody.id}`
      : "bodyOrbit";
  }
  if (controller.follow && controller.look) {
    return `follow:${controller.follow.id} look:${controller.look.id}`;
  }
  if (controller.follow) return `follow:${controller.follow.id}`;
  if (controller.look) return `look:${controller.look.id}`;
  return "free";
}

function getInitialFollowOffset(
  target: CameraTarget,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): THREE.Vector3 {
  target.getAnchor(FOLLOW_WORLD_POSITION);

  const currentOffset = camera.position.clone().sub(FOLLOW_WORLD_POSITION);
  const {
    followMinDistance,
    followDefaultDistance,
    followMaxDistance,
  } = target.cameraProfile;

  if (currentOffset.lengthSq() > 1e-6) {
    return currentOffset.setLength(
      THREE.MathUtils.clamp(
        currentOffset.length(),
        followMinDistance,
        followMaxDistance,
      ),
    );
  }

  const viewDirection = camera.position.clone().sub(controls.target);
  if (viewDirection.lengthSq() > 1e-6) {
    return viewDirection.normalize().multiplyScalar(followDefaultDistance);
  }

  return FALLBACK_VIEW_DIRECTION.clone().multiplyScalar(followDefaultDistance);
}

function syncBodyOrbitFromCamera(
  controller: CameraControllerState,
  cameraPosition: THREE.Vector3,
  followTarget: CameraTarget,
  frame: Extract<CameraFrame, { kind: "bodyLocal" }>,
) {
  followTarget.getAnchor(FOLLOW_WORLD_POSITION);
  BODY_ORBIT_OFFSET.copy(cameraPosition).sub(FOLLOW_WORLD_POSITION);

  const radius = BODY_ORBIT_OFFSET.length();
  const {
    followMinDistance,
    followDefaultDistance,
    followMaxDistance,
  } = followTarget.cameraProfile;

  if (radius <= 1e-6) {
    controller.bodyOrbit.yaw = 0;
    controller.bodyOrbit.pitch = 0.25;
    controller.bodyOrbit.radius = followDefaultDistance;
    return;
  }

  const clampedRadius = THREE.MathUtils.clamp(
    radius,
    followMinDistance,
    followMaxDistance,
  );
  BODY_ORBIT_OFFSET.multiplyScalar(1 / radius);
  const localX = BODY_ORBIT_OFFSET.dot(frame.right);
  const localY = BODY_ORBIT_OFFSET.dot(frame.up);
  const localZ = BODY_ORBIT_OFFSET.dot(frame.forward);
  const horizontalLength = Math.hypot(localX, localZ);

  controller.bodyOrbit.yaw = Math.atan2(localX, localZ);
  controller.bodyOrbit.pitch = THREE.MathUtils.clamp(
    Math.atan2(localY, horizontalLength),
    BODY_ORBIT_MIN_PITCH,
    BODY_ORBIT_MAX_PITCH,
  );
  controller.bodyOrbit.radius = clampedRadius;
}

function composeBodyOrbitOffset(
  orbit: BodyOrbitState,
  frame: Extract<CameraFrame, { kind: "bodyLocal" }>,
  target: THREE.Vector3,
) {
  const cosPitch = Math.cos(orbit.pitch);
  target
    .copy(frame.right)
    .multiplyScalar(Math.sin(orbit.yaw) * cosPitch * orbit.radius)
    .addScaledVector(frame.up, Math.sin(orbit.pitch) * orbit.radius)
    .addScaledVector(
      frame.forward,
      Math.cos(orbit.yaw) * cosPitch * orbit.radius,
    );
}

function preventCameraBodyIntersection(
  controller: CameraControllerState,
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  preventMoonCameraIntersection: boolean,
) {
  for (const candidate of controller.registry.targets) {
    if (
      candidate.id !== "earth" &&
      candidate.id !== "moon" &&
      candidate.id !== "rocket"
    ) {
      continue;
    }
    if (candidate.id === "moon" && !preventMoonCameraIntersection) {
      continue;
    }

    candidate.getAnchor(CAMERA_COLLISION_CENTER);
    CAMERA_COLLISION_OFFSET.copy(camera.position).sub(CAMERA_COLLISION_CENTER);

    if (CAMERA_COLLISION_OFFSET.lengthSq() <= 1e-9) {
      CAMERA_COLLISION_OFFSET.copy(FALLBACK_VIEW_DIRECTION);
    }

    const minimumDistance =
      candidate.radius + candidate.cameraProfile.collisionClearance;

    if (CAMERA_COLLISION_OFFSET.length() >= minimumDistance) {
      continue;
    }

    TARGET_OFFSET.copy(target).sub(CAMERA_COLLISION_CENTER);
    if (TARGET_OFFSET.lengthSq() > 1e-9) {
      const targetDistance = TARGET_OFFSET.length();
      TARGET_NORMAL.copy(TARGET_OFFSET).normalize();
      CAMERA_OFFSET_FROM_TARGET.copy(camera.position).sub(target);
      TANGENTIAL_OFFSET
        .copy(CAMERA_OFFSET_FROM_TARGET)
        .sub(
          TARGET_NORMAL
            .clone()
            .multiplyScalar(CAMERA_OFFSET_FROM_TARGET.dot(TARGET_NORMAL)),
        );
      const minimumRadialOffset = minimumDistance - targetDistance;

      camera.position
        .copy(target)
        .add(TANGENTIAL_OFFSET)
        .addScaledVector(TARGET_NORMAL, minimumRadialOffset);
      continue;
    }

    camera.position
      .copy(CAMERA_COLLISION_CENTER)
      .add(CAMERA_COLLISION_OFFSET.setLength(minimumDistance));
  }
}
