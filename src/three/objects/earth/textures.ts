import * as THREE from "three";
import earthClouds8kUrl from "../../../assets/textures/earth/8k_earth_clouds.jpg";
import earthDay8kUrl from "../../../assets/textures/earth/8k_earth_daymap.jpg";
import earthNight8kUrl from "../../../assets/textures/earth/8k_earth_nightmap.jpg";
import earthClouds2kUrl from "../../../assets/textures/earth/2k_earth_clouds.jpg";
import earthDay2kUrl from "../../../assets/textures/earth/2k_earth_daymap.jpg";
import earthNight2kUrl from "../../../assets/textures/earth/2k_earth_nightmap.jpg";

export type EarthTextureSet = {
  clouds: THREE.Texture;
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
      clouds: earthClouds8kUrl,
      day: earthDay8kUrl,
      night: earthNight8kUrl,
    }),
    standard: loadEarthTextureSet(textureLoader, {
      clouds: earthClouds2kUrl,
      day: earthDay2kUrl,
      night: earthNight2kUrl,
    }),
  };
}

function loadEarthTextureSet(
  textureLoader: THREE.TextureLoader,
  urls: {
    clouds: string;
    day: string;
    night: string;
  },
): EarthTextureSet {
  return {
    clouds: loadMaskTexture(textureLoader, urls.clouds),
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

function loadMaskTexture(
  textureLoader: THREE.TextureLoader,
  url: string,
): THREE.Texture {
  const texture = textureLoader.load(url);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}
