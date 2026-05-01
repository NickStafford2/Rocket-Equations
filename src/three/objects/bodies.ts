import * as THREE from "three";
import { EARTH_MOON_DISTANCE } from "../../physics/bodies";
import earthTextureUrl from "../../assets/textures/earth.jpg";
import moonTextureUrl from "../../assets/Nasa Moon/moon_color.png";
import moonNormalUrl from "../../assets/Nasa Moon/moon_normal_clean2.png";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import { createBodyLabelSprite } from "./labels";
import { createSatelliteSystem } from "./satellites";

const MOON_WORLD_ORIGIN = new THREE.Vector3();
const MOON_TEXTURE_ALIGNMENT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI * 1.35,
);

export function createBodyObjects(loader: THREE.TextureLoader) {
  const earthTexture = loader.load(earthTextureUrl);
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  const moonTexture = loader.load(moonTextureUrl);
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const earthGroup = new THREE.Group();
  earthGroup.userData.focusLabel = "Earth";
  earthGroup.userData.focusRadius = EARTH_RENDER_RADIUS_SCENE_UNITS;
  const earthRotatingFrame = new THREE.Group();
  earthGroup.add(earthRotatingFrame);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RENDER_RADIUS_SCENE_UNITS, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.01,
      emissive: new THREE.Color(0, 0, 0),
    }),
  );
  earth.castShadow = true;
  earth.receiveShadow = true;
  earth.rotation.y = Math.PI * 1.15;
  earthRotatingFrame.add(earth);

  const earthLabel = createBodyLabelSprite("Earth");
  earthLabel.position.set(0, EARTH_RENDER_RADIUS_SCENE_UNITS * 2.35, 0);
  earthLabel.visible = false;
  earthGroup.add(earthLabel);

  const { satelliteSystem } = createSatelliteSystem();
  earthGroup.add(satelliteSystem);

  const moonNormal = loader.load(moonNormalUrl);
  moonNormal.colorSpace = THREE.NoColorSpace;
  moonNormal.generateMipmaps = false;
  moonNormal.minFilter = THREE.LinearFilter;
  moonNormal.magFilter = THREE.LinearFilter;

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RENDER_RADIUS_SCENE_UNITS, 256, 256),
    new THREE.MeshStandardMaterial({
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
  syncMoonVisual(moon, new THREE.Vector3(EARTH_MOON_DISTANCE, 0, 0));

  const moonLabel = createBodyLabelSprite("Moon");
  moonLabel.position.set(0, MOON_RENDER_RADIUS_SCENE_UNITS * 3.25, 0);
  moonLabel.visible = false;
  moon.add(moonLabel);

  const moonOrbitPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 512; i += 1) {
    const theta = (i / 512) * Math.PI * 2;
    moonOrbitPoints.push(
      new THREE.Vector3(
        EARTH_MOON_DISTANCE * Math.cos(theta) * ORBIT_METERS_TO_SCENE_UNITS,
        0,
        EARTH_MOON_DISTANCE * Math.sin(theta) * ORBIT_METERS_TO_SCENE_UNITS,
      ),
    );
  }

  const moonOrbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b5f82,
      transparent: true,
      opacity: 0.7,
    }),
  );

  return {
    earthGroup,
    earthRotatingFrame,
    earth,
    earthLabel,
    satelliteSystem,
    moon,
    moonLabel,
    moonOrbit,
  };
}

export function syncMoonVisual(
  moon: THREE.Mesh,
  moonPositionMeters: THREE.Vector3,
) {
  moon.position.copy(moonPositionMeters).multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  moon.lookAt(MOON_WORLD_ORIGIN);
  moon.quaternion.multiply(MOON_TEXTURE_ALIGNMENT);
}
