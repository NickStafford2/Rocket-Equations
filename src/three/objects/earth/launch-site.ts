import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import earthLaunchSiteUrl from "../../../assets/EarthLaunch/EarthLaunchSite.glb?url";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";
import {
  createLaunchCloudField,
  type LaunchCloudField,
} from "./launch-clouds";
import { ROCKET_VISUAL_METERS_TO_SCENE_UNITS } from "../rocket/rocket-models";

let launchSitePromise: Promise<THREE.Group> | null = null;
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

        resolve(model);
      },
      undefined,
      reject,
    );
  });

  return launchSitePromise.then((model) => model.clone(true));
}
