// rocket.ts

import * as THREE from "three";
import { createRocketVisual } from "./rocket-visual";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";
import { createEnginePlume } from "./engine-plume";
import { createDebugRocketBody } from "./debug-rocket-body";
import {
  createThrustDirectionArrow,
  createLaunchLocationArrow,
  createLaunchRing,
  createLaunchTangentArrow,
  createLaunchAimArrow,
} from "./launch-indicators"; // Launch indicator creation

const SHOW_DEBUG_CYLINDER = false;

export function createRocketObjects() {
  const rocket = new THREE.Group();
  rocket.userData.focusLabel = "Rocket";
  const fallbackBodyLength = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 5.5;

  // Set up user data for distances
  rocket.userData.focusRadius = fallbackBodyLength * 0.9;
  rocket.userData.followMinDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 22;
  rocket.userData.followDefaultDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 46;
  rocket.userData.followMaxDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 72;

  // Add engine plume
  const enginePlume = createEnginePlume();
  rocket.add(enginePlume);

  // Add debug body if needed
  if (SHOW_DEBUG_CYLINDER) {
    rocket.add(createDebugRocketBody(fallbackBodyLength));
  }

  // Create and add the rocket visual (3D model of the rocket)
  const rocketVisual = createRocketVisual({
    onLoaded: ({ definition, size: scaledSize }) => {
      rocket.userData.focusRadius = Math.max(
        scaledSize.y * 0.45,
        scaledSize.x * 0.6,
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.5,
      );
      enginePlume.position.set(
        definition.nozzleLocalOffsetMeters.x *
          REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
        definition.nozzleLocalOffsetMeters.y *
          REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
        definition.nozzleLocalOffsetMeters.z *
          REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
      );
      enginePlume.userData.baseScale = definition.plumeVisualScaleMultiplier;
    },
  });
  rocket.add(rocketVisual.root);

  // Add arrows and launch indicators
  const thrustDirectionArrow = createThrustDirectionArrow();
  const launchLocationArrow = createLaunchLocationArrow();
  const launchRing = createLaunchRing();
  const launchTangentArrow = createLaunchTangentArrow();
  const launchAimArrow = createLaunchAimArrow();

  // Return the assembled rocket and its components
  return {
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
    setRocketModelVariant: rocketVisual.setVariant,
  };
}
