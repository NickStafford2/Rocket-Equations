import * as THREE from "three";
import { TIFFLoader } from "three/examples/jsm/loaders/TIFFLoader.js";
import earthDay8kUrl from "../../../assets/textures/earth/8k_earth_daymap.jpg";
import earthNight8kUrl from "../../../assets/textures/earth/8k_earth_nightmap.jpg";
import earthClouds8kUrl from "../../../assets/textures/earth/8k_earth_clouds.jpg";
import earthDay2kUrl from "../../../assets/textures/earth/2k_earth_daymap.jpg";
import earthNight2kUrl from "../../../assets/textures/earth/2k_earth_nightmap.jpg";
import earthClouds2kUrl from "../../../assets/textures/earth/2k_earth_clouds.jpg";

export type EarthTextureSet = {
  day: THREE.Texture;
  night: THREE.Texture;
  clouds: THREE.Texture;
  normal: THREE.Texture;
  specular: THREE.Texture;
};

export type EarthTextureVariants = {
  highDetail: EarthTextureSet;
  standard: EarthTextureSet;
};

const earthNormal8kUrl = new URL(
  "../../../assets/textures/earth/8k_earth_normal_map.tif",
  import.meta.url,
).href;
const earthSpecular8kUrl = new URL(
  "../../../assets/textures/earth/8k_earth_specular_map.tif",
  import.meta.url,
).href;
const earthNormal2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_normal_map.tif",
  import.meta.url,
).href;
const earthSpecular2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_specular_map.tif",
  import.meta.url,
).href;

export function loadEarthTextureVariants(
  textureLoader: THREE.TextureLoader,
): EarthTextureVariants {
  const tiffLoader = new TIFFLoader();

  return {
    highDetail: loadEarthTextureSet(textureLoader, tiffLoader, {
      day: earthDay8kUrl,
      night: earthNight8kUrl,
      clouds: earthClouds8kUrl,
      normal: earthNormal8kUrl,
      specular: earthSpecular8kUrl,
    }),
    standard: loadEarthTextureSet(textureLoader, tiffLoader, {
      day: earthDay2kUrl,
      night: earthNight2kUrl,
      clouds: earthClouds2kUrl,
      normal: earthNormal2kUrl,
      specular: earthSpecular2kUrl,
    }),
  };
}

function loadEarthTextureSet(
  textureLoader: THREE.TextureLoader,
  tiffLoader: TIFFLoader,
  urls: {
    day: string;
    night: string;
    clouds: string;
    normal: string;
    specular: string;
  },
): EarthTextureSet {
  return {
    day: loadColorTexture(textureLoader, urls.day),
    night: loadColorTexture(textureLoader, urls.night),
    clouds: loadColorTexture(textureLoader, urls.clouds),
    normal: loadDataTexture(tiffLoader, urls.normal),
    specular: loadDataTexture(tiffLoader, urls.specular),
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

function loadDataTexture(tiffLoader: TIFFLoader, url: string): THREE.Texture {
  const texture = tiffLoader.load(url);
  texture.colorSpace = THREE.NoColorSpace;
  texture.flipY = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
