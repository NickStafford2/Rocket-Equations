import * as THREE from "three";

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

  const rocket = createIndicatorRocket();
  frame.add(rocket);

  return {
    scene,
    camera,
    frame,
    rocket,
    sizePx: 132,
  };
}

function createIndicatorRocket(): THREE.Group {
  const rocket = new THREE.Group();

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8f1ff,
    emissive: 0x16324c,
    emissiveIntensity: 0.35,
    roughness: 0.38,
    metalness: 0.18,
    wireframe: true,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb454,
    emissive: 0x4d2a10,
    emissiveIntensity: 0.45,
    roughness: 0.42,
    metalness: 0.08,
    wireframe: true,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 1.7, 18),
    frameMaterial,
  );
  rocket.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.52, 18),
    accentMaterial,
  );
  nose.position.y = 1.1;
  rocket.add(nose);

  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.24, 18),
    accentMaterial,
  );
  engine.position.y = -0.97;
  rocket.add(engine);

  for (const side of [-1, 1] as const) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.4, 0.24),
      frameMaterial,
    );
    fin.position.set(side * 0.16, -0.64, 0);
    rocket.add(fin);
  }

  return rocket;
}
