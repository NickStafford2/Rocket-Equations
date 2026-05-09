import { getRocketModelVariantForState } from "../../rocket/variant";
import type { RocketModelVariant } from "../../three/objects/rocket/rocket";
import type { ThreeSceneBundle } from "../../three/scene";
import type { FrameState } from "../frame-state";
import { syncRocketOrientation } from "./rocket-orientation";
import { syncRocketSmokeTrail } from "./rocket-smoke";

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

  syncRocketOrientation(bundle, frame.simState.rocket.heading);
  syncRocketSmokeTrail(bundle, frame, thrusting);
}

function getRocketModelVariant(frame: FrameState): RocketModelVariant {
  return getRocketModelVariantForState(
    frame.simState.rocket.position,
    frame.telemetry.moonPosition,
  );
}
