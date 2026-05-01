import * as THREE from "three";
import earthDay8kUrl from "../../../assets/textures/earth/8k_earth_daymap.jpg";
import earthNight8kUrl from "../../../assets/textures/earth/8k_earth_nightmap.jpg";
import earthDay2kUrl from "../../../assets/textures/earth/2k_earth_daymap.jpg";
import earthNight2kUrl from "../../../assets/textures/earth/2k_earth_nightmap.jpg";

export type EarthTextureSet = {
  day: THREE.Texture;
  night: THREE.Texture;
};

export type EarthTextureVariants = {
  highDetail: EarthTextureSet;
  standard: EarthTextureSet;
};

export function loadEarthTextureVariants(
  textureLoader: THREE.TextureLoader,
): EarthTextureVariants {
  return {
    highDetail: loadEarthTextureSet(textureLoader, {
      day: earthDay8kUrl,
      night: earthNight8kUrl,
    }),
    standard: loadEarthTextureSet(textureLoader, {
      day: earthDay2kUrl,
      night: earthNight2kUrl,
    }),
  };
}

function loadEarthTextureSet(
  textureLoader: THREE.TextureLoader,
  urls: {
    day: string;
    night: string;
  },
): EarthTextureSet {
  return {
    day: loadColorTexture(textureLoader, urls.day),
    night: loadColorTexture(textureLoader, urls.night),
  };
}

function loadColorTexture(
  textureLoader: THREE.TextureLoader,
  url: string,
): THREE.Texture {
  const texture = textureLoader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
