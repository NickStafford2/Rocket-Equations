import * as THREE from "three";

export type EarthTakramNearRendererBundle = {
  root: THREE.Group;
};

export function createEarthTakramNearRenderer(): EarthTakramNearRendererBundle {
  const root = new THREE.Group();
  root.name = "earth-takram-near-renderer";

  return {
    root,
  };
}
