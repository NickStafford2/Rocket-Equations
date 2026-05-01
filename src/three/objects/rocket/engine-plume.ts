import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";

export function createEnginePlume(): THREE.Mesh {
  return new THREE.Mesh(
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
}
