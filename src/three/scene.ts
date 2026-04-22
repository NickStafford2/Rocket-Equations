import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createSceneObjects } from "./objects";
import { createReferenceSkybox } from "./skybox";
import { createReferenceSun } from "./sun";

export type ThreeSceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  objects: ReturnType<typeof createSceneObjects>;
  render: () => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

export function createThreeScene(container: HTMLDivElement): ThreeSceneBundle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040812);
  scene.fog = new THREE.Fog(0x040812, 300, 1800);

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    10000,
  );
  camera.up.set(0, 1, 0);
  camera.position.set(-210, 120, 210);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.7,
      0.6,
      0.05,
    ),
  );
  composer.addPass(new OutputPass());

  const hemisphereLight = new THREE.HemisphereLight(0xa9d4ff, 0x05070d, 0.75);
  scene.add(hemisphereLight);

  const ambientLight = new THREE.AmbientLight(0x8db7ff, 0.35);
  scene.add(ambientLight);

  const objects = createSceneObjects(scene);
  objects.system.add(createOrbitalGrid());
  objects.system.add(createAxisHelper());
  scene.add(createReferenceSkybox());

  const sunBundle = createReferenceSun();
  scene.add(sunBundle.sun);
  scene.add(sunBundle.sunLight);
  scene.add(sunBundle.fillLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.75;
  controls.screenSpacePanning = false;
  controls.minDistance = 12;
  controls.maxDistance = 1400;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI - 0.08;
  controls.target.set(56, 0, 0);
  controls.update();

  function resize(width: number, height: number) {
    renderer.setSize(width, height);
    composer.setSize(width, height);
  }

  function render() {
    composer.render();
  }

  function dispose() {
    controls.dispose();
    scene.traverse((object: THREE.Object3D) => {
      const mesh = object as THREE.Mesh & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material: THREE.Material) => material.dispose());
      } else {
        mesh.material?.dispose();
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    objects,
    render,
    resize,
    dispose,
  };
}

function createOrbitalGrid(): THREE.GridHelper {
  const grid = new THREE.GridHelper(520, 24, 0x4dd0ff, 0x28455d);

  const material = grid.material as THREE.Material | THREE.Material[];
  if (Array.isArray(material)) {
    material.forEach((entry) => {
      entry.transparent = true;
      entry.opacity = 0.32;
      entry.depthWrite = false;
    });
  } else {
    material.transparent = true;
    material.opacity = 0.32;
    material.depthWrite = false;
  }

  return grid;
}

function createAxisHelper(): THREE.AxesHelper {
  const axes = new THREE.AxesHelper(48);
  const material = axes.material as THREE.Material | THREE.Material[];

  if (Array.isArray(material)) {
    material.forEach((entry) => {
      entry.transparent = true;
      entry.opacity = 0.9;
      entry.depthWrite = false;
    });
  } else {
    material.transparent = true;
    material.opacity = 0.9;
    material.depthWrite = false;
  }

  return axes;
}
