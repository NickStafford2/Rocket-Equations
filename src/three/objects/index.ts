import * as THREE from "three";
import { DISTANCE_SCALE, EARTH_DRAW_RADIUS, MOON_DRAW_RADIUS, ROCKET_DRAW_RADIUS } from "./constants";
import { createBodyObjects } from "./bodies";
import { createRocketObjects } from "./rocket";
import { createTrailLine } from "./trail";

export {
  DISTANCE_SCALE,
  EARTH_DRAW_RADIUS,
  MOON_DRAW_RADIUS,
  ROCKET_DRAW_RADIUS,
};

export type SceneObjects = {
  system: THREE.Group;
  earthGroup: THREE.Group;
  earth: THREE.Mesh;
  earthLabel: THREE.Sprite;
  moon: THREE.Mesh;
  moonLabel: THREE.Sprite;
  rocket: THREE.Group;
  enginePlume: THREE.Mesh;
  thrustDirectionArrow: THREE.ArrowHelper;
  launchLocationArrow: THREE.ArrowHelper;
  launchRing: THREE.Mesh;
  launchTangentArrow: THREE.ArrowHelper;
  launchAimArrow: THREE.ArrowHelper;
  moonOrbit: THREE.Line;
  trailLine: THREE.Line;
};

export function createSceneObjects(scene: THREE.Scene): SceneObjects {
  const system = new THREE.Group();
  scene.add(system);

  const loader = new THREE.TextureLoader();
  const { earthGroup, earth, earthLabel, moon, moonLabel, moonOrbit } =
    createBodyObjects(loader);
  const {
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
  } = createRocketObjects();
  const trailLine = createTrailLine();

  system.add(earthGroup);
  system.add(moon);
  system.add(rocket);
  system.add(launchLocationArrow);
  system.add(launchRing);
  system.add(launchTangentArrow);
  system.add(launchAimArrow);
  system.add(moonOrbit);
  system.add(trailLine);

  return {
    system,
    earthGroup,
    earth,
    earthLabel,
    moon,
    moonLabel,
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
    moonOrbit,
    trailLine,
  };
}

export function metersToScene(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().multiplyScalar(DISTANCE_SCALE);
}
