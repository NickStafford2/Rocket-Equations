import * as THREE from "three";
import { EARTH_MOON_DISTANCE } from "../../physics/bodies";
import earthTextureUrl from "../../assets/textures/earth.jpg";
import moonTextureUrl from "../../assets/Nasa Moon/moon_color.png";
import moonNormalUrl from "../../assets/Nasa Moon/moon_normal_clean2.png";
import {
  DISTANCE_SCALE,
  EARTH_DRAW_RADIUS,
  MOON_DRAW_RADIUS,
} from "./constants";
import { createBodyLabelSprite } from "./labels";

export function createBodyObjects(loader: THREE.TextureLoader) {
  const earthTexture = loader.load(earthTextureUrl);
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  const moonTexture = loader.load(moonTextureUrl);
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const earthGroup = new THREE.Group();
  earthGroup.userData.focusLabel = "Earth";
  earthGroup.userData.focusRadius = EARTH_DRAW_RADIUS;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_DRAW_RADIUS, 64, 64),
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
  earthGroup.add(earth);

  const earthLabel = createBodyLabelSprite("Earth");
  earthLabel.position.set(0, EARTH_DRAW_RADIUS * 2.35, 0);
  earthLabel.visible = false;
  earthGroup.add(earthLabel);

  const moonNormal = loader.load(moonNormalUrl);
  moonNormal.colorSpace = THREE.NoColorSpace;
  moonNormal.generateMipmaps = false;
  moonNormal.minFilter = THREE.LinearFilter;
  moonNormal.magFilter = THREE.LinearFilter;

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_DRAW_RADIUS, 256, 256),
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
  moon.rotation.y = Math.PI * 0.35;
  moon.userData.focusLabel = "Moon";
  moon.userData.focusRadius = MOON_DRAW_RADIUS;

  const moonLabel = createBodyLabelSprite("Moon");
  moonLabel.position.set(0, MOON_DRAW_RADIUS * 3.25, 0);
  moonLabel.visible = false;
  moon.add(moonLabel);

  const moonOrbitPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 512; i += 1) {
    const theta = (i / 512) * Math.PI * 2;
    moonOrbitPoints.push(
      new THREE.Vector3(
        EARTH_MOON_DISTANCE * Math.cos(theta) * DISTANCE_SCALE,
        0,
        EARTH_MOON_DISTANCE * Math.sin(theta) * DISTANCE_SCALE,
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
    earth,
    earthLabel,
    moon,
    moonLabel,
    moonOrbit,
  };
}
