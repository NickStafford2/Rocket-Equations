import * as THREE from "three";
import {
  EARTH_MOON_DISTANCE,
  R_EARTH,
  R_MOON,
} from "../physics/bodies";

export type RenderSpaceAnchor = "earth" | "moon";
export type RenderSpaceMode = "earth-local" | "moon-local" | "deep-space";
export type RenderSpacePolicy = "focus-position";

export type RenderSpaceContext = {
  mode: RenderSpaceMode;
  policy: RenderSpacePolicy;
  anchor: RenderSpaceAnchor;
  focusPositionMeters: THREE.Vector3;
  moonPositionMeters: THREE.Vector3 | null;
};

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

  return {
    mode,
    policy: "focus-position",
    anchor: selectRenderSpaceAnchor(mode, nextFocusPosition, nextMoonPosition),
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
