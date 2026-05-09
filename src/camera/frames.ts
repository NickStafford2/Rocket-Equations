import * as THREE from "three";
import type { CameraTarget, CameraTargetRegistry } from "./targets";

export type CameraFrame =
  | { kind: "inertial" }
  | {
      kind: "bodyLocal";
      body: CameraTarget;
      up: THREE.Vector3;
      right: THREE.Vector3;
      forward: THREE.Vector3;
    };

const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const FOLLOW_POSITION = new THREE.Vector3();
const BODY_POSITION = new THREE.Vector3();
const BODY_UP = new THREE.Vector3();
const BODY_RIGHT = new THREE.Vector3();
const BODY_FORWARD = new THREE.Vector3();
const PROJECTED_AXIS = new THREE.Vector3();

export function resolveReferenceBodyForTarget(
  registry: CameraTargetRegistry,
  followTarget: CameraTarget | null,
): CameraTarget | null {
  if (!followTarget || followTarget.kind !== "vehicle") {
    return null;
  }

  followTarget.getAnchor(FOLLOW_POSITION);

  let nearestBody: CameraTarget | null = null;
  let nearestSurfaceDistance = Number.POSITIVE_INFINITY;

  for (const candidate of registry.targets) {
    if (candidate.kind !== "body") continue;

    candidate.getAnchor(BODY_POSITION);
    const surfaceDistance = Math.max(
      FOLLOW_POSITION.distanceTo(BODY_POSITION) - candidate.radius,
      0,
    );

    if (surfaceDistance < nearestSurfaceDistance) {
      nearestSurfaceDistance = surfaceDistance;
      nearestBody = candidate;
    }
  }

  if (!nearestBody) {
    return null;
  }

  const activationDistance = Math.max(
    nearestBody.radius * 2,
    followTarget.cameraProfile.followMaxDistance * 2.5,
  );

  return nearestSurfaceDistance <= activationDistance ? nearestBody : null;
}

export function createBodyLocalFrame(
  body: CameraTarget,
  followTarget: CameraTarget,
  preferredRight: THREE.Vector3 | null,
): CameraFrame | null {
  body.getAnchor(BODY_POSITION);
  followTarget.getAnchor(FOLLOW_POSITION);
  BODY_UP.copy(FOLLOW_POSITION).sub(BODY_POSITION);

  if (BODY_UP.lengthSq() <= 1e-9) {
    return null;
  }

  BODY_UP.normalize();
  BODY_RIGHT.copy(preferredRight ?? WORLD_FORWARD);
  projectOntoTangentPlane(BODY_RIGHT, BODY_UP);

  if (BODY_RIGHT.lengthSq() <= 1e-9) {
    BODY_RIGHT.copy(WORLD_RIGHT);
    projectOntoTangentPlane(BODY_RIGHT, BODY_UP);
  }

  if (BODY_RIGHT.lengthSq() <= 1e-9) {
    return null;
  }

  BODY_RIGHT.normalize();
  BODY_FORWARD.crossVectors(BODY_RIGHT, BODY_UP).normalize();
  BODY_RIGHT.crossVectors(BODY_UP, BODY_FORWARD).normalize();

  return {
    kind: "bodyLocal",
    body,
    up: BODY_UP.clone(),
    right: BODY_RIGHT.clone(),
    forward: BODY_FORWARD.clone(),
  };
}

function projectOntoTangentPlane(axis: THREE.Vector3, up: THREE.Vector3) {
  PROJECTED_AXIS.copy(up).multiplyScalar(axis.dot(up));
  axis.sub(PROJECTED_AXIS);
}
