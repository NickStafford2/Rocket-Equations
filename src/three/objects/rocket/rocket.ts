import * as THREE from "three";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { ROCKET_VISUAL_METERS_TO_SCENE_UNITS } from "./rocket-models";
import { createRocketVisual } from "./rocket-visual";
import { createEnginePlume } from "./engine-plume"; // Import the new plume function
import { createDebugRocketBody } from "./debug-rocket-body";

export type {
  RocketModelDefinition,
  RocketModelVariant,
} from "./rocket-models";

const SHOW_DEBUG_CYLINDER = false;

export function createRocketObjects() {
  const rocket = new THREE.Group();
  rocket.userData.focusLabel = "Rocket";
  const fallbackBodyLength = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 5.5;
  rocket.userData.focusRadius = fallbackBodyLength * 0.9;
  rocket.userData.followMinDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 22;
  rocket.userData.followDefaultDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 46;
  rocket.userData.followMaxDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 72;

  // Create the improved engine plume
  const enginePlume = createEnginePlume();
  enginePlume.rotation.z = Math.PI;
  enginePlume.position.y =
    -fallbackBodyLength / 2 - REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.25;
  enginePlume.userData.baseScale = 1;
  enginePlume.visible = false; // Initially set to invisible; toggle visibility later
  rocket.add(enginePlume);

  if (SHOW_DEBUG_CYLINDER) {
    rocket.add(createDebugRocketBody(fallbackBodyLength));
  }

  const rocketVisual = createRocketVisual({
    onLoaded: ({ definition, size: scaledSize }) => {
      rocket.userData.focusRadius = Math.max(
        scaledSize.y * 0.45,
        scaledSize.x * 0.6,
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.5,
      );
      enginePlume.position.set(
        definition.nozzleLocalOffsetMeters.x *
          ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
        definition.nozzleLocalOffsetMeters.y *
          ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
        definition.nozzleLocalOffsetMeters.z *
          ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
      );
      enginePlume.userData.baseScale = definition.plumeVisualScaleMultiplier;
    },
  });
  rocket.add(rocketVisual.root);

  const thrustDirectionArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(),
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 10,
    0x7dffb2,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.8,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.4,
  );

  const launchLocationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
    0xf472b6,
    6,
    3,
  );

  const launchRing = new THREE.Mesh(
    new THREE.TorusGeometry(
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 3.4,
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.16,
      12,
      42,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.9,
    }),
  );
  launchRing.position.set(
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.4,
    0,
    0,
  );

  const launchTangentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(
      EARTH_RENDER_RADIUS_SCENE_UNITS +
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
      0,
      0,
    ),
    16,
    0x000,
    4,
    2,
  );

  const launchAimArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(
      EARTH_RENDER_RADIUS_SCENE_UNITS +
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
      0,
      0,
    ),
    18,
    0xff8d5c,
    5,
    2.5,
  );

  return {
    rocket,
    enginePlume, // Now the engine plume is properly added
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
    setRocketModelVariant: rocketVisual.setVariant,
  };
}
