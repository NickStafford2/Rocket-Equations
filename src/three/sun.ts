import * as THREE from "three";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";
import lensflare0Url from "../assets/textures/lensflare0.png";
import lensflare2Url from "../assets/textures/lensflare2.png";
import sunTextureUrl from "../assets/textures/sun.jpg";

export const SUN_POSITION = new THREE.Vector3(-3920, 0, -2160);
export const SUN_DRAW_RADIUS = 120;

export type ReferenceSunBundle = {
  sun: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
};

export function createReferenceSun(): ReferenceSunBundle {
  const textureLoader = new THREE.TextureLoader();

  const sun = createSunMesh(textureLoader);
  const sunLight = createSunLight();
  const lensflare = createSunLensflare(textureLoader);

  sun.add(lensflare);

  return {
    sun,
    sunLight,
  };
}

function createSunMesh(textureLoader: THREE.TextureLoader): THREE.Mesh {
  const sunTexture = textureLoader.load(sunTextureUrl);
  sunTexture.colorSpace = THREE.SRGBColorSpace;

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_DRAW_RADIUS, 48, 48),
    new THREE.MeshBasicMaterial({
      map: sunTexture,
      toneMapped: false,
      fog: false,
      color: new THREE.Color(1.32, 1.16, 0.96),
    }),
  );

  sun.userData.focusLabel = "Sun";
  sun.userData.focusRadius = SUN_DRAW_RADIUS;
  sun.position.copy(SUN_POSITION);

  return sun;
}

function createSunLight(): THREE.DirectionalLight {
  const sunLight = new THREE.DirectionalLight(0xffffff, 4.8);

  sunLight.position.copy(SUN_POSITION);
  sunLight.target.position.set(0, 0, 0);

  return sunLight;
}

function createSunLensflare(textureLoader: THREE.TextureLoader): Lensflare {
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
    new LensflareElement(
      textureFlare2,
      96,
      0.42,
      new THREE.Color(0.82, 0.84, 1),
    ),
  );
  lensflare.addElement(
    new LensflareElement(
      textureFlare2,
      52,
      0.66,
      new THREE.Color(1, 0.82, 0.58),
    ),
  );

  return lensflare;
}
