import * as THREE from "three";
import { copyRenderPositionFromMeters } from "../render-space/scene-position";
import { updateLaunchCloudField } from "../three/objects/earth/launch-clouds";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

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
  const showLaunchPreview =
    stagedLaunchPreviewVisible && frame.renderSpace.mode === "earth-local";

  objects.launchRing.visible = showLaunchPreview;
  objects.launchLocationArrow.visible = showLaunchPreview;
  objects.launchTangentArrow.visible = showLaunchPreview;
  objects.launchAimArrow.visible = showLaunchPreview;

  if (!showLaunchPreview) {
    objects.launchCloudField.root.visible = false;
    return;
  }

  const launchOrigin = copyRenderPositionFromMeters(
    new THREE.Vector3(),
    frame.renderSpace,
    launchFrame.position,
  );
  objects.launchLocationArrow.position.set(0, 0, 0);
  objects.launchLocationArrow.setDirection(launchFrame.radialHat.clone());
  objects.launchLocationArrow.setLength(launchOrigin.length(), 6, 3);
  objects.launchRing.position.copy(launchOrigin);
  objects.launchRing.quaternion.setFromUnitVectors(
    WORLD_FORWARD,
    launchFrame.radialHat.clone(),
  );
  objects.earthLaunchSite.position.copy(launchOrigin);
  objects.earthLaunchSite.quaternion.setFromUnitVectors(
    WORLD_UP,
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
  updateLaunchCloudField(objects.launchCloudField, {
    cameraPosition: bundle.camera.position,
    elapsedSeconds: frame.simState.t,
    altitudeMeters: frame.telemetry.altitudeEarth,
  });
}
