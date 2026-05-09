import * as THREE from "three";
import { EARTH_ROTATION_PERIOD, G } from "../../../../physics/bodies";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../../constants";
import { SUN_POSITION } from "../../../sun";
import {
  geosynchronousOrbitRadiusMeters,
  orbitalRadiusMeters,
  SATELLITE_TARGET_SIZE_SCENE_UNITS,
  type SatelliteDefinition,
} from "./catalog";

const ROTATION_X = new THREE.Matrix4();
const ROTATION_Y = new THREE.Matrix4();
const RANDOM_FORWARD = new THREE.Vector3(0, 0, 1);
const RANDOM_TARGET = new THREE.Vector3();

const SUN_DIRECTION = SUN_POSITION.clone().normalize();
const ANTI_SUN_DIRECTION = SUN_DIRECTION.clone().multiplyScalar(-1);

export type SatelliteSystemBody = {
  radiusMeters: number;
  renderRadiusSceneUnits: number;
  primaryMassKg: number;
  defaultOrbitPeriodSeconds?: number;
  targetSizeSceneUnits?: number;
};

export type CompiledSatelliteOrbit = {
  definition: SatelliteDefinition;
  radiusSceneUnits: number;
  phaseRad: number;
  angularSpeed: number;
  direction: 1 | -1;
  orbitRotation: THREE.Matrix4;
  fixedDirection?: THREE.Vector3;
};

export function compileSatelliteOrbit(
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
): CompiledSatelliteOrbit {
  const { orbit } = definition;

  if (orbit.type === "earth-l2") {
    return {
      definition,
      radiusSceneUnits: orbitalRadiusMetersToSceneUnits(
        orbit.distanceMeters ?? 1_500_000_000,
        body,
      ),
      phaseRad: 0,
      angularSpeed: 0,
      direction: 1,
      orbitRotation: new THREE.Matrix4(),
      fixedDirection: ANTI_SUN_DIRECTION.clone(),
    };
  }

  if (orbit.type === "deep-space") {
    const distanceMeters =
      orbit.distanceMeters ??
      geosynchronousOrbitRadiusMeters(
        body.primaryMassKg,
        body.defaultOrbitPeriodSeconds ?? EARTH_ROTATION_PERIOD,
      );

    const inclinationRad = THREE.MathUtils.degToRad(orbit.inclinationDeg ?? 0);
    const longitudeRad = THREE.MathUtils.degToRad(orbit.longitudeDeg ?? 0);

    return {
      definition,
      radiusSceneUnits: orbitalRadiusMetersToSceneUnits(distanceMeters, body),
      phaseRad: THREE.MathUtils.degToRad(orbit.phaseDeg ?? 0),
      angularSpeed:
        orbit.driftPeriodSeconds && orbit.driftPeriodSeconds > 0
          ? (2 * Math.PI) / orbit.driftPeriodSeconds
          : 0,
      direction: orbit.direction ?? 1,
      orbitRotation: createOrbitRotationMatrix(inclinationRad, longitudeRad),
    };
  }

  const orbitRadiusMeters = orbitalRadiusMeters(
    orbit,
    body.radiusMeters,
    body.primaryMassKg,
    body.defaultOrbitPeriodSeconds,
  );

  const inclinationRad = THREE.MathUtils.degToRad(orbit.inclinationDeg ?? 0);
  const ascendingNodeRad = THREE.MathUtils.degToRad(
    orbit.ascendingNodeDeg ?? 0,
  );

  const periodSeconds =
    orbit.type === "geosynchronous"
      ? (orbit.periodSeconds ??
        body.defaultOrbitPeriodSeconds ??
        EARTH_ROTATION_PERIOD)
      : (orbit.periodSeconds ??
        2 *
          Math.PI *
          Math.sqrt(Math.pow(orbitRadiusMeters, 3) / (G * body.primaryMassKg)));

  const phaseBaseDeg =
    orbit.type === "geosynchronous"
      ? (orbit.longitudeDeg ?? 0)
      : (orbit.phaseDeg ?? 0);

  return {
    definition,
    radiusSceneUnits: orbitalRadiusMetersToSceneUnits(orbitRadiusMeters, body),
    phaseRad: THREE.MathUtils.degToRad(phaseBaseDeg),
    angularSpeed: (2 * Math.PI) / periodSeconds,
    direction: orbit.direction ?? 1,
    orbitRotation: createOrbitRotationMatrix(inclinationRad, ascendingNodeRad),
  };
}

export function resolveCompiledSatellitePosition(
  compiledOrbit: CompiledSatelliteOrbit,
  timeSeconds: number,
  target: THREE.Vector3,
): THREE.Vector3 {
  if (compiledOrbit.fixedDirection) {
    return target
      .copy(compiledOrbit.fixedDirection)
      .multiplyScalar(compiledOrbit.radiusSceneUnits);
  }

  const angle =
    compiledOrbit.phaseRad +
    compiledOrbit.direction * compiledOrbit.angularSpeed * timeSeconds;

  target.set(
    compiledOrbit.radiusSceneUnits * Math.cos(angle),
    0,
    compiledOrbit.radiusSceneUnits * Math.sin(angle),
  );

  return target.applyMatrix4(compiledOrbit.orbitRotation);
}

export function getSatelliteTargetSize(
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
): number {
  return (
    definition.targetSizeSceneUnits ??
    body.targetSizeSceneUnits ??
    SATELLITE_TARGET_SIZE_SCENE_UNITS
  );
}

export function createDeterministicSatelliteQuaternion(id: string) {
  const baseSeed = hashString(id);
  const x = pseudoRandomSigned(baseSeed + 1);
  const y = pseudoRandomSigned(baseSeed + 2);
  const z = pseudoRandomSigned(baseSeed + 3);
  const roll = pseudoRandom01(baseSeed + 4) * Math.PI * 2;
  const direction = RANDOM_TARGET.set(x, y, z).normalize();

  if (direction.lengthSq() < 1e-6) {
    direction.set(0, 1, 0);
  }

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    RANDOM_FORWARD,
    direction,
  );

  return quaternion.multiply(
    new THREE.Quaternion().setFromAxisAngle(direction, roll),
  );
}

function createOrbitRotationMatrix(
  inclinationRad: number,
  ascendingNodeOrLongitudeRad: number,
): THREE.Matrix4 {
  ROTATION_X.makeRotationX(inclinationRad);
  ROTATION_Y.makeRotationY(ascendingNodeOrLongitudeRad);

  return new THREE.Matrix4().multiplyMatrices(ROTATION_Y, ROTATION_X);
}

function orbitalRadiusMetersToSceneUnits(
  orbitalRadiusMetersValue: number,
  body: SatelliteSystemBody,
) {
  return (
    body.renderRadiusSceneUnits +
    (orbitalRadiusMetersValue - body.radiusMeters) * ORBIT_METERS_TO_SCENE_UNITS
  );
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pseudoRandom01(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function pseudoRandomSigned(seed: number) {
  return pseudoRandom01(seed) * 2 - 1;
}
