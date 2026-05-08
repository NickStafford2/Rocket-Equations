import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import earthLaunchSiteUrl from "../../../assets/EarthLaunch/EarthLaunchSite.glb?url";
import earthIslandUrl from "../../../assets/EarthLaunch/island.glb?url";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import {
  createLaunchCloudField,
  type LaunchCloudField,
} from "./launch-clouds";

let launchSitePromise: Promise<THREE.Group> | null = null;
let islandPromise: Promise<THREE.Group> | null = null;
const SHOW_LAUNCH_SITE_DEBUG_MARKER = false;
const LAUNCH_SITE_DEBUG_AXES_SIZE =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;
const LAUNCH_SITE_DEBUG_SPHERE_RADIUS =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.6;

export type EarthLaunchSiteBundle = {
  root: THREE.Group;
  cloudField: LaunchCloudField;
};

export function createEarthLaunchSite(): EarthLaunchSiteBundle {
  const root = new THREE.Group();
  const cloudField = createLaunchCloudField();
  root.add(cloudField.root);

  if (SHOW_LAUNCH_SITE_DEBUG_MARKER) {
    root.add(createLaunchSiteDebugMarker());
  }

  void loadLaunchSiteModel()
    .then((model) => {
      root.add(model);
    })
    .catch((error) => {
      console.error("Failed to load Earth launch site model.", error);
    });

  void loadIslandModel()
    .then((model) => {
      root.add(model);
    })
    .catch((error) => {
      console.error("Failed to load Earth island model.", error);
    });

  return {
    root,
    cloudField,
  };
}

function createLaunchSiteDebugMarker(): THREE.Group {
  const marker = new THREE.Group();

  const axesHelper = new THREE.AxesHelper(LAUNCH_SITE_DEBUG_AXES_SIZE);
  axesHelper.renderOrder = 999;
  const materials = Array.isArray(axesHelper.material)
    ? axesHelper.material
    : [axesHelper.material];
  for (const material of materials) {
    material.depthTest = false;
    material.depthWrite = false;
    material.transparent = true;
    material.opacity = 0.95;
  }
  marker.add(axesHelper);

  const originMarker = new THREE.Mesh(
    new THREE.SphereGeometry(LAUNCH_SITE_DEBUG_SPHERE_RADIUS, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.95,
    }),
  );
  originMarker.renderOrder = 1000;
  marker.add(originMarker);

  return marker;
}

function loadLaunchSiteModel(): Promise<THREE.Group> {
  if (launchSitePromise) {
    return launchSitePromise.then((model) => model.clone(true));
  }

  launchSitePromise = loadScaledSceneModel(earthLaunchSiteUrl);

  return launchSitePromise.then((model) => model.clone(true));
}

function loadIslandModel(): Promise<THREE.Group> {
  if (islandPromise) {
    return islandPromise.then((model) => model.clone(true));
  }

  islandPromise = loadScaledSceneModel(earthIslandUrl);

  return islandPromise.then((model) => model.clone(true));
}

function loadScaledSceneModel(url: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();

  return new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      url,
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

        model.scale.setScalar(ORBIT_METERS_TO_SCENE_UNITS);

        resolve(model);
      },
      undefined,
      reject,
    );
  });
}
