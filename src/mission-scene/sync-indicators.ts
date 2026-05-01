import * as THREE from "three";
import { moonVelocityMeters } from "../physics/bodies";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

const INDICATOR_MOON_VELOCITY = new THREE.Vector3();
const INDICATOR_RELATIVE_VELOCITY = new THREE.Vector3();

export function syncOrientationIndicator(
  bundle: ThreeSceneBundle,
  frame: FrameState,
) {
  const { camera, objects, orientationIndicator, relativeVelocityIndicator } =
    bundle;

  orientationIndicator.frame.quaternion.copy(camera.quaternion).invert();
  orientationIndicator.rocket.quaternion.copy(objects.rocket.quaternion);

  relativeVelocityIndicator.frame.quaternion.copy(camera.quaternion).invert();
  INDICATOR_MOON_VELOCITY.copy(moonVelocityMeters(frame.simState.t));
  INDICATOR_RELATIVE_VELOCITY.copy(INDICATOR_MOON_VELOCITY).sub(
    frame.simState.rocket.velocity,
  );
  relativeVelocityIndicator.setValueLabel(
    formatSignedVelocityDelta(
      INDICATOR_MOON_VELOCITY.length() -
        frame.simState.rocket.velocity.length(),
    ),
  );

  if (INDICATOR_RELATIVE_VELOCITY.lengthSq() <= 1e-6) {
    relativeVelocityIndicator.arrow.visible = false;
    return;
  }

  INDICATOR_RELATIVE_VELOCITY.normalize();
  relativeVelocityIndicator.arrow.visible = true;
  relativeVelocityIndicator.arrow.position.copy(INDICATOR_RELATIVE_VELOCITY);
  relativeVelocityIndicator.arrow.position.multiplyScalar(
    -relativeVelocityIndicator.arrowLength * 0.5,
  );
  relativeVelocityIndicator.arrow.setDirection(INDICATOR_RELATIVE_VELOCITY);
}

function formatSignedVelocityDelta(valueMetersPerSecond: number): string {
  const sign = valueMetersPerSecond < 0 ? "-" : "";
  return `${sign}${(Math.abs(valueMetersPerSecond) / 1000).toFixed(2)} km/s`;
}
