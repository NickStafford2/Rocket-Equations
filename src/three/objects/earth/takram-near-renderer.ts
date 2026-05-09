import * as THREE from "three";

export type EarthTakramNearRendererBundle = {
  root: THREE.Group;
  elapsedSeconds: number;
};

export function createEarthTakramNearRenderer(): EarthTakramNearRendererBundle {
  const root = new THREE.Group();
  root.name = "earth-takram-near-renderer";

  return {
    root,
    elapsedSeconds: 0,
  };
}

export function updateEarthTakramNearRenderer(
  renderer: EarthTakramNearRendererBundle,
  elapsedSeconds: number,
): void {
  renderer.elapsedSeconds = elapsedSeconds;
}
