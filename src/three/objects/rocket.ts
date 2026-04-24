import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import protonModelUrl from "../../assets/ProtonRocket5.glb?url";
import { EARTH_DRAW_RADIUS, ROCKET_DRAW_RADIUS } from "./constants";

const PROTON_TARGET_HEIGHT = ROCKET_DRAW_RADIUS * 8.6;
const SHOW_DEBUG_CYLINDER = false;
const MODEL_SIZE = new THREE.Vector3();

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

  const scaleRoot = new THREE.Group();
  rocket.add(scaleRoot);
  const loader = new GLTFLoader();
  loader.load(
    protonModelUrl,
    (gltf) => {
      const proton = gltf.scene;

      proton.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) {
          return;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });

      scaleRoot.clear();
      scaleRoot.add(proton);

      scaleRoot.updateMatrixWorld(true);
      const preScaleBox = new THREE.Box3().setFromObject(scaleRoot);
      const preScaleSize = preScaleBox.getSize(MODEL_SIZE);
      const sourceHeight = Math.max(preScaleSize.y, 1e-6);
      const scale = PROTON_TARGET_HEIGHT / sourceHeight;
      scaleRoot.scale.setScalar(scale);

      scaleRoot.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3().setFromObject(scaleRoot);
      const scaledSize = scaledBox.getSize(new THREE.Vector3());

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
    undefined,
    (error) => {
      console.error("Failed to load Proton rocket model.", error);
    },
  );

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
  };
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
