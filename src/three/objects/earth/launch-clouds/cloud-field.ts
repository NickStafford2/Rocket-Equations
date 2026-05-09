import * as THREE from "three";
import {
  CLOUD_FADE_END_ALTITUDE_METERS,
  CLOUD_FADE_START_ALTITUDE_METERS,
  CLOUD_WIND_SPEED_X,
  CLOUD_WIND_SPEED_Z,
} from "./constants";
import { createLaunchCloudPuffs, updateLaunchCloudPuffs } from "./cloud-puffs";
import { createCloudVolumeMesh } from "./cloud-volume";
import type { LaunchCloudField } from "./types";

export function createLaunchCloudField(): LaunchCloudField {
  const root = new THREE.Group();
  root.name = "launch-cloud-field";

  const volume = createCloudVolumeMesh();
  const puffs = createLaunchCloudPuffs(root);

  root.add(volume);

  return {
    root,
    volume,
    material: volume.material,
    puffs,
  };
}

export function updateLaunchCloudField(
  cloudField: LaunchCloudField,
  {
    cameraPosition,
    elapsedSeconds,
    altitudeMeters,
  }: {
    cameraPosition: THREE.Vector3;
    elapsedSeconds: number;
    altitudeMeters: number;
  },
) {
  const visibility = getCloudVisibility(altitudeMeters);

  cloudField.root.visible = visibility > 0.01;
  if (!cloudField.root.visible) {
    return;
  }

  updateCloudVolume({
    cloudField,
    cameraPosition,
    elapsedSeconds,
    visibility,
  });

  updateLaunchCloudPuffs({
    puffs: cloudField.puffs,
    elapsedSeconds,
    visibility,
  });
}

function updateCloudVolume({
  cloudField,
  cameraPosition,
  elapsedSeconds,
  visibility,
}: {
  cloudField: LaunchCloudField;
  cameraPosition: THREE.Vector3;
  elapsedSeconds: number;
  visibility: number;
}) {
  cloudField.material.uniforms.cameraPos.value.copy(cameraPosition);
  cloudField.material.uniforms.visibility.value = visibility;
  cloudField.material.uniforms.time.value = elapsedSeconds;
  cloudField.material.uniforms.frame.value += 1;
  cloudField.material.uniforms.windOffset.value.set(
    elapsedSeconds * CLOUD_WIND_SPEED_X,
    elapsedSeconds * CLOUD_WIND_SPEED_Z,
  );
}

function getCloudVisibility(altitudeMeters: number): number {
  return (
    1 -
    THREE.MathUtils.smoothstep(
      altitudeMeters,
      CLOUD_FADE_START_ALTITUDE_METERS,
      CLOUD_FADE_END_ALTITUDE_METERS,
    )
  );
}
