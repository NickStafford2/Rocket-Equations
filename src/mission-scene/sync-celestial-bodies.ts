import { EARTH_ANGULAR_SPEED } from "../physics/bodies";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../three/objects/constants";
import { syncMoonVisual } from "../three/objects/moon";
import { syncSatelliteSystem } from "../three/objects/satellites";
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
  objects.referenceEarthRotatingFrame.rotation.y =
    EARTH_ANGULAR_SPEED * frame.simState.t;

  syncSatelliteSystem(objects.satelliteSystem, frame.simState.t);
  syncMoonVisual(objects.moon, frame.telemetry.moonPosition);

  objects.rocket.position
    .copy(frame.simState.rocket.position)
    .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
}
