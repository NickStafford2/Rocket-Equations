import * as THREE from "three";
import { getRocketModelVariantForState } from "../rocket/variant";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../three/objects/constants";
import type { RocketModelVariant } from "../three/objects/rocket/rocket";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";
import { updateSmokeTrail } from "../three/objects/rocket/smoke-trail"; // Import the update function for the smoke trail

const ROCKET_WORLD_UP = new THREE.Vector3(0, 1, 0);
const ROCKET_WORLD_RIGHT = new THREE.Vector3();
const ROCKET_ORIENTATION_MATRIX = new THREE.Matrix4();
const SMOKE_WORLD_POSITION = new THREE.Vector3();
const DEFAULT_HEADING = new THREE.Vector3(0, 1, 0);

export function syncRocketVisuals(
  bundle: ThreeSceneBundle,
  frame: FrameState,
  {
    thrusting,
    showThrustDirectionArrow,
  }: {
    thrusting: boolean;
    showThrustDirectionArrow: boolean;
  },
) {
  const { objects } = bundle;
  const rocketModelVariant = getRocketModelVariant(frame);

  objects.setRocketModelVariant(rocketModelVariant);
  bundle.orientationIndicator.setRocketModelVariant(rocketModelVariant);

  objects.thrustDirectionArrow.position.copy(objects.rocket.position);
  objects.thrustDirectionArrow.visible = showThrustDirectionArrow;
  objects.enginePlume.visible = frame.stagedLaunchPreviewVisible
    ? false
    : thrusting;

  if (objects.enginePlume.visible) {
    const baseScale = Number(objects.enginePlume.userData.baseScale ?? 1);
    const plumeVisualScaleMultiplier =
      (0.9 + Math.abs(Math.sin(frame.simState.t * 0.08)) * 0.45) * baseScale;
    objects.enginePlume.scale.setScalar(plumeVisualScaleMultiplier);
  }
  const heading =
    frame.simState.rocket.heading.lengthSq() <= 1e-6
      ? DEFAULT_HEADING
      : frame.simState.rocket.heading.clone().normalize();

  if (frame.simState.rocket.heading.lengthSq() > 1e-6) {
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

  objects.rocket.updateMatrixWorld(true);
  objects.enginePlume.getWorldPosition(SMOKE_WORLD_POSITION);
  objects.smokeTrail.visible = updateSmokeTrail(
    objects.smokeTrail,
    SMOKE_WORLD_POSITION,
    heading,
    thrusting && !frame.stagedLaunchPreviewVisible,
  );
}

function getRocketModelVariant(frame: FrameState): RocketModelVariant {
  return getRocketModelVariantForState(
    frame.simState.rocket.position,
    frame.telemetry.moonPosition,
  );
}
