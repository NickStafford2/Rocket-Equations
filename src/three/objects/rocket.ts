import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import apolloLunarModuleUrl from "../../assets/Rocket Sections/Apollo Lunar Module2.glb?url";
import apolloSoyuzUrl from "../../assets/Rocket Sections/Apollo Soyuz5.glb?url";
import saturnVModelUrl from "../../assets/Rocket Sections/Saturn V2.glb?url";
import { EARTH_DRAW_RADIUS, ROCKET_DRAW_RADIUS } from "./constants";

export type RocketModelVariant =
  | "saturn-v"
  | "apollo-soyuz"
  | "apollo-lunar-module";

type RocketVisualController = {
  root: THREE.Group;
  setVariant: (variant: RocketModelVariant) => void;
  getVariant: () => RocketModelVariant;
};

const SATURN_V_TARGET_SIZE = ROCKET_DRAW_RADIUS * 8.6;
const SHOW_DEBUG_CYLINDER = false;
const MODEL_SIZE = new THREE.Vector3();
const MODEL_CONFIGS: Record<
  RocketModelVariant,
  {
    url: string;
    name: string;
    targetSize: number;
  }
> = {
  "saturn-v": {
    url: saturnVModelUrl,
    name: "Saturn V",
    targetSize: SATURN_V_TARGET_SIZE,
  },
  "apollo-soyuz": {
    url: apolloSoyuzUrl,
    name: "Apollo Soyuz",
    targetSize: (SATURN_V_TARGET_SIZE * 0.22) / 1000,
  },
  "apollo-lunar-module": {
    url: apolloLunarModuleUrl,
    name: "Apollo Lunar Module",
    targetSize: SATURN_V_TARGET_SIZE * 0.05,
  },
};
const MODEL_CACHE = new Map<RocketModelVariant, Promise<THREE.Group>>();

export function createRocketVisual(
  defaultTargetSize: number,
  {
    initialVariant = "saturn-v",
    onScaled,
  }: {
    initialVariant?: RocketModelVariant;
    onScaled?: (payload: {
      size: THREE.Vector3;
      center: THREE.Vector3;
    }) => void;
  } = {},
): RocketVisualController {
  const scaleRoot = new THREE.Group();
  let activeVariant = initialVariant;
  let loadRequestId = 0;

  function setVariant(variant: RocketModelVariant) {
    if (variant === activeVariant && scaleRoot.children.length > 0) {
      return;
    }

    activeVariant = variant;
    const requestId = ++loadRequestId;

    void loadRocketModel(variant)
      .then((model) => {
        if (requestId !== loadRequestId) {
          return;
        }

        scaleRoot.clear();
        scaleRoot.add(model);

        scaleRoot.updateMatrixWorld(true);
        const preScaleBox = new THREE.Box3().setFromObject(scaleRoot);
        const preScaleSize = preScaleBox.getSize(MODEL_SIZE);
        const sourceSize = Math.max(
          preScaleSize.x,
          preScaleSize.y,
          preScaleSize.z,
          1e-6,
        );
        const targetSize =
          MODEL_CONFIGS[variant].targetSize ?? defaultTargetSize;
        const scale = targetSize / sourceSize;
        scaleRoot.scale.setScalar(scale);

        scaleRoot.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(scaleRoot);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        onScaled?.({ size: scaledSize, center: scaledCenter });
      })
      .catch((error) => {
        console.error(
          `Failed to load ${MODEL_CONFIGS[variant].name} rocket model.`,
          error,
        );
      });
  }

  setVariant(initialVariant);

  return {
    root: scaleRoot,
    setVariant,
    getVariant: () => activeVariant,
  };
}

export function createRocketObjects() {
  const rocket = new THREE.Group();
  rocket.userData.focusLabel = "Rocket";
  const fallbackBodyLength = ROCKET_DRAW_RADIUS * 5.5;
  rocket.userData.focusRadius = fallbackBodyLength * 0.9;

  const enginePlume = new THREE.Mesh(
    new THREE.ConeGeometry(
      ROCKET_DRAW_RADIUS * 0.34,
      ROCKET_DRAW_RADIUS * 2.8,
      18,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.85,
    }),
  );
  enginePlume.rotation.z = Math.PI;
  enginePlume.position.y = -fallbackBodyLength / 2 - ROCKET_DRAW_RADIUS * 1.25;
  enginePlume.visible = false;
  rocket.add(enginePlume);

  if (SHOW_DEBUG_CYLINDER) {
    rocket.add(createDebugRocketBody(fallbackBodyLength));
  }

  const rocketVisual = createRocketVisual(SATURN_V_TARGET_SIZE, {
    onScaled: ({ size: scaledSize }) => {
      rocket.userData.focusRadius = Math.max(
        scaledSize.y * 0.45,
        scaledSize.x * 0.6,
        ROCKET_DRAW_RADIUS * 2.5,
      );
      enginePlume.position.y = -Math.max(
        ROCKET_DRAW_RADIUS * 1.1,
        scaledSize.y * 0.56,
      );
    },
  });
  rocket.add(rocketVisual.root);

  const thrustDirectionArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(),
    ROCKET_DRAW_RADIUS * 10,
    0x7dffb2,
    ROCKET_DRAW_RADIUS * 2.8,
    ROCKET_DRAW_RADIUS * 1.4,
  );

  const launchLocationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6,
    0xf472b6,
    6,
    3,
  );

  const launchRing = new THREE.Mesh(
    new THREE.TorusGeometry(
      ROCKET_DRAW_RADIUS * 3.4,
      ROCKET_DRAW_RADIUS * 0.16,
      12,
      42,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.9,
    }),
  );
  launchRing.position.set(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 0.4, 0, 0);

  const launchTangentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
    16,
    0x000,
    4,
    2,
  );

  const launchAimArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
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
      MODEL_CONFIGS[variant].url,
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
  const radius = ROCKET_DRAW_RADIUS * 0.62;
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
