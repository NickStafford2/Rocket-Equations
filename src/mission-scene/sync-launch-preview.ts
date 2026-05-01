import * as THREE from "three";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../three/objects/constants";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);

export function syncLaunchPreview(
  bundle: ThreeSceneBundle,
  frame: FrameState,
) {
  const { objects } = bundle;
  const {
    launchFrame,
    previewState,
    stagedLaunchPreviewVisible,
    aimArrowLength,
  } = frame;

  objects.launchRing.visible = stagedLaunchPreviewVisible;
  objects.launchLocationArrow.visible = stagedLaunchPreviewVisible;
  objects.launchTangentArrow.visible = stagedLaunchPreviewVisible;
  objects.launchAimArrow.visible = stagedLaunchPreviewVisible;

  const launchOrigin = launchFrame.position
    .clone()
    .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  objects.launchLocationArrow.position.set(0, 0, 0);
  objects.launchLocationArrow.setDirection(launchFrame.radialHat.clone());
  objects.launchLocationArrow.setLength(launchOrigin.length(), 6, 3);
  objects.launchRing.position.copy(launchOrigin);
  objects.launchRing.quaternion.setFromUnitVectors(
    WORLD_FORWARD,
    launchFrame.radialHat.clone(),
  );
  objects.launchTangentArrow.position.copy(launchOrigin);
  objects.launchTangentArrow.setDirection(launchFrame.tangentHat.clone());
  objects.launchTangentArrow.setLength(14, 3.5, 1.75);
  objects.launchAimArrow.position.copy(launchOrigin);
  objects.launchAimArrow.setDirection(
    previewState.velocity.clone().normalize(),
  );
  objects.launchAimArrow.setLength(
    aimArrowLength,
    Math.max(4, aimArrowLength * 0.22),
    Math.max(2, aimArrowLength * 0.11),
  );
}
