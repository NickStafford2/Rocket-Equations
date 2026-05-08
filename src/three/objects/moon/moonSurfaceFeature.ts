import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import moonPetaviusCraterUrl from "../../../assets/MoonSurface/moon_petavius_crater.glb?url";
import moonPetaviusCraterSmallUrl from "../../../assets/MoonSurface/moon_petavius_crater_small.glb?url";
import { MOON_RENDER_RADIUS_SCENE_UNITS } from "../constants";

const MOON_SURFACE_FEATURE_TARGET_FOOTPRINT_SCENE_UNITS =
  MOON_RENDER_RADIUS_SCENE_UNITS * 0.082;

const MOON_SURFACE_FEATURE_MID_LOD_DISTANCE =
  MOON_RENDER_RADIUS_SCENE_UNITS * 3.8;

const MOON_LANDING_SITE_ORIENTATION_OFFSET = Math.PI * 0.14;

const MOON_LANDING_SITE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x7f7b76,
  emissive: 0x000000,
  emissiveIntensity: 0.0,
  roughness: 1.0,
  metalness: 0.0,
});

let moonSurfaceFeaturePromise: Promise<THREE.LOD> | null = null;

export function loadMoonSurfaceFeatureModel(): Promise<THREE.LOD> {
  if (moonSurfaceFeaturePromise) {
    return moonSurfaceFeaturePromise.then((model) => model.clone(true));
  }

  const loader = new GLTFLoader();

  moonSurfaceFeaturePromise = Promise.all([
    loadGltfScene(loader, moonPetaviusCraterUrl),
    loadGltfScene(loader, moonPetaviusCraterSmallUrl),
  ]).then(([highDetailModel, lowDetailModel]) => {
    const lod = new THREE.LOD();
    lod.autoUpdate = true;

    lod.addLevel(prepareMoonSurfaceFeatureModel(highDetailModel), 0);

    lod.addLevel(
      prepareMoonSurfaceFeatureModel(lowDetailModel),
      MOON_SURFACE_FEATURE_MID_LOD_DISTANCE,
    );

    return lod;
  });

  return moonSurfaceFeaturePromise.then((model) => model.clone(true));
}

function loadGltfScene(loader: GLTFLoader, url: string): Promise<THREE.Group> {
  return new Promise<THREE.Group>((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

function prepareMoonSurfaceFeatureModel(source: THREE.Group): THREE.Group {
  const model = source.clone(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());

  const footprintMeters = Math.max(size.x, size.z, 1e-6);
  const scale =
    MOON_SURFACE_FEATURE_TARGET_FOOTPRINT_SCENE_UNITS / footprintMeters;

  model.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (!mesh.isMesh) {
      return;
    }

    mesh.material = MOON_LANDING_SITE_MATERIAL.clone();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  model.scale.setScalar(scale);

  model.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    -center.z * scale,
  );

  model.rotation.y = MOON_LANDING_SITE_ORIENTATION_OFFSET;

  return model;
}
