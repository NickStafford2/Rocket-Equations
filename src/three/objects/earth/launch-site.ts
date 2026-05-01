import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import earthLaunchSiteUrl from "../../../assets/EarthLaunch/EarthLaunchSite.glb?url";
import { ROCKET_VISUAL_METERS_TO_SCENE_UNITS } from "../rocket/rocket-models";

let launchSitePromise: Promise<THREE.Group> | null = null;

export function createEarthLaunchSite(): THREE.Group {
  const root = new THREE.Group();

  void loadLaunchSiteModel()
    .then((model) => {
      root.clear();
      root.add(model);
    })
    .catch((error) => {
      console.error("Failed to load Earth launch site model.", error);
    });

  return root;
}

function loadLaunchSiteModel(): Promise<THREE.Group> {
  if (launchSitePromise) {
    return launchSitePromise.then((model) => model.clone(true));
  }

  const loader = new GLTFLoader();
  launchSitePromise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      earthLaunchSiteUrl,
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

        model.scale.setScalar(ROCKET_VISUAL_METERS_TO_SCENE_UNITS);
        model.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= bounds.min.y;

        resolve(model);
      },
      undefined,
      reject,
    );
  });

  return launchSitePromise.then((model) => model.clone(true));
}
