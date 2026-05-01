import { EARTH_ANGULAR_SPEED } from "../physics/bodies";
import { syncMoonVisual } from "../three/objects/bodies";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../three/objects/constants";
import { syncSatelliteSystem } from "../three/objects/satellites";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

export function syncCelestialBodies(
  bundle: ThreeSceneBundle,
  frame: FrameState,
) {
  const { objects } = bundle;

  objects.earthRotatingFrame.rotation.y =
    EARTH_ANGULAR_SPEED * frame.simState.t;

  syncSatelliteSystem(objects.satelliteSystem, frame.simState.t);
  syncMoonVisual(objects.moon, frame.telemetry.moonPosition);

  objects.rocket.position
    .copy(frame.simState.rocket.position)
    .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
}
