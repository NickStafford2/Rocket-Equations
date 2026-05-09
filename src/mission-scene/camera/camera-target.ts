import * as THREE from "three";
import { normalizeFocusLabelToPreset } from "../../mission";
import type { CameraTarget } from "../../mission";
import type { CameraRigTarget } from "./camera-rig";

export function getFocusLabel(object: THREE.Object3D): string {
  return String(object.userData.focusLabel ?? "target");
}

export function findFocusableByPreset(
  scene: THREE.Scene,
  preset: CameraTarget,
): CameraRigTarget | null {
  let focusable: CameraRigTarget | null = null;

  scene.traverse((object) => {
    if (focusable) return;

    const target = toCameraRigTarget(object);
    if (target?.key === preset) {
      focusable = target;
    }
  });

  return focusable;
}

export function findFocusableObject(
  object: THREE.Object3D | null,
): CameraRigTarget | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    const target = toCameraRigTarget(current);
    if (target) return target;

    current = current.parent;
  }

  return null;
}

function toCameraRigTarget(object: THREE.Object3D): CameraRigTarget | null {
  const key = normalizeFocusLabelToPreset(object.userData.focusLabel);
  if (!key || key === "overview") return null;

  return {
    key,
    object,
  };
}
