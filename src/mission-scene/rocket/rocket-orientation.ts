import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../../three/objects/constants";
import type { ThreeSceneBundle } from "../../three/scene";

const ROCKET_WORLD_UP = new THREE.Vector3(0, 1, 0);
const ROCKET_WORLD_RIGHT = new THREE.Vector3();
const ROCKET_ORIENTATION_MATRIX = new THREE.Matrix4();
const DEFAULT_HEADING = new THREE.Vector3(0, 1, 0);

export function syncRocketOrientation(
  bundle: ThreeSceneBundle,
  headingSource: THREE.Vector3,
) {
  const { objects } = bundle;

  const hasHeading = headingSource.lengthSq() > 1e-6;
  const heading = hasHeading
    ? headingSource.clone().normalize()
    : DEFAULT_HEADING;

  if (!hasHeading) {
    return;
  }

  objects.thrustDirectionArrow.setDirection(heading);
  objects.thrustDirectionArrow.setLength(
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 11,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.8,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.4,
  );

  ROCKET_WORLD_RIGHT.crossVectors(heading, ROCKET_WORLD_UP);

  if (ROCKET_WORLD_RIGHT.lengthSq() <= 1e-9) {
    ROCKET_WORLD_RIGHT.set(1, 0, 0);
  } else {
    ROCKET_WORLD_RIGHT.normalize();
  }

  ROCKET_ORIENTATION_MATRIX.makeBasis(
    ROCKET_WORLD_RIGHT,
    heading,
    ROCKET_WORLD_UP,
  );

  objects.rocket.quaternion.setFromRotationMatrix(ROCKET_ORIENTATION_MATRIX);
}
