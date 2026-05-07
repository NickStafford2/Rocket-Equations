import * as THREE from "three";
import { ROCKET_VISUAL_METERS_TO_SCENE_UNITS } from "../rocket/rocket-models";

const CLOUD_COLOR = 0xff63d8;
const CLOUD_EMISSIVE = 0x4c1036;
const CLOUD_FADE_START_ALTITUDE_METERS = 12_000;
const CLOUD_FADE_END_ALTITUDE_METERS = 40_000;
const CLOUD_DRIFT_SPEED = 0.045;
const CLOUD_BOB_SPEED = 0.18;

type LaunchCloudPuff = {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseOpacity: number;
  basePosition: THREE.Vector3;
  driftAmplitudeX: number;
  driftAmplitudeZ: number;
  bobAmplitudeY: number;
  phase: number;
};

export type LaunchCloudField = {
  root: THREE.Group;
  puffs: LaunchCloudPuff[];
};

type CloudDescriptor = {
  positionMeters: [number, number, number];
  scaleMeters: [number, number, number];
  opacity: number;
  driftAmplitudeMeters: [number, number];
  bobAmplitudeMeters: number;
  phase: number;
};

const CLOUD_PUFFS: CloudDescriptor[] = [
  {
    positionMeters: [0, 2_400, 0],
    scaleMeters: [4_200, 900, 3_000],
    opacity: 0.22,
    driftAmplitudeMeters: [180, 120],
    bobAmplitudeMeters: 90,
    phase: 0.1,
  },
  {
    positionMeters: [1_200, 2_900, -900],
    scaleMeters: [3_600, 820, 2_400],
    opacity: 0.2,
    driftAmplitudeMeters: [150, 100],
    bobAmplitudeMeters: 70,
    phase: 0.45,
  },
  {
    positionMeters: [-1_400, 2_650, 1_100],
    scaleMeters: [3_400, 780, 2_500],
    opacity: 0.2,
    driftAmplitudeMeters: [170, 120],
    bobAmplitudeMeters: 80,
    phase: 0.88,
  },
  {
    positionMeters: [2_400, 3_200, 1_500],
    scaleMeters: [3_100, 760, 2_200],
    opacity: 0.17,
    driftAmplitudeMeters: [120, 90],
    bobAmplitudeMeters: 60,
    phase: 1.3,
  },
  {
    positionMeters: [-2_200, 3_150, -1_800],
    scaleMeters: [3_000, 720, 2_100],
    opacity: 0.17,
    driftAmplitudeMeters: [140, 110],
    bobAmplitudeMeters: 65,
    phase: 1.85,
  },
  {
    positionMeters: [0, 3_800, 2_600],
    scaleMeters: [3_800, 840, 2_500],
    opacity: 0.16,
    driftAmplitudeMeters: [140, 100],
    bobAmplitudeMeters: 55,
    phase: 2.2,
  },
  {
    positionMeters: [0, 3_750, -2_700],
    scaleMeters: [3_800, 840, 2_500],
    opacity: 0.16,
    driftAmplitudeMeters: [140, 100],
    bobAmplitudeMeters: 55,
    phase: 2.6,
  },
  {
    positionMeters: [3_500, 4_100, 0],
    scaleMeters: [2_900, 680, 2_200],
    opacity: 0.14,
    driftAmplitudeMeters: [100, 80],
    bobAmplitudeMeters: 50,
    phase: 3.05,
  },
  {
    positionMeters: [-3_400, 4_100, 200],
    scaleMeters: [2_900, 680, 2_200],
    opacity: 0.14,
    driftAmplitudeMeters: [100, 80],
    bobAmplitudeMeters: 50,
    phase: 3.4,
  },
  {
    positionMeters: [900, 4_500, 3_900],
    scaleMeters: [2_500, 620, 1_900],
    opacity: 0.12,
    driftAmplitudeMeters: [85, 70],
    bobAmplitudeMeters: 40,
    phase: 3.8,
  },
  {
    positionMeters: [-1_050, 4_450, -3_850],
    scaleMeters: [2_500, 620, 1_900],
    opacity: 0.12,
    driftAmplitudeMeters: [85, 70],
    bobAmplitudeMeters: 40,
    phase: 4.25,
  },
];

export function createLaunchCloudField(): LaunchCloudField {
  const root = new THREE.Group();
  root.name = "launch-cloud-field";

  const puffs = CLOUD_PUFFS.map((descriptor) =>
    createLaunchCloudPuff(root, descriptor),
  );

  return { root, puffs };
}

export function updateLaunchCloudField(
  cloudField: LaunchCloudField,
  {
    elapsedSeconds,
    altitudeMeters,
  }: {
    elapsedSeconds: number;
    altitudeMeters: number;
  },
) {
  const visibility = 1 - THREE.MathUtils.smoothstep(
    altitudeMeters,
    CLOUD_FADE_START_ALTITUDE_METERS,
    CLOUD_FADE_END_ALTITUDE_METERS,
  );

  cloudField.root.visible = visibility > 0.01;
  if (!cloudField.root.visible) {
    return;
  }

  for (const puff of cloudField.puffs) {
    puff.mesh.position.set(
      puff.basePosition.x +
        Math.sin(elapsedSeconds * CLOUD_DRIFT_SPEED + puff.phase) *
          puff.driftAmplitudeX,
      puff.basePosition.y +
        Math.sin(elapsedSeconds * CLOUD_BOB_SPEED + puff.phase * 1.7) *
          puff.bobAmplitudeY,
      puff.basePosition.z +
        Math.cos(elapsedSeconds * CLOUD_DRIFT_SPEED + puff.phase) *
          puff.driftAmplitudeZ,
    );
    puff.material.opacity =
      puff.baseOpacity *
      visibility *
      (0.9 +
        0.1 *
          Math.sin(elapsedSeconds * (CLOUD_BOB_SPEED * 0.55) + puff.phase));
  }
}

function createLaunchCloudPuff(
  root: THREE.Group,
  descriptor: CloudDescriptor,
): LaunchCloudPuff {
  const material = new THREE.MeshStandardMaterial({
    color: CLOUD_COLOR,
    emissive: CLOUD_EMISSIVE,
    emissiveIntensity: 0.35,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: descriptor.opacity,
    depthWrite: false,
  });
  material.toneMapped = false;

  const geometry = new THREE.SphereGeometry(1, 18, 14);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(toSceneVector(descriptor.positionMeters));
  mesh.scale.copy(toSceneVector(descriptor.scaleMeters));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 6;
  root.add(mesh);

  return {
    mesh,
    material,
    baseOpacity: descriptor.opacity,
    basePosition: mesh.position.clone(),
    driftAmplitudeX:
      descriptor.driftAmplitudeMeters[0] * ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
    driftAmplitudeZ:
      descriptor.driftAmplitudeMeters[1] * ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
    bobAmplitudeY:
      descriptor.bobAmplitudeMeters * ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
    phase: descriptor.phase,
  };
}

function toSceneVector(
  [xMeters, yMeters, zMeters]: [number, number, number],
): THREE.Vector3 {
  return new THREE.Vector3(
    xMeters * ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
    yMeters * ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
    zMeters * ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
  );
}
