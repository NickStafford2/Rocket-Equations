import * as THREE from "three";
import { createRocketVisual } from "./objects/rocket";

const INDICATOR_ROCKET_HEIGHT = 1.7 / 4;

export type OrientationIndicatorBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame: THREE.Group;
  rocket: THREE.Group;
  sizePx: number;
};

export function createOrientationIndicator(): OrientationIndicatorBundle {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.up.set(0, 1, 0);
  camera.position.set(0, 0, 5.4);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xd7ebff, 0.95);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  const frame = new THREE.Group();
  scene.add(frame);

  const axes = new THREE.AxesHelper(2.6);
  frame.add(axes);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.018, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.2,
    }),
  );
  orbitRing.rotation.x = Math.PI / 2;
  frame.add(orbitRing);

  const rocket = new THREE.Group();
  const rocketVisual = createRocketVisual(INDICATOR_ROCKET_HEIGHT, {
    onScaled: ({ center }) => {
      rocketVisual.position.y = 600 * center.y;
    },
  });
  rocket.add(rocketVisual);
  frame.add(rocket);

  return {
    scene,
    camera,
    frame,
    rocket,
    sizePx: 132,
  };
}
