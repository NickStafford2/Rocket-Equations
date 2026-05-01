import * as THREE from "three";
import {
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { ROCKET_VISUAL_METERS_TO_SCENE_UNITS } from "./rocket-models";
import { createRocketVisual } from "./rocket-visual";
import { createEnginePlume } from "./engine-plume"; // Import the new plume function
import { createDebugRocketBody } from "./debug-rocket-body";
import {
  launchIndicators,
} from "./launch-indicators";

export type {
  RocketModelDefinition,
  RocketModelVariant,
} from "./rocket-models";

const SHOW_DEBUG_CYLINDER = false;
const SHOW_ROCKET_DEBUG_MARKER = false;
const ROCKET_DEBUG_AXES_SIZE =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;
const ROCKET_DEBUG_SPHERE_RADIUS =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.6;

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
  if (SHOW_ROCKET_DEBUG_MARKER) {
    rocket.add(createRocketDebugMarker());
  }

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

  return {
    rocket,
    enginePlume,
    ...launchIndicators,
    setRocketModelVariant: rocketVisual.setVariant,
  };
}

function createRocketDebugMarker(): THREE.Group {
  const marker = new THREE.Group();

  const axesHelper = new THREE.AxesHelper(ROCKET_DEBUG_AXES_SIZE);
  axesHelper.renderOrder = 999;
  const materials = Array.isArray(axesHelper.material)
    ? axesHelper.material
    : [axesHelper.material];
  for (const material of materials) {
    material.depthTest = false;
    material.depthWrite = false;
    material.transparent = true;
    material.opacity = 0.95;
  }
  marker.add(axesHelper);

  const originMarker = new THREE.Mesh(
    new THREE.SphereGeometry(ROCKET_DEBUG_SPHERE_RADIUS, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.95,
    }),
  );
  originMarker.renderOrder = 1000;
  marker.add(originMarker);

  return marker;
}
