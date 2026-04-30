import * as THREE from "three";
import { R_EARTH, R_MOON } from "../physics/bodies";
import type { RocketModelVariant } from "./definitions";

const APOLLO_SOYUZ_PROGRESS = 1 / 3;
const LUNAR_MODULE_APPROACH_ALTITUDE_METERS = R_MOON * 2;

export function getRocketModelVariantForState(
  rocketPosition: THREE.Vector3,
  moonPosition: THREE.Vector3,
): RocketModelVariant {
  const altitudeMoon = Math.max(
    rocketPosition.distanceTo(moonPosition) - R_MOON,
    0,
  );

  if (altitudeMoon <= LUNAR_MODULE_APPROACH_ALTITUDE_METERS) {
    return "apollo-lunar-module";
  }

  const altitudeEarth = Math.max(rocketPosition.length() - R_EARTH, 0);
  const totalTransitDistance = Math.max(moonPosition.length() - R_EARTH - R_MOON, 1);
  const progressToMoon = THREE.MathUtils.clamp(
    altitudeEarth / totalTransitDistance,
    0,
    1,
  );

  if (progressToMoon >= APOLLO_SOYUZ_PROGRESS) {
    return "apollo-soyuz";
  }

  return "saturn-v";
}
