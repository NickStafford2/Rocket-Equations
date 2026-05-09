import * as THREE from "three";
import { R_EARTH } from "../../physics/bodies";
import { updateSmokeTrail } from "../../three/objects/rocket/smoke-trail";
import type { ThreeSceneBundle } from "../../three/scene";
import type { FrameState } from "../frame-state";

const SMOKE_WORLD_POSITION = new THREE.Vector3();
const SMOKE_EARTH_LOCAL_POSITION = new THREE.Vector3();

const ATMOSPHERIC_SMOKE_MAX_ALTITUDE_METERS = R_EARTH * 0.05;

export function syncRocketSmokeTrail(
  bundle: ThreeSceneBundle,
  frame: FrameState,
  thrusting: boolean,
) {
  const { objects } = bundle;

  objects.rocket.updateMatrixWorld(true);
  objects.enginePlume.getWorldPosition(SMOKE_WORLD_POSITION);

  SMOKE_EARTH_LOCAL_POSITION.copy(SMOKE_WORLD_POSITION);
  objects.earthRotatingFrame.worldToLocal(SMOKE_EARTH_LOCAL_POSITION);

  objects.smokeTrail.visible = updateSmokeTrail(
    objects.smokeTrail,
    SMOKE_EARTH_LOCAL_POSITION,
    frame.simState.t,
    thrusting &&
      !frame.stagedLaunchPreviewVisible &&
      frame.telemetry.altitudeEarth <= ATMOSPHERIC_SMOKE_MAX_ALTITUDE_METERS,
  );
}
