import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";

export function createEnginePlume(): THREE.Mesh {
  const plume = new THREE.Mesh(
    new THREE.ConeGeometry(
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.34,
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.8,
      18,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.85,
    }),
  );

  // Set position and rotation manually
  plume.rotation.z = Math.PI;
  plume.position.y = -REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.25; // Adjusted relative to body length
  plume.visible = false; // Initially not visible

  return plume;
}
