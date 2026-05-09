import * as THREE from "three";
import { CLOUD_COLOR, CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER } from "./constants";
import { getCloudSpriteTexture } from "./cloud-texture";
import type { CloudDescriptor, LaunchCloudPuff } from "./types";
import {
  offsetCloudHeight,
  toSceneScale,
  toSceneUnits,
  toSceneVector,
} from "./units";

const CLOUD_PUFFS: CloudDescriptor[] = [
  {
    positionMeters: [0, 2_100, 0],
    scaleMeters: [11_500, 6_400],
    opacity: 0.42,
    driftAmplitudeMeters: [140, 120],
    bobAmplitudeMeters: 85,
    phase: 0.1,
  },
  {
    positionMeters: [1_450, 2_350, -950],
    scaleMeters: [8_800, 5_000],
    opacity: 0.34,
    driftAmplitudeMeters: [120, 95],
    bobAmplitudeMeters: 65,
    phase: 0.45,
  },
  {
    positionMeters: [-1_700, 2_300, 1_100],
    scaleMeters: [8_400, 4_800],
    opacity: 0.34,
    driftAmplitudeMeters: [135, 110],
    bobAmplitudeMeters: 70,
    phase: 0.88,
  },
  {
    positionMeters: [2_600, 2_850, 1_650],
    scaleMeters: [7_200, 4_200],
    opacity: 0.28,
    driftAmplitudeMeters: [110, 90],
    bobAmplitudeMeters: 55,
    phase: 1.3,
  },
  {
    positionMeters: [-2_450, 2_800, -1_900],
    scaleMeters: [7_100, 4_100],
    opacity: 0.28,
    driftAmplitudeMeters: [115, 95],
    bobAmplitudeMeters: 55,
    phase: 1.85,
  },
  {
    positionMeters: [0, 3_150, 2_900],
    scaleMeters: [7_800, 4_500],
    opacity: 0.24,
    driftAmplitudeMeters: [100, 88],
    bobAmplitudeMeters: 50,
    phase: 2.2,
  },
  {
    positionMeters: [0, 3_100, -3_000],
    scaleMeters: [7_800, 4_500],
    opacity: 0.24,
    driftAmplitudeMeters: [100, 88],
    bobAmplitudeMeters: 50,
    phase: 2.6,
  },
];

export function createLaunchCloudPuffs(root: THREE.Group): LaunchCloudPuff[] {
  return CLOUD_PUFFS.map((descriptor) =>
    createLaunchCloudPuff(root, descriptor),
  );
}

export function updateLaunchCloudPuffs({
  puffs,
  elapsedSeconds,
  visibility,
}: {
  puffs: LaunchCloudPuff[];
  elapsedSeconds: number;
  visibility: number;
}) {
  for (const puff of puffs) {
    puff.sprite.position.set(
      puff.basePosition.x +
        Math.sin(elapsedSeconds * 0.04 + puff.phase) * puff.driftAmplitudeX,
      puff.basePosition.y +
        Math.sin(elapsedSeconds * 0.11 + puff.phase * 1.7) * puff.bobAmplitudeY,
      puff.basePosition.z +
        Math.cos(elapsedSeconds * 0.04 + puff.phase) * puff.driftAmplitudeZ,
    );

    puff.material.opacity =
      puff.baseOpacity *
      visibility *
      (0.92 + 0.08 * Math.sin(elapsedSeconds * 0.07 + puff.phase));
  }
}

function createLaunchCloudPuff(
  root: THREE.Group,
  descriptor: CloudDescriptor,
): LaunchCloudPuff {
  const material = new THREE.SpriteMaterial({
    color: CLOUD_COLOR,
    map: getCloudSpriteTexture(),
    transparent: true,
    opacity: descriptor.opacity,
    depthWrite: false,
  });

  material.toneMapped = false;

  const sprite = new THREE.Sprite(material);
  sprite.position.copy(
    toSceneVector(
      offsetCloudHeight(descriptor.positionMeters),
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
  );

  const [widthMeters, heightMeters] = descriptor.scaleMeters;
  const scale = toSceneScale(
    widthMeters,
    heightMeters,
    CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
  );

  sprite.scale.set(scale.x, scale.y, 1);
  sprite.renderOrder = 9;
  sprite.frustumCulled = false;

  root.add(sprite);

  return {
    sprite,
    material,
    baseOpacity: descriptor.opacity,
    basePosition: sprite.position.clone(),
    driftAmplitudeX: toSceneUnits(
      descriptor.driftAmplitudeMeters[0],
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
    driftAmplitudeZ: toSceneUnits(
      descriptor.driftAmplitudeMeters[1],
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
    bobAmplitudeY: toSceneUnits(
      descriptor.bobAmplitudeMeters,
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
    phase: descriptor.phase,
  };
}
