import * as THREE from "three";

export const CLOUD_COLOR = 0xe6eaee;

export const CLOUD_FADE_START_ALTITUDE_METERS = 12_000;
export const CLOUD_FADE_END_ALTITUDE_METERS = 42_000;

export const CLOUD_TEXTURE_SIZE = 64;

export const CLOUD_HEIGHT_OFFSET_METERS = 3_000;
export const CLOUD_POSITION_METERS: [number, number, number] = [0, 2_800, 0];
export const CLOUD_SIZE_METERS: [number, number, number] = [
  16_000, 5_500, 16_000,
];

export const CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER = 6;
export const CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER = 14;

export const CLOUD_STEPS = 72;
export const CLOUD_THRESHOLD = 0.34;
export const CLOUD_RANGE = 0.24;
export const CLOUD_OPACITY = 0.68;

export const CLOUD_WIND_SPEED_X = 0.0016;
export const CLOUD_WIND_SPEED_Z = 0.0009;

export const SUN_DIRECTION = new THREE.Vector3(0.8, 0.45, 0.25).normalize();
