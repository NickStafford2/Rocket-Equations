import * as THREE from "three";

export type LaunchCloudPuff = {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  baseOpacity: number;
  basePosition: THREE.Vector3;
  driftAmplitudeX: number;
  driftAmplitudeZ: number;
  bobAmplitudeY: number;
  phase: number;
};

export type CloudDescriptor = {
  positionMeters: [number, number, number];
  scaleMeters: [number, number];
  opacity: number;
  driftAmplitudeMeters: [number, number];
  bobAmplitudeMeters: number;
  phase: number;
};

export type LaunchCloudField = {
  root: THREE.Group;
  volume: THREE.Mesh<THREE.BoxGeometry, THREE.RawShaderMaterial>;
  material: THREE.RawShaderMaterial;
  puffs: LaunchCloudPuff[];
};
