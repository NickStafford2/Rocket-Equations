import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import protonModelUrl from "../../assets/Proton Rocket/Proton.obj?url";
import protonTextureUrl from "../../assets/Proton Rocket/Proton.jpg?url";
import { EARTH_DRAW_RADIUS, ROCKET_DRAW_RADIUS } from "./constants";

const PROTON_TARGET_HEIGHT = ROCKET_DRAW_RADIUS * 8.6;

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

  const modelRoot = new THREE.Group();
  rocket.add(modelRoot);

  const textureLoader = new THREE.TextureLoader();
  const protonTexture = textureLoader.load(protonTextureUrl);
  protonTexture.colorSpace = THREE.SRGBColorSpace;

  const protonMaterial = new THREE.MeshStandardMaterial({
    map: protonTexture,
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.15,
  });

  const loader = new OBJLoader();
  loader.load(
    protonModelUrl,
    (proton) => {
      proton.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) {
          return;
        }

        mesh.material = protonMaterial;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });

      modelRoot.clear();
      modelRoot.add(proton);

      const preScaleBox = new THREE.Box3().setFromObject(modelRoot);
      const preScaleSize = preScaleBox.getSize(new THREE.Vector3());
      const sourceHeight = Math.max(
        preScaleSize.y,
        preScaleSize.x,
        preScaleSize.z,
        1e-6,
      );
      const scale = PROTON_TARGET_HEIGHT / sourceHeight;
      modelRoot.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(modelRoot);
      const scaledSize = scaledBox.getSize(new THREE.Vector3());
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      modelRoot.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

      rocket.userData.focusRadius = Math.max(
        scaledSize.y * 0.45,
        scaledSize.x * 0.6,
        ROCKET_DRAW_RADIUS * 2.5,
      );
      enginePlume.position.y = -Math.max(
        ROCKET_DRAW_RADIUS * 1.1,
        scaledSize.y * 0.28,
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
