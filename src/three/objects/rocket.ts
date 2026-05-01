import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import {
  ROCKET_RENDER_MODEL_DEFINITIONS,
  ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
  type RocketModelDefinition,
  type RocketModelVariant,
} from "./rocket-models";

export type {
  RocketModelDefinition,
  RocketModelVariant,
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

const SHOW_DEBUG_CYLINDER = false;
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

export function createRocketObjects() {
  const rocket = new THREE.Group();
  rocket.userData.focusLabel = "Rocket";
  const fallbackBodyLength = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 5.5;
  rocket.userData.focusRadius = fallbackBodyLength * 0.9;
  rocket.userData.followMinDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 22;
  rocket.userData.followDefaultDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 46;
  rocket.userData.followMaxDistance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 72;

  const enginePlume = new THREE.Mesh(
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
  enginePlume.rotation.z = Math.PI;
  enginePlume.position.y =
    -fallbackBodyLength / 2 - REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.25;
  enginePlume.userData.baseScale = 1;
  enginePlume.visible = false;
  rocket.add(enginePlume);

  if (SHOW_DEBUG_CYLINDER) {
    rocket.add(createDebugRocketBody(fallbackBodyLength));
  }

  const rocketVisual = createRocketVisual({
    onLoaded: ({ definition, size: scaledSize }) => {
      rocket.userData.focusRadius = Math.max(
        scaledSize.y * 0.45,
        scaledSize.x * 0.6,
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.5,
      );
      enginePlume.position.set(
        definition.nozzleLocalOffsetMeters.x *
          ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
        definition.nozzleLocalOffsetMeters.y *
          ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
        definition.nozzleLocalOffsetMeters.z *
          ROCKET_VISUAL_METERS_TO_SCENE_UNITS,
      );
      enginePlume.userData.baseScale = definition.plumeVisualScaleMultiplier;
    },
  });
  rocket.add(rocketVisual.root);

  const thrustDirectionArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(),
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 10,
    0x7dffb2,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.8,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.4,
  );

  const launchLocationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
    0xf472b6,
    6,
    3,
  );

  const launchRing = new THREE.Mesh(
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
  launchRing.position.set(
    EARTH_RENDER_RADIUS_SCENE_UNITS +
      REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.4,
    0,
    0,
  );

  const launchTangentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(
      EARTH_RENDER_RADIUS_SCENE_UNITS +
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
      0,
      0,
    ),
    16,
    0x000,
    4,
    2,
  );

  const launchAimArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(
      EARTH_RENDER_RADIUS_SCENE_UNITS +
        REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6,
      0,
      0,
    ),
    18,
    0xff8d5c,
    5,
    2.5,
  );

  return {
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
    setRocketModelVariant: rocketVisual.setVariant,
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

function createDebugRocketBody(bodyLength: number): THREE.Group {
  const radius = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.62;
  const noseLength = bodyLength * 0.24;
  const stageBandHeight = bodyLength * 0.08;
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, bodyLength, 24, 1),
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.72,
      metalness: 0.12,
      transparent: true,
      opacity: 0.9,
    }),
  );
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.98, noseLength, 24, 1),
    new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      roughness: 0.5,
      metalness: 0.08,
      transparent: true,
      opacity: 0.95,
    }),
  );
  nose.position.y = bodyLength / 2 + noseLength / 2;
  group.add(nose);

  const stageBand = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 1.01,
      radius * 1.01,
      stageBandHeight,
      24,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.42,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    }),
  );
  stageBand.position.y = -bodyLength * 0.18;
  group.add(stageBand);

  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return group;
}
