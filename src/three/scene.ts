import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { MissionCameraController } from "../mission-scene/camera/camera-controller";
import { createSceneObjects } from "./objects";
import { createOrientationIndicator } from "./orientation-indicator";
import { createVectorIndicator } from "./orientation-indicator";
import type {
  OrientationIndicatorBundle,
  VectorIndicatorBundle,
} from "./orientation-indicator";
import { loadReferenceBackground } from "./skybox";
import { createReferenceSun } from "./sun";

const BLOOM_STRENGTH = 0.1;
const BLOOM_RADIUS = 0.32;
const BLOOM_THRESHOLD = 0.68;
const GRID_SIZE = 520 * 9;
const GRID_MINOR_SPACING = 6;
const GRID_MAJOR_SPACING = GRID_MINOR_SPACING * 4;

export type ThreeSceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cameraController: MissionCameraController;
  objects: ReturnType<typeof createSceneObjects>;
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
};

export function createThreeSceneBundle({
  scene,
  camera,
  renderer,
  cameraController,
}: CreateThreeSceneBundleParams): ThreeSceneBundle {
  const previousBackground = scene.background;
  const previousFog = scene.fog;
  const background = loadReferenceBackground();

  scene.background = background;
  scene.fog = new THREE.Fog(0x000814, 180, 2500);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const rendererSize = renderer.getSize(new THREE.Vector2());
  const bloomPass = new UnrealBloomPass(
    rendererSize.clone(),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD,
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const ambientLight = new THREE.AmbientLight(0x1e2633, 0.8);
  scene.add(ambientLight);

  const objects = createSceneObjects(scene);
  const orientationIndicator = createOrientationIndicator();
  const relativeVelocityIndicator = createVectorIndicator();
  objects.system.add(createOrbitalGrid());
  objects.system.add(createAxisHelper());

  const sunBundle = createReferenceSun();
  scene.add(sunBundle.sun);
  scene.add(sunBundle.sunLight);
  scene.add(sunBundle.sunLight.target);
  // scene.add(sunBundle.fillLight);
  // scene.add(sunBundle.fillLight.target);

  function resize(width: number, height: number) {
    composer.setSize(width, height);
  }

  function render() {
    composer.render();

    const rendererSize = renderer.getSize(new THREE.Vector2());
    const insetSize = Math.min(
      orientationIndicator.sizePx,
      Math.floor(Math.min(rendererSize.x, rendererSize.y) * 0.24),
    );
    const insetPadding = 20;
    const insetGap = 12;
    const insetX = Math.max(rendererSize.x - insetSize - insetPadding, 0);
    const relativeVelocityInsetX = Math.max(insetX - insetSize - insetGap, 0);
    const insetY = insetPadding;
    const previousAutoClear = renderer.autoClear;

    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setViewport(relativeVelocityInsetX, insetY, insetSize, insetSize);
    renderer.setScissor(relativeVelocityInsetX, insetY, insetSize, insetSize);
    renderer.render(
      relativeVelocityIndicator.scene,
      relativeVelocityIndicator.camera,
    );
    renderer.setViewport(insetX, insetY, insetSize, insetSize);
    renderer.setScissor(insetX, insetY, insetSize, insetSize);
    renderer.render(orientationIndicator.scene, orientationIndicator.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, rendererSize.x, rendererSize.y);
    renderer.autoClear = previousAutoClear;
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

function disposeSceneGraph(root: THREE.Object3D) {
  root.traverse((object: THREE.Object3D) => {
    const mesh = object as THREE.Mesh & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material: THREE.Material) => material.dispose());
      return;
    }

    mesh.material?.dispose();
  });
}

function createOrbitalGrid(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 1, 1);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uMinorColor: { value: new THREE.Color(0x28455d) },
      uMajorColor: { value: new THREE.Color(0x4dd0ff) },
      uMinorSpacing: { value: GRID_MINOR_SPACING },
      uMajorSpacing: { value: GRID_MAJOR_SPACING },
      uMinorOpacity: { value: 0.3 },
      uMajorOpacity: { value: 0.05 },
      uFadeNear: { value: GRID_SIZE * 0.08 },
      uFadeFar: { value: GRID_SIZE * 0.29 },
      uGridHalfSize: { value: GRID_SIZE / 2 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uMinorColor;
      uniform vec3 uMajorColor;
      uniform float uMinorSpacing;
      uniform float uMajorSpacing;
      uniform float uMinorOpacity;
      uniform float uMajorOpacity;
      uniform float uFadeNear;
      uniform float uFadeFar;
      uniform float uGridHalfSize;

      varying vec3 vWorldPosition;

      float gridLineFactor(vec2 coord, float spacing) {
        vec2 grid = abs(fract(coord / spacing - 0.5) - 0.5) / fwidth(coord / spacing);
        return 1.0 - min(min(grid.x, grid.y), 1.0);
      }

      void main() {
        vec2 coord = vWorldPosition.xz;
        float radialDistance = distance(cameraPosition.xz, coord);
        float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, radialDistance);

        float edgeFade = 1.0 - smoothstep(uGridHalfSize * 0.82, uGridHalfSize, max(abs(coord.x), abs(coord.y)));
        float visibility = fade * edgeFade;

        float minorLine = gridLineFactor(coord, uMinorSpacing);
        float majorLine = gridLineFactor(coord, uMajorSpacing);

        vec3 color = mix(uMinorColor, uMajorColor, majorLine);
        float alpha = max(
          minorLine * uMinorOpacity * (1.0 - majorLine),
          majorLine * uMajorOpacity
        ) * visibility;

        if (alpha <= 0.001) {
          discard;
        }

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const grid = new THREE.Mesh(geometry, material);
  grid.renderOrder = -1;
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
