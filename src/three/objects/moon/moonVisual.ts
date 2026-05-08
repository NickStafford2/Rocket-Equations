import * as THREE from "three";
import { EARTH_MOON_DISTANCE } from "../../../physics/bodies";
import moonTextureUrl from "../../../assets/Nasa Moon/moon_color.png";
import moonNormalUrl from "../../../assets/Nasa Moon/moon_normal_clean2.png";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { createBodyLabelSprite } from "../labels";
import { createMoonOrbit } from "./moonOrbit";
import { createMoonLandingSiteAnchor } from "./moonLandingSite";
import { createSatelliteSystem } from "../earth/satellites";
import {
  MOON_SATELLITE_BODY,
  MOON_SATELLITE_DEFINITIONS,
} from "../earth/satellites/catalog";

const MOON_WORLD_ORIGIN = new THREE.Vector3();

const MOON_TEXTURE_ALIGNMENT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI * 1.55,
);

export function createMoonObjects(loader: THREE.TextureLoader) {
  const moonTexture = loader.load(moonTextureUrl);
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const moonNormal = loader.load(moonNormalUrl);
  moonNormal.colorSpace = THREE.NoColorSpace;
  moonNormal.generateMipmaps = false;
  moonNormal.minFilter = THREE.LinearFilter;
  moonNormal.magFilter = THREE.LinearFilter;

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RENDER_RADIUS_SCENE_UNITS, 256, 256),
    new THREE.MeshStandardMaterial({
      color: 0xc2beb5,
      map: moonTexture,
      normalMap: moonNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 1.0,
      metalness: 0.0,
    }),
  );

  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.userData.focusLabel = "Moon";
  moon.userData.focusRadius = MOON_RENDER_RADIUS_SCENE_UNITS;
  moon.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;

  syncMoonVisual(moon, new THREE.Vector3(EARTH_MOON_DISTANCE, 0, 0));

  const { anchor: moonLandingSiteAnchor, arrow: moonLandingSiteArrow } =
    createMoonLandingSiteAnchor();

  moon.add(moonLandingSiteAnchor);

  const moonLabel = createBodyLabelSprite("Moon");
  moonLabel.position.set(0, MOON_RENDER_RADIUS_SCENE_UNITS * 3.25, 0);
  moonLabel.visible = false;
  moon.add(moonLabel);

  const { satelliteSystem: moonSatelliteSystem } = createSatelliteSystem({
    name: "moon-satellite-system",
    body: {
      ...MOON_SATELLITE_BODY,
      renderRadiusSceneUnits: MOON_RENDER_RADIUS_SCENE_UNITS,
    },
    definitions: MOON_SATELLITE_DEFINITIONS,
  });
  moon.add(moonSatelliteSystem);

  const moonOrbit = createMoonOrbit();

  return {
    moon,
    moonLabel,
    moonSatelliteSystem,
    moonLandingSiteArrow,
    moonOrbit,
  };
}

export function syncMoonVisual(
  moon: THREE.Mesh,
  moonPositionMeters: THREE.Vector3,
) {
  moon.position
    .copy(moonPositionMeters)
    .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);

  moon.lookAt(MOON_WORLD_ORIGIN);
  moon.quaternion.multiply(MOON_TEXTURE_ALIGNMENT);
}
