import * as THREE from "three";
import { EARTH_ANGULAR_SPEED } from "../physics/bodies";
import { copyRenderPositionFromMeters } from "../render-space/scene-position";
import { syncMoonVisual } from "../three/objects/moon/moon";
import { updateEarthNearAtmosphereRenderer } from "../three/objects/earth/near-atmosphere-renderer";
import { syncSatelliteSystem } from "../three/objects/earth/satellites";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

const EARTH_CLOUD_DRIFT_RATIO = 1.08;
const EARTH_WORLD_POSITION_METERS = new THREE.Vector3();
const EARTH_RENDER_POSITION = new THREE.Vector3();

export function syncCelestialBodies(
  bundle: ThreeSceneBundle,
  frame: FrameState,
) {
  const { objects } = bundle;

  objects.earthRotatingFrame.rotation.y =
    EARTH_ANGULAR_SPEED * frame.simState.t;
  objects.earthCloudsFrame.rotation.y =
    (EARTH_CLOUD_DRIFT_RATIO - 1) * EARTH_ANGULAR_SPEED * frame.simState.t;
  updateEarthNearAtmosphereRenderer(
    objects.earthRenderers.nearAtmosphere,
    frame.simState.t,
  );
  // objects.referenceEarthRotatingFrame.rotation.y =
  //   EARTH_ANGULAR_SPEED * frame.simState.t;

  if (frame.renderSpace.mode === "deep-space") {
    copyRenderPositionFromMeters(
      EARTH_RENDER_POSITION,
      frame.renderSpace,
      EARTH_WORLD_POSITION_METERS,
    );
    objects.earthGroup.position.copy(EARTH_RENDER_POSITION);
    objects.moonOrbit.position.copy(EARTH_RENDER_POSITION);
    syncMoonVisual(
      objects.moon,
      frame.telemetry.moonPosition,
      frame.renderSpace,
      EARTH_RENDER_POSITION,
    );
  } else {
    objects.earthGroup.position.set(0, 0, 0);
    objects.moonOrbit.position.set(0, 0, 0);
    syncMoonVisual(objects.moon, frame.telemetry.moonPosition);
  }

  syncSatelliteSystem(objects.satelliteSystem, frame.simState.t);
  syncSatelliteSystem(objects.moonSatelliteSystem, frame.simState.t);

  copyRenderPositionFromMeters(
    objects.rocket.position,
    frame.renderSpace,
    frame.simState.rocket.position,
  );
}
