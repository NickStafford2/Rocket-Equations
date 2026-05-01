import * as THREE from "three";
import earth8kTextureUrl from "../../assets/textures/8k_earth.jpg";
import earthTextureUrl from "../../assets/textures/earth.jpg";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import { createBodyLabelSprite } from "./labels";
import { createSatelliteSystem } from "./satellites";

const EARTH_BASE_ROTATION_Y = Math.PI * 1.15;
const EARTH_NEAR_SEGMENTS = 128;
const EARTH_MID_SEGMENTS = 64;
const EARTH_FAR_SEGMENTS = 24;
const EARTH_MID_LOD_DISTANCE = 140;
const EARTH_FAR_LOD_DISTANCE = 420;

export function createEarthObjects(loader: THREE.TextureLoader) {
  const earth8kTexture = loader.load(earth8kTextureUrl);
  earth8kTexture.colorSpace = THREE.SRGBColorSpace;
  const earthTexture = loader.load(earthTextureUrl);
  earthTexture.colorSpace = THREE.SRGBColorSpace;

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
  earth.addLevel(createEarthMesh(earth8kTexture, EARTH_NEAR_SEGMENTS), 0);
  earth.addLevel(createEarthMesh(earthTexture, EARTH_MID_SEGMENTS), EARTH_MID_LOD_DISTANCE);
  earth.addLevel(createEarthMesh(earthTexture, EARTH_FAR_SEGMENTS), EARTH_FAR_LOD_DISTANCE);
  earthRotatingFrame.add(earth);

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
    earthLabel,
    satelliteSystem,
  };
}

function createEarthMesh(
  texture: THREE.Texture,
  segments: number,
): THREE.Mesh {
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS,
      segments,
      segments,
    ),
    new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.01,
      emissive: new THREE.Color(0, 0, 0),
    }),
  );
  earthMesh.castShadow = true;
  earthMesh.receiveShadow = true;
  return earthMesh;
}
