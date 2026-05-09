import * as THREE from "three";

export function disposeSceneGraph(root: THREE.Object3D) {
  root.traverse((object: THREE.Object3D) => {
    const disposableObject = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
      dispose?: () => void;
    };

    disposableObject.geometry?.dispose();

    if (Array.isArray(disposableObject.material)) {
      disposableObject.material.forEach((material) => material.dispose());
    } else {
      disposableObject.material?.dispose();
    }

    disposableObject.dispose?.();
  });
}
