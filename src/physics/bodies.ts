import * as THREE from "three";

export const G = 6.6743e-11;

export const M_EARTH = 5.972e24;
export const R_EARTH = 6.371e6;

export const M_MOON = 7.34767309e22;
export const R_MOON = 1.7374e6;

export const EARTH_MOON_DISTANCE = 384_400_000.0;
export const MOON_ORBIT_PERIOD = 27.321661 * 24 * 3600;
export const MOON_ANGULAR_SPEED = (2 * Math.PI) / MOON_ORBIT_PERIOD;

export const DEFAULT_ALTITUDE = 0.0;
export const DEFAULT_SPEED = 11_550.0;
export const DEFAULT_ANGLE_DEG = 90.0;
export const DEFAULT_LAUNCH_AZIMUTH_DEG = 49.0;
export const DEFAULT_DT = 400.0;

export type BodyState = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
};

export type ImpactTarget = "earth" | "moon" | null;

export type SimulationState = {
  t: number;
  rocket: BodyState;
  hit: ImpactTarget;
};

export type LaunchFrame = {
  position: THREE.Vector3;
  radialHat: THREE.Vector3;
  tangentHat: THREE.Vector3;
};

export function moonPositionMeters(t: number): THREE.Vector3 {
  const theta = MOON_ANGULAR_SPEED * t;
  return new THREE.Vector3(
    EARTH_MOON_DISTANCE * Math.cos(theta),
    0,
    EARTH_MOON_DISTANCE * Math.sin(theta),
  );
}

export function makeInitialRocketState(
  speed: number,
  angleDeg: number,
  launchAzimuthDeg: number = DEFAULT_LAUNCH_AZIMUTH_DEG,
  altitude: number = DEFAULT_ALTITUDE,
): BodyState {
  const { position, radialHat, tangentHat } = getLaunchFrame(
    altitude,
    launchAzimuthDeg,
  );
  const clampedAngleDeg = THREE.MathUtils.clamp(angleDeg, 0, 180);
  const angleRad = THREE.MathUtils.degToRad(clampedAngleDeg);
  const direction = tangentHat
    .clone()
    .multiplyScalar(Math.cos(angleRad))
    .add(radialHat.clone().multiplyScalar(Math.sin(angleRad)))
    .normalize();

  return {
    position,
    velocity: direction.multiplyScalar(speed),
    acceleration: new THREE.Vector3(),
  };
}

export function getLaunchFrame(
  altitude: number = DEFAULT_ALTITUDE,
  launchAzimuthDeg: number = DEFAULT_LAUNCH_AZIMUTH_DEG,
): LaunchFrame {
  const azimuthRad = THREE.MathUtils.degToRad(launchAzimuthDeg);
  const position = new THREE.Vector3(
    (R_EARTH + altitude) * Math.cos(azimuthRad),
    0,
    (R_EARTH + altitude) * Math.sin(azimuthRad),
  );
  const radialHat = position.clone().normalize();
  const tangentHat = new THREE.Vector3(
    -Math.sin(azimuthRad),
    0,
    Math.cos(azimuthRad),
  );

  return {
    position,
    radialHat,
    tangentHat,
  };
}

export function makeInitialSimulationState(
  speed: number = DEFAULT_SPEED,
  angleDeg: number = DEFAULT_ANGLE_DEG,
  launchAzimuthDeg: number = DEFAULT_LAUNCH_AZIMUTH_DEG,
): SimulationState {
  return {
    t: 0,
    rocket: makeInitialRocketState(speed, angleDeg, launchAzimuthDeg),
    hit: null,
  };
}
