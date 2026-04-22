import * as THREE from "three";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";
import sunTextureUrl from "../assets/textures/sun.jpg";
import lensflare0Url from "../assets/textures/lensflare0.png";
import lensflare2Url from "../assets/textures/lensflare2.png";

export const SUN_POSITION = new THREE.Vector3(-980, 320, -540);
export const SUN_DRAW_RADIUS = 42;

export type ReferenceSunBundle = {
  sun: THREE.Mesh;
  sunLight: THREE.PointLight;
  fillLight: THREE.PointLight;
};

export function createReferenceSun(): ReferenceSunBundle {
  const textureLoader = new THREE.TextureLoader();

  const sunTexture = textureLoader.load(sunTextureUrl);
  sunTexture.colorSpace = THREE.SRGBColorSpace;

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_DRAW_RADIUS, 48, 48),
    new THREE.MeshBasicMaterial({
      map: sunTexture,
      toneMapped: false,
      fog: false,
      color: new THREE.Color(1.18, 1.08, 0.92),
    }),
  );
  sun.userData.focusLabel = "Sun";
  sun.userData.focusRadius = SUN_DRAW_RADIUS;
  sun.position.copy(SUN_POSITION);

  const sunLight = new THREE.PointLight(
    new THREE.Color(1.0, 1.0, 1.0),
    10.0,
    0,
    0.5,
  );
  sunLight.position.copy(SUN_POSITION);

  const fillLight = new THREE.PointLight(
    new THREE.Color(0.2, 0.4, 1.0),
    2.0,
    420,
    1,
  );
  fillLight.position.set(260, 140, -220);

  const lensflare = new Lensflare();
  const textureFlare0 = textureLoader.load(lensflare0Url);
  const textureFlare2 = textureLoader.load(lensflare2Url);
  lensflare.addElement(
    new LensflareElement(textureFlare0, 700, 0, new THREE.Color(1, 0.92, 0.82)),
  );
  lensflare.addElement(
    new LensflareElement(textureFlare2, 180, 0.2, new THREE.Color(1, 1, 0.65)),
  );
  lensflare.addElement(
    new LensflareElement(textureFlare2, 96, 0.42, new THREE.Color(0.82, 0.84, 1)),
  );
  lensflare.addElement(
    new LensflareElement(textureFlare2, 52, 0.66, new THREE.Color(1, 0.82, 0.58)),
  );
  sun.add(lensflare);

  return {
    sun,
    sunLight,
    fillLight,
  };
}
