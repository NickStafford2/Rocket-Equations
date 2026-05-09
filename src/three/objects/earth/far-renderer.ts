import * as THREE from "three";
import type { EarthTextureVariants } from "./textures";
import { createEarthSurfaceMaterial } from "./materials";
import { EARTH_RENDER_RADIUS_SCENE_UNITS } from "../constants";

const EARTH_BASE_ROTATION_Y = Math.PI * 1.15;
const EARTH_NEAR_SEGMENTS = 128;
const EARTH_MID_SEGMENTS = 64;
const EARTH_FAR_SEGMENTS = 24;
const EARTH_MID_LOD_DISTANCE = 140;
const EARTH_FAR_LOD_DISTANCE = 420;

export type EarthFarRendererBundle = {
  globe: THREE.LOD;
  root: THREE.Group;
};

export function createEarthFarRenderer(
  textures: EarthTextureVariants,
): EarthFarRendererBundle {
  const root = new THREE.Group();
  root.name = "earth-far-renderer";

  const globe = new THREE.LOD();
  globe.rotation.y = EARTH_BASE_ROTATION_Y;
  globe.autoUpdate = true;
  globe.addLevel(createEarthMesh(textures.highDetail, EARTH_NEAR_SEGMENTS), 0);
  globe.addLevel(
    createEarthMesh(textures.standard, EARTH_MID_SEGMENTS),
    EARTH_MID_LOD_DISTANCE,
  );
  globe.addLevel(
    createEarthMesh(textures.standard, EARTH_FAR_SEGMENTS),
    EARTH_FAR_LOD_DISTANCE,
  );
  root.add(globe);

  return {
    globe,
    root,
  };
}

function createEarthMesh(
  textures: EarthTextureVariants["highDetail"],
  segments: number,
): THREE.Mesh {
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS,
      segments,
      segments,
    ),
    createEarthSurfaceMaterial(textures),
  );
  earthMesh.castShadow = true;
  earthMesh.receiveShadow = true;
  return earthMesh;
}
