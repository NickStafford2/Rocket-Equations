import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  ROCKET_RENDER_MODEL_DEFINITIONS,
  ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
  type RocketModelDefinition,
  type RocketModelVariant,
} from "./rocket-models";

export interface RocketVisualLoadedPayload {
  definition: RocketModelDefinition;
  bounds: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
}

type RocketVisualController = {
  root: THREE.Group;
  setVariant: (variant: RocketModelVariant) => void;
  getVariant: () => RocketModelVariant;
};

const MODEL_CACHE = new Map<RocketModelVariant, Promise<THREE.Group>>();

export function createRocketVisual({
  initialVariant = "saturn-v",
  visualMetersToSceneUnits:
    visualMetersToSceneUnits = ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
  fitHeightSceneUnits: fitHeightSceneUnits,
  onLoaded,
}: {
  initialVariant?: RocketModelVariant;
  visualMetersToSceneUnits?: number;
  fitHeightSceneUnits?: number;
  onLoaded?: (payload: RocketVisualLoadedPayload) => void;
} = {}): RocketVisualController {
  const modelScaleRoot = new THREE.Group();
  let activeVariant = initialVariant;
  let loadRequestId = 0;

  function setVariant(variant: RocketModelVariant) {
    if (variant === activeVariant && modelScaleRoot.children.length > 0) {
      return;
    }

    activeVariant = variant;
    const requestId = ++loadRequestId;

    void loadRocketModel(variant)
      .then((model) => {
        if (requestId !== loadRequestId) {
          return;
        }

        modelScaleRoot.clear();
        modelScaleRoot.position.set(0, 0, 0);
        modelScaleRoot.scale.setScalar(1);
        modelScaleRoot.add(model);

        modelScaleRoot.updateMatrixWorld(true);
        const scale =
          fitHeightSceneUnits && fitHeightSceneUnits > 0
            ? fitHeightSceneUnits /
              Math.max(
                ROCKET_RENDER_MODEL_DEFINITIONS[variant].heightMeters,
                1e-6,
              )
            : visualMetersToSceneUnits;
        modelScaleRoot.scale.setScalar(scale);

        modelScaleRoot.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(modelScaleRoot);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        onLoaded?.({
          definition: ROCKET_RENDER_MODEL_DEFINITIONS[variant],
          bounds: scaledBox,
          center: scaledCenter,
          size: scaledSize,
        });
      })
      .catch((error) => {
        console.error(
          `Failed to load ${ROCKET_RENDER_MODEL_DEFINITIONS[variant].name} rocket model.`,
          error,
        );
      });
  }

  setVariant(initialVariant);

  return {
    root: modelScaleRoot,
    setVariant,
    getVariant: () => activeVariant,
  };
}

function loadRocketModel(variant: RocketModelVariant): Promise<THREE.Group> {
  const cachedModel = MODEL_CACHE.get(variant);
  if (cachedModel) {
    return cachedModel.then((model) => model.clone(true));
  }

  const loader = new GLTFLoader();
  const pendingModel = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      ROCKET_RENDER_MODEL_DEFINITIONS[variant].url,
      (gltf) => {
        const model = gltf.scene;

        model.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) {
            return;
          }

          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });

        resolve(model);
      },
      undefined,
      reject,
    );
  });

  MODEL_CACHE.set(variant, pendingModel);
  return pendingModel.then((model) => model.clone(true));
}
