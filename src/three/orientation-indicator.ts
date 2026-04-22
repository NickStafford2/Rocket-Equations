import * as THREE from "three";

export type OrientationIndicatorBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rocket: THREE.Group;
  resize: () => void;
  render: () => void;
  dispose: () => void;
};

export function createOrientationIndicator(
  container: HTMLDivElement,
): OrientationIndicatorBundle {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    36,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    100,
  );
  camera.position.set(3.4, 2.4, 4.8);
  camera.lookAt(0, 0.35, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearAlpha(0);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xd7ebff, 0.95);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  const axes = new THREE.AxesHelper(2.6);
  scene.add(axes);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.018, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.2,
    }),
  );
  orbitRing.rotation.x = Math.PI / 2;
  scene.add(orbitRing);

  const rocket = createIndicatorRocket();
  scene.add(rocket);

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material?.dispose();
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  resize();

  return {
    scene,
    camera,
    renderer,
    rocket,
    resize,
    render,
    dispose,
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
