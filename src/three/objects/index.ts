import * as THREE from "three";
import type { RocketModelVariant } from "./rocket";
import { createRocketObjects } from "./rocket";
import { createPredictionLine, createTrailLine } from "./trail";
import { createEarthObjects } from "./earth/earth";
// import { createReferenceEarthObjects } from "./earthReference/object";
import { createMoonObjects } from "./moon";

export type SceneObjects = {
  system: THREE.Group;
  earthGroup: THREE.Group;
  earthRotatingFrame: THREE.Group;
  earth: THREE.LOD;
  earthCloudsFrame: THREE.Group;
  earthAtmosphere: THREE.Mesh;
  earthFresnel: THREE.Mesh;
  // referenceEarthGroup: THREE.Group;
  // referenceEarthRotatingFrame: THREE.Group;
  // referenceEarth: THREE.Mesh;
  // referenceEarthLabel: THREE.Sprite;
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
    earthCloudsFrame,
    earthAtmosphere,
    earthFresnel,
    earthLabel,
    satelliteSystem,
  } = createEarthObjects(loader);
  // const {
  //   referenceEarthGroup,
  //   referenceEarthRotatingFrame,
  //   referenceEarth,
  //   referenceEarthLabel,
  // } = createReferenceEarthObjects(loader);
  const { moon, moonLabel, moonOrbit } = createMoonObjects(loader);
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
  // system.add(referenceEarthGroup);
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
    earthCloudsFrame,
    earthAtmosphere,
    earthFresnel,
    // referenceEarthGroup,
    // referenceEarthRotatingFrame,
    // referenceEarth,
    // referenceEarthLabel,
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
