import * as THREE from "three";
import { findFocusableObject } from "./camera-target";
import type { CameraRigTarget } from "./camera-types";

const POINTER = new THREE.Vector2();

export function pickCameraFocusTarget({
  event,
  camera,
  scene,
  domElement,
  raycaster,
}: {
  event: MouseEvent;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  domElement: HTMLElement;
  raycaster: THREE.Raycaster;
}): CameraRigTarget | null {
  const rect = domElement.getBoundingClientRect();

  POINTER.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  POINTER.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(POINTER, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);

  for (const hit of intersections) {
    const focusable = findFocusableObject(hit.object);
    if (focusable) return focusable;
  }

  return null;
}
