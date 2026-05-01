import * as THREE from "three";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import {
  createEarthAtmosphereMaterial,
  createEarthCloudMaterial,
  createEarthSurfaceMaterial,
} from "./earth/materials";
import { loadEarthTextureVariants } from "./earth/textures";
import { createBodyLabelSprite } from "./labels";
import { createSatelliteSystem } from "./satellites";

const EARTH_BASE_ROTATION_Y = Math.PI * 1.15;
const EARTH_NEAR_SEGMENTS = 128;
const EARTH_MID_SEGMENTS = 64;
const EARTH_FAR_SEGMENTS = 24;
const EARTH_MID_LOD_DISTANCE = 140;
const EARTH_FAR_LOD_DISTANCE = 420;
const EARTH_CLOUD_SHELL_SCALE = 1.02;
const EARTH_CLOUD_SEGMENTS = 96;
const EARTH_ATMOSPHERE_SHELL_SCALE = 1.055;
const EARTH_ATMOSPHERE_SEGMENTS = 96;

export function createEarthObjects(loader: THREE.TextureLoader) {
  const textures = loadEarthTextureVariants(loader);

  const earthGroup = new THREE.Group();
  earthGroup.userData.focusLabel = "Earth";
  earthGroup.userData.focusRadius = EARTH_RENDER_RADIUS_SCENE_UNITS;
  earthGroup.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;
  const earthRotatingFrame = new THREE.Group();
  earthGroup.add(earthRotatingFrame);

  const earth = new THREE.LOD();
  earth.rotation.y = EARTH_BASE_ROTATION_Y;
  earth.autoUpdate = true;
  earth.addLevel(
    createEarthMesh(textures.highDetail, EARTH_NEAR_SEGMENTS),
    0,
  );
  earth.addLevel(
    createEarthMesh(textures.standard, EARTH_MID_SEGMENTS),
    EARTH_MID_LOD_DISTANCE,
  );
  earth.addLevel(
    createEarthMesh(textures.standard, EARTH_FAR_SEGMENTS),
    EARTH_FAR_LOD_DISTANCE,
  );
  earthRotatingFrame.add(earth);

  const earthCloudsFrame = new THREE.Group();
  earthCloudsFrame.add(createEarthCloudMesh(textures.highDetail));
  earthRotatingFrame.add(earthCloudsFrame);

  const earthAtmosphere = createEarthAtmosphereMesh();
  earthRotatingFrame.add(earthAtmosphere);

  const earthLabel = createBodyLabelSprite("Earth");
  earthLabel.position.set(0, EARTH_RENDER_RADIUS_SCENE_UNITS * 2.35, 0);
  earthLabel.visible = false;
  earthGroup.add(earthLabel);

  const { satelliteSystem } = createSatelliteSystem();
  earthGroup.add(satelliteSystem);

  return {
    earthGroup,
    earthRotatingFrame,
    earth,
    earthCloudsFrame,
    earthAtmosphere,
    earthLabel,
    satelliteSystem,
  };
}

function createEarthMesh(
  textures: Parameters<typeof createEarthSurfaceMaterial>[0],
  segments: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(
    EARTH_RENDER_RADIUS_SCENE_UNITS,
    segments,
    segments,
  );
  const earthMesh = new THREE.Mesh(
    geometry,
    createEarthSurfaceMaterial(textures),
  );
  earthMesh.castShadow = true;
  earthMesh.receiveShadow = true;
  return earthMesh;
}

function createEarthCloudMesh(
  textures: Parameters<typeof createEarthCloudMaterial>[0],
): THREE.Mesh {
  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS * EARTH_CLOUD_SHELL_SCALE,
      EARTH_CLOUD_SEGMENTS,
      EARTH_CLOUD_SEGMENTS,
    ),
    createEarthCloudMaterial(textures),
  );
  cloudMesh.renderOrder = 1;
  return cloudMesh;
}

function createEarthAtmosphereMesh(): THREE.Mesh {
  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS * EARTH_ATMOSPHERE_SHELL_SCALE,
      EARTH_ATMOSPHERE_SEGMENTS,
      EARTH_ATMOSPHERE_SEGMENTS,
    ),
    createEarthAtmosphereMaterial(),
  );
  atmosphereMesh.renderOrder = 2;
  return atmosphereMesh;
}
