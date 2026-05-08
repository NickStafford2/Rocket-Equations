import { EARTH_ANGULAR_SPEED } from "../physics/bodies";
import { syncMoonVisual } from "../three/objects/moon/moon";
import { syncSatelliteSystem } from "../three/objects/earth/satellites";
import { copyScenePositionFromMeters } from "../three/objects/position-scaling";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

const EARTH_CLOUD_DRIFT_RATIO = 1.08;

export function syncCelestialBodies(
  bundle: ThreeSceneBundle,
  frame: FrameState,
) {
  const { objects } = bundle;

  objects.earthRotatingFrame.rotation.y =
    EARTH_ANGULAR_SPEED * frame.simState.t;
  objects.earthCloudsFrame.rotation.y =
    (EARTH_CLOUD_DRIFT_RATIO - 1) * EARTH_ANGULAR_SPEED * frame.simState.t;
  // objects.referenceEarthRotatingFrame.rotation.y =
  //   EARTH_ANGULAR_SPEED * frame.simState.t;

  syncSatelliteSystem(objects.satelliteSystem, frame.simState.t);
  syncMoonVisual(objects.moon, frame.telemetry.moonPosition);

  copyScenePositionFromMeters(
    objects.rocket.position,
    frame.simState.rocket.position,
    frame.telemetry.moonPosition,
  );
}
