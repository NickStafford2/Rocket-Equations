// debug-rocket-body.ts

import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";

export function createDebugRocketBody(bodyLength: number): THREE.Group {
  const radius = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.62;
  const noseLength = bodyLength * 0.24;
  const stageBandHeight = bodyLength * 0.08;
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, bodyLength, 24, 1),
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.72,
      metalness: 0.12,
      transparent: true,
      opacity: 0.9,
    }),
  );
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.98, noseLength, 24, 1),
    new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      roughness: 0.5,
      metalness: 0.08,
      transparent: true,
      opacity: 0.95,
    }),
  );
  nose.position.y = bodyLength / 2 + noseLength / 2;
  group.add(nose);

  const stageBand = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 1.01,
      radius * 1.01,
      stageBandHeight,
      24,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.42,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    }),
  );
  stageBand.position.y = -bodyLength * 0.18;
  group.add(stageBand);

  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return group;
}
