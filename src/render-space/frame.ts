import * as THREE from "three";
import {
  EARTH_MOON_DISTANCE,
  R_EARTH,
  R_MOON,
} from "../physics/bodies";

export type RenderSpaceAnchor = "earth" | "moon";
export type RenderSpaceMode = "earth-local" | "moon-local" | "deep-space";
export type RenderSpacePolicy = "focus-position";
export type RenderSpaceProjection =
  | "body-surface-scaled"
  | "origin-rebased-linear";

export type RenderSpaceContext = {
  mode: RenderSpaceMode;
  policy: RenderSpacePolicy;
  projection: RenderSpaceProjection;
  anchor: RenderSpaceAnchor;
  originMeters: THREE.Vector3;
  focusPositionMeters: THREE.Vector3;
  moonPositionMeters: THREE.Vector3 | null;
};

const EARTH_CENTER_METERS = new THREE.Vector3();

const EARTH_LOCAL_MAX_ALTITUDE_METERS = R_EARTH * 12;
const MOON_LOCAL_MAX_ALTITUDE_METERS = EARTH_MOON_DISTANCE * 0.08;

export function createRenderSpaceContext({
  focusPositionMeters,
  moonPositionMeters,
}: {
  focusPositionMeters: THREE.Vector3;
  moonPositionMeters: THREE.Vector3 | null;
}): RenderSpaceContext {
  const nextMoonPosition = moonPositionMeters?.clone() ?? null;
  const nextFocusPosition = focusPositionMeters.clone();
  const mode = selectRenderSpaceMode(nextFocusPosition, nextMoonPosition);
  const anchor = selectRenderSpaceAnchor(
    mode,
    nextFocusPosition,
    nextMoonPosition,
  );
  const projection = selectRenderSpaceProjection(mode);

  return {
    mode,
    policy: "focus-position",
    projection,
    anchor,
    originMeters: getRenderOriginMeters({
      mode,
      anchor,
      focusPositionMeters: nextFocusPosition,
      moonPositionMeters: nextMoonPosition,
    }),
    focusPositionMeters: nextFocusPosition,
    moonPositionMeters: nextMoonPosition,
  };
}

export function selectRenderSpaceMode(
  focusPositionMeters: THREE.Vector3,
  moonPositionMeters: THREE.Vector3 | null,
): RenderSpaceMode {
  if (!moonPositionMeters) {
    return "earth-local";
  }

  const altitudeEarth = focusPositionMeters.length() - R_EARTH;
  const altitudeMoon = focusPositionMeters.distanceTo(moonPositionMeters) - R_MOON;

  if (altitudeEarth <= EARTH_LOCAL_MAX_ALTITUDE_METERS) {
    return "earth-local";
  }

  if (altitudeMoon <= MOON_LOCAL_MAX_ALTITUDE_METERS) {
    return "moon-local";
  }

  return "deep-space";
}

export function selectRenderSpaceAnchor(
  mode: RenderSpaceMode,
  focusPositionMeters: THREE.Vector3,
  moonPositionMeters: THREE.Vector3 | null,
): RenderSpaceAnchor {
  if (mode === "earth-local" || !moonPositionMeters) {
    return "earth";
  }

  if (mode === "moon-local") {
    return "moon";
  }

  const altitudeEarth = focusPositionMeters.length() - R_EARTH;
  const altitudeMoon = focusPositionMeters.distanceTo(moonPositionMeters) - R_MOON;
  return altitudeMoon < altitudeEarth ? "moon" : "earth";
}

export function selectRenderSpaceProjection(
  mode: RenderSpaceMode,
): RenderSpaceProjection {
  return mode === "deep-space"
    ? "origin-rebased-linear"
    : "body-surface-scaled";
}

function getRenderOriginMeters({
  mode,
  anchor,
  focusPositionMeters,
  moonPositionMeters,
}: {
  mode: RenderSpaceMode;
  anchor: RenderSpaceAnchor;
  focusPositionMeters: THREE.Vector3;
  moonPositionMeters: THREE.Vector3 | null;
}): THREE.Vector3 {
  if (mode === "deep-space") {
    return focusPositionMeters.clone();
  }

  if (anchor === "moon" && moonPositionMeters) {
    return moonPositionMeters.clone();
  }

  return EARTH_CENTER_METERS.clone();
}
