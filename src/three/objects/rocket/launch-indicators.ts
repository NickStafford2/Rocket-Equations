import * as THREE from "three";
import {
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
  EARTH_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";

export function createThrustDirectionArrow(): THREE.ArrowHelper {
  const position = new THREE.Vector3(0, 0, 0);
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(),
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 10,
    0x7dffb2,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.8,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.4,
  );
  arrow.position.copy(position);
  return arrow;
}

export function createLaunchLocationArrow(): THREE.ArrowHelper {
  const position = new THREE.Vector3(
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
    0,
    0,
  );
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
    0xf472b6,
    6,
    3,
  );
  arrow.position.copy(position);
  return arrow;
}

export function createLaunchRing(): THREE.Mesh {
  const position = new THREE.Vector3(
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.4,
    0,
    0,
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 3.4,
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.16,
      12,
      42,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.9,
    }),
  );
  ring.position.copy(position);
  return ring;
}

export function createLaunchTangentArrow(): THREE.ArrowHelper {
  const position = new THREE.Vector3(
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
    0,
    0,
  );
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(),
    16,
    0x000,
    4,
    2,
  );
  arrow.position.copy(position);
  return arrow;
}

export function createLaunchAimArrow(): THREE.ArrowHelper {
  const position = new THREE.Vector3(
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
    0,
    0,
  );
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(),
    18,
    0xff8d5c,
    5,
    2.5,
  );
  arrow.position.copy(position);
  return arrow;
}
