import * as THREE from "three";
import earthTextureUrl from "../../assets/textures/earth.jpg";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import { createBodyLabelSprite } from "./labels";
import { createSatelliteSystem } from "./satellites";

export function createEarthObjects(loader: THREE.TextureLoader) {
  const earthTexture = loader.load(earthTextureUrl);
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earthGroup = new THREE.Group();
  earthGroup.userData.focusLabel = "Earth";
  earthGroup.userData.focusRadius = EARTH_RENDER_RADIUS_SCENE_UNITS;
  earthGroup.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;
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

  return {
    earthGroup,
    earthRotatingFrame,
    earth,
    earthLabel,
    satelliteSystem,
  };
}
