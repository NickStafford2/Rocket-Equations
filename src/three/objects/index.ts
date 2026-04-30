import * as THREE from "three";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import { createBodyObjects } from "./bodies";
import type { RocketModelVariant } from "./rocket";
import { createRocketObjects } from "./rocket";
import { createPredictionLine, createTrailLine } from "./trail";

export {
  ORBIT_METERS_TO_SCENE_UNITS,
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
};

export type SceneObjects = {
  system: THREE.Group;
  earthGroup: THREE.Group;
  earthRotatingFrame: THREE.Group;
  earth: THREE.Mesh;
  earthLabel: THREE.Sprite;
  satelliteSystem: THREE.Group;
  moon: THREE.Mesh;
  moonLabel: THREE.Sprite;
  rocket: THREE.Group;
  enginePlume: THREE.Mesh;
  thrustDirectionArrow: THREE.ArrowHelper;
  launchLocationArrow: THREE.ArrowHelper;
  launchRing: THREE.Mesh;
  launchTangentArrow: THREE.ArrowHelper;
  launchAimArrow: THREE.ArrowHelper;
  setRocketModelVariant: (variant: RocketModelVariant) => void;
  moonOrbit: THREE.Line;
  trailLine: THREE.Line;
  predictionLine: THREE.Line;
};

export function createSceneObjects(scene: THREE.Scene): SceneObjects {
  const system = new THREE.Group();
  scene.add(system);

  const loader = new THREE.TextureLoader();
  const {
    earthGroup,
    earthRotatingFrame,
    earth,
    earthLabel,
    satelliteSystem,
    moon,
    moonLabel,
    moonOrbit,
  } = createBodyObjects(loader);
  const {
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
    setRocketModelVariant,
  } = createRocketObjects();
  const trailLine = createTrailLine();
  const predictionLine = createPredictionLine();

  system.add(earthGroup);
  system.add(moon);
  system.add(rocket);
  // system.add(launchLocationArrow);
  system.add(launchRing);
  // system.add(launchTangentArrow);
  system.add(launchAimArrow);
  system.add(moonOrbit);
  system.add(trailLine);
  system.add(predictionLine);

  return {
    system,
    earthGroup,
    earthRotatingFrame,
    earth,
    earthLabel,
    satelliteSystem,
    moon,
    moonLabel,
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
    setRocketModelVariant,
    moonOrbit,
    trailLine,
    predictionLine,
  };
}

export function orbitMetersToSceneUnits(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
}
