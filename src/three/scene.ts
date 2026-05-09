import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { MissionCameraController } from "../mission-scene/camera/camera-controller";
import type { SceneObjects } from "./objects";
import {
  createOrientationIndicator,
  createVectorIndicator,
  type OrientationIndicatorBundle,
  type VectorIndicatorBundle,
} from "./orientation-indicator";
import { disposeSceneGraph } from "./scene-disposal";
import { createAxisHelper, createOrbitalGrid } from "./scene-grid";
import { createIndicatorInsetRenderer } from "./scene-indicator-renderer";
import { loadReferenceBackground } from "./skybox";
import { createReferenceSun } from "./sun";

const BLOOM_STRENGTH = 0.1;
const BLOOM_RADIUS = 0.32;
const BLOOM_THRESHOLD = 0.68;

export type ThreeSceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cameraController: MissionCameraController;
  objects: SceneObjects;
  orientationIndicator: OrientationIndicatorBundle;
  relativeVelocityIndicator: VectorIndicatorBundle;
  render: () => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

type CreateThreeSceneBundleParams = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cameraController: MissionCameraController;
  objects: SceneObjects;
};

export function createThreeSceneBundle({
  scene,
  camera,
  renderer,
  cameraController,
  objects,
}: CreateThreeSceneBundleParams): ThreeSceneBundle {
  const previousBackground = scene.background;
  const previousFog = scene.fog;
  const background = loadReferenceBackground();

  configureSceneEnvironment(scene, background);
  configureRenderer(renderer);

  const composer = createComposer(renderer, scene, camera);
  const ambientLight = createAmbientLight();
  scene.add(ambientLight);

  objects.system.add(createOrbitalGrid());
  objects.system.add(createAxisHelper());

  const orientationIndicator = createOrientationIndicator();
  const relativeVelocityIndicator = createVectorIndicator();
  const indicatorInsetRenderer = createIndicatorInsetRenderer({
    renderer,
    orientationIndicator,
    relativeVelocityIndicator,
  });

  const sunBundle = createReferenceSun();
  scene.add(sunBundle.sun);
  scene.add(sunBundle.sunLight);
  scene.add(sunBundle.sunLight.target);

  function resize(width: number, height: number) {
    composer.setSize(width, height);
  }

  function render() {
    composer.render();
    indicatorInsetRenderer.render();
  }

  let disposed = false;

  function dispose() {
    if (disposed) {
      return;
    }

    disposed = true;

    cameraController.dispose();
    composer.dispose();

    disposeSceneGraph(objects.system);
    disposeSceneGraph(sunBundle.sun);
    disposeSceneGraph(orientationIndicator.scene);
    disposeSceneGraph(relativeVelocityIndicator.scene);

    scene.remove(ambientLight);
    scene.remove(objects.system);
    scene.remove(sunBundle.sun);
    scene.remove(sunBundle.sunLight);
    scene.remove(sunBundle.sunLight.target);

    scene.background = previousBackground;
    scene.fog = previousFog;

    if (background !== previousBackground) {
      background.dispose();
    }
  }

  return {
    scene,
    camera,
    renderer,
    cameraController,
    objects,
    orientationIndicator,
    relativeVelocityIndicator,
    render,
    resize,
    dispose,
  };
}

function configureSceneEnvironment(
  scene: THREE.Scene,
  background: THREE.Texture,
) {
  scene.background = background;
  scene.fog = new THREE.Fog(0x000814, 180, 2500);
}

function configureRenderer(renderer: THREE.WebGLRenderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
}

function createComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): EffectComposer {
  const composer = new EffectComposer(renderer);
  const rendererSize = renderer.getSize(new THREE.Vector2());

  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      rendererSize.clone(),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    ),
  );
  composer.addPass(new OutputPass());

  return composer;
}

function createAmbientLight(): THREE.AmbientLight {
  return new THREE.AmbientLight(0x1e2633, 0.8);
}
