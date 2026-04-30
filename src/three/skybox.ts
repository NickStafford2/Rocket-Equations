import * as THREE from "three";
import starTextureUrl from "../assets/textures/8k_stars.jpg";

export function loadReferenceBackground(): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const starTexture = loader.load(starTextureUrl);
  starTexture.colorSpace = THREE.SRGBColorSpace;
  starTexture.mapping = THREE.EquirectangularReflectionMapping;
  return starTexture;
}
