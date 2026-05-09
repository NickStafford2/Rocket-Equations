import type { RocketModelVariant } from "../../../rocket/definitions";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";

export type RocketCameraProfile = {
  focusRadius: number;
  cameraCollisionClearance: number;
  followMinDistance: number;
  followDefaultDistance: number;
  followMaxDistance: number;
};

type RocketCameraProfileTuning = {
  minFocusRadius: number;
  collisionClearanceMultiplier: number;
  minCollisionClearance: number;
  followMinDistanceMultiplier: number;
  minFollowMinDistance: number;
  followDefaultDistanceMultiplier: number;
  minFollowDefaultDistance: number;
  followMaxDistanceMultiplier: number;
  minFollowMaxDistance: number;
};

const DEFAULT_TUNING: RocketCameraProfileTuning = {
  minFocusRadius: REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.8,
  collisionClearanceMultiplier: 0.14,
  minCollisionClearance: REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.18,
  followMinDistanceMultiplier: 1.12,
  minFollowMinDistance: REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 3.2,
  followDefaultDistanceMultiplier: 3.8,
  minFollowDefaultDistance: REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 8.5,
  followMaxDistanceMultiplier: 18,
  minFollowMaxDistance: REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 38,
};

const ROCKET_CAMERA_PROFILE_BY_VARIANT: Record<
  RocketModelVariant,
  RocketCameraProfileTuning
> = {
  "saturn-v": DEFAULT_TUNING,
  "apollo-soyuz": DEFAULT_TUNING,
  "apollo-lunar-module": DEFAULT_TUNING,
};

export function getRocketCameraProfileForLoadedModel(
  variant: RocketModelVariant,
  scaledSize: { x: number; y: number },
): RocketCameraProfile {
  const tuning = ROCKET_CAMERA_PROFILE_BY_VARIANT[variant];
  const focusRadius = Math.max(
    scaledSize.y * 0.45,
    scaledSize.x * 0.6,
    tuning.minFocusRadius,
  );

  return {
    focusRadius,
    cameraCollisionClearance: Math.max(
      focusRadius * tuning.collisionClearanceMultiplier,
      tuning.minCollisionClearance,
    ),
    followMinDistance: Math.max(
      focusRadius * tuning.followMinDistanceMultiplier,
      tuning.minFollowMinDistance,
    ),
    followDefaultDistance: Math.max(
      focusRadius * tuning.followDefaultDistanceMultiplier,
      tuning.minFollowDefaultDistance,
    ),
    followMaxDistance: Math.max(
      focusRadius * tuning.followMaxDistanceMultiplier,
      tuning.minFollowMaxDistance,
    ),
  };
}

export function applyRocketCameraProfile(
  target: { userData: Record<string, unknown> },
  profile: RocketCameraProfile,
) {
  target.userData.focusRadius = profile.focusRadius;
  target.userData.cameraCollisionClearance = profile.cameraCollisionClearance;
  target.userData.followMinDistance = profile.followMinDistance;
  target.userData.followDefaultDistance = profile.followDefaultDistance;
  target.userData.followMaxDistance = profile.followMaxDistance;
}
