import * as THREE from "three";
import { R_EARTH, R_MOON } from "../physics/bodies";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  ORBIT_METERS_TO_SCENE_UNITS,
} from "../three/objects/constants";

export type RenderSpaceAnchor = "earth" | "moon";

export type RenderSpaceContext = {
  mode: "adaptive-body-surface";
  moonPositionMeters: THREE.Vector3 | null;
};

type BodyRenderFrame = {
  centerMeters: THREE.Vector3;
  radiusMeters: number;
  renderRadiusSceneUnits: number;
};

const EARTH_CENTER_METERS = new THREE.Vector3();
const BODY_RELATIVE_POSITION = new THREE.Vector3();
const SCENE_POSITION = new THREE.Vector3();

export function createRenderSpaceContext({
  moonPositionMeters,
}: {
  moonPositionMeters: THREE.Vector3 | null;
}): RenderSpaceContext {
  return {
    mode: "adaptive-body-surface",
    moonPositionMeters: moonPositionMeters?.clone() ?? null,
  };
}

export function getRenderSpaceAnchorForPosition(
  renderSpace: RenderSpaceContext,
  positionMeters: THREE.Vector3,
): RenderSpaceAnchor {
  if (!renderSpace.moonPositionMeters) {
    return "earth";
  }

  const altitudeEarth = positionMeters.length() - R_EARTH;
  const altitudeMoon =
    positionMeters.distanceTo(renderSpace.moonPositionMeters) - R_MOON;

  return altitudeMoon < altitudeEarth ? "moon" : "earth";
}

export function copyRenderPositionFromMeters(
  target: THREE.Vector3,
  renderSpace: RenderSpaceContext,
  positionMeters: THREE.Vector3,
): THREE.Vector3 {
  return copyBodySurfaceScaledPosition(
    target,
    positionMeters,
    getBodyRenderFrame(renderSpace, positionMeters),
  );
}

export function writeRenderPositionToArray(
  target: Float32Array,
  offset: number,
  renderSpace: RenderSpaceContext,
  positionMeters: THREE.Vector3,
): void {
  copyRenderPositionFromMeters(SCENE_POSITION, renderSpace, positionMeters);
  target[offset] = SCENE_POSITION.x;
  target[offset + 1] = SCENE_POSITION.y;
  target[offset + 2] = SCENE_POSITION.z;
}

function getBodyRenderFrame(
  renderSpace: RenderSpaceContext,
  positionMeters: THREE.Vector3,
): BodyRenderFrame {
  const anchor = getRenderSpaceAnchorForPosition(renderSpace, positionMeters);

  if (anchor === "moon" && renderSpace.moonPositionMeters) {
    return {
      centerMeters: renderSpace.moonPositionMeters,
      radiusMeters: R_MOON,
      renderRadiusSceneUnits: MOON_RENDER_RADIUS_SCENE_UNITS,
    };
  }

  return {
    centerMeters: EARTH_CENTER_METERS,
    radiusMeters: R_EARTH,
    renderRadiusSceneUnits: EARTH_RENDER_RADIUS_SCENE_UNITS,
  };
}

function copyBodySurfaceScaledPosition(
  target: THREE.Vector3,
  worldPositionMeters: THREE.Vector3,
  bodyFrame: BodyRenderFrame,
): THREE.Vector3 {
  BODY_RELATIVE_POSITION.copy(worldPositionMeters).sub(bodyFrame.centerMeters);
  const bodyDistanceMeters = Math.max(BODY_RELATIVE_POSITION.length(), 1e-6);
  const altitudeMeters = Math.max(bodyDistanceMeters - bodyFrame.radiusMeters, 0);
  const sceneDistance =
    bodyFrame.renderRadiusSceneUnits + altitudeMeters * ORBIT_METERS_TO_SCENE_UNITS;

  target.copy(bodyFrame.centerMeters).multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  target.addScaledVector(BODY_RELATIVE_POSITION, sceneDistance / bodyDistanceMeters);
  return target;
}
