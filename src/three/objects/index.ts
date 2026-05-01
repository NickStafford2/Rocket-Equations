import * as THREE from "three";
import type { RocketModelVariant } from "./rocket/rocket";
import { createRocketObjects } from "./rocket/rocket";
import { createPredictionLine, createTrailLine } from "./trail";
import { createEarthObjects } from "./earth/earth";
// import { createReferenceEarthObjects } from "./earthReference/object";
import { createMoonObjects } from "./moon";
import { createSmokeTrail } from "./rocket/smoke-trail"; // import your new smoke trail functions

export type SceneObjects = {
  system: THREE.Group;
  earthGroup: THREE.Group;
  earthRotatingFrame: THREE.Group;
  earth: THREE.LOD;
  earthCloudsFrame: THREE.Group;
  earthAtmosphere: THREE.Mesh;
  earthFresnel: THREE.Mesh;
  earthLabel: THREE.Sprite;
  satelliteSystem: THREE.Group;
  moon: THREE.Mesh;
  moonLabel: THREE.Sprite;
  rocket: THREE.Group;
  enginePlume: THREE.Mesh;
  smokeTrail: THREE.Points;
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

  // Create the smoke trail and add it to the scene
  //
  console.log("calling createSmokeTrail");
  const smokeTrail = createSmokeTrail(); // Create the smoke trail
  system.add(smokeTrail);

  // Add other objects
  system.add(earthGroup);
  system.add(moon);
  system.add(rocket);
  system.add(launchRing);
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
    earthLabel,
    satelliteSystem,
    moon,
    moonLabel,
    rocket,
    enginePlume,
    smokeTrail, // Include the smoke trail in the returned scene objects
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
