import * as THREE from "three";
import { getLaunchFrame } from "../../../physics/bodies";

export type EarthTakramNearRendererBundle = {
  root: THREE.Group;
  elapsedSeconds: number;
  worldReferenceMeters: THREE.Vector3;
};

export function createEarthTakramNearRenderer(): EarthTakramNearRendererBundle {
  const root = new THREE.Group();
  root.name = "earth-takram-near-renderer";
  const { position } = getLaunchFrame();

  return {
    root,
    elapsedSeconds: 0,
    worldReferenceMeters: position.clone(),
  };
}

export function updateEarthTakramNearRenderer(
  renderer: EarthTakramNearRendererBundle,
  elapsedSeconds: number,
): void {
  renderer.elapsedSeconds = elapsedSeconds;
}
