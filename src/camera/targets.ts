import * as THREE from "three";
import type { CameraTarget as MissionCameraTarget } from "../mission";
import type { ThreeSceneBundle } from "../three/scene";
import { readCameraProfile, type CameraProfile } from "./profiles";

export type CameraTargetKind = "body" | "vehicle" | "star";

export type CameraTarget = {
  id: MissionCameraTarget;
  kind: CameraTargetKind;
  object: THREE.Object3D;
  radius: number;
  label: string;
  cameraProfile: CameraProfile;
  getAnchor: (target: THREE.Vector3) => THREE.Vector3;
};

export type CameraTargetRegistry = {
  targets: CameraTarget[];
  byId: Map<MissionCameraTarget, CameraTarget>;
};

export function createCameraTargetRegistry(
  bundle: Pick<ThreeSceneBundle, "objects" | "sun">,
): CameraTargetRegistry {
  const targets = [
    createRegisteredTarget("earth", "body", bundle.objects.earthGroup),
    createRegisteredTarget("moon", "body", bundle.objects.moon),
    createRegisteredTarget("sun", "star", bundle.sun),
    createRegisteredTarget("rocket", "vehicle", bundle.objects.rocket),
  ];

  return {
    targets,
    byId: new Map(targets.map((target) => [target.id, target])),
  };
}

export function getCameraTargetById(
  registry: CameraTargetRegistry,
  id: MissionCameraTarget,
): CameraTarget | null {
  return registry.byId.get(id) ?? null;
}

export function findRegisteredCameraTargetForObject(
  registry: CameraTargetRegistry,
  object: THREE.Object3D | null,
): CameraTarget | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    const target = registry.targets.find((candidate) => candidate.object === current);
    if (target) return target;
    current = current.parent;
  }

  return null;
}

function createRegisteredTarget(
  id: MissionCameraTarget,
  kind: CameraTargetKind,
  object: THREE.Object3D,
): CameraTarget {
  const cameraProfile = readCameraProfile(object);

  return {
    id,
    kind,
    object,
    radius: cameraProfile.focusRadius,
    label: String(object.userData.focusLabel ?? id),
    cameraProfile,
    getAnchor: (target) => object.getWorldPosition(target),
  };
}
