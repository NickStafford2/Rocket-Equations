import * as THREE from "three";
import type { RocketModelVariant } from "./rocket/rocket";
import { createRocketObjects } from "./rocket/rocket";
import { createPredictionLine, createTrailLine } from "./trail";
import { createEarthObjects } from "./earth/earth";
import type { EarthRenderers } from "./earth/earth";
import type { LaunchCloudField } from "./earth/launch-clouds";
// import { createReferenceEarthObjects } from "./earthReference/object";
import { createMoonObjects } from "./moon/moon";
import { createSmokeTrail } from "./rocket/smoke-trail";

export type SceneObjects = {
  system: THREE.Group;
  earthGroup: THREE.Group;
  earthRotatingFrame: THREE.Group;
  earth: THREE.LOD;
  earthCloudsFrame: THREE.Group;
  earthAtmosphere: THREE.Mesh;
  earthFresnel: THREE.Mesh;
  earthLabel: THREE.Sprite;
  earthRenderers: EarthRenderers;
  earthLaunchSite: THREE.Group;
  launchCloudField: LaunchCloudField;
  satelliteSystem: THREE.Group;
  moon: THREE.Group;
  moonLabel: THREE.Sprite;
  moonSatelliteSystem: THREE.Group;
  moonLandingSiteArrow: THREE.ArrowHelper;
  rocket: THREE.Group;
  enginePlume: THREE.Mesh;
  smokeTrail: THREE.Group;
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
    renderers: earthRenderers,
    satelliteSystem,
  } = createEarthObjects(loader);
  const earthLaunchSite = earthRenderers.nearAtmosphere.launchSite;
  const launchCloudField = earthRenderers.nearAtmosphere.launchCloudField;

  const { moon, moonLabel, moonSatelliteSystem, moonLandingSiteArrow, moonOrbit } =
    createMoonObjects(loader);
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

  const smokeTrail = createSmokeTrail();

  earthRotatingFrame.add(smokeTrail);

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
    earthRenderers,
    earthLaunchSite,
    launchCloudField,
    satelliteSystem,
    moon,
    moonLabel,
    moonSatelliteSystem,
    moonLandingSiteArrow,
    rocket,
    enginePlume,
    smokeTrail,
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
