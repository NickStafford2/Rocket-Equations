import * as THREE from "three";
import { SUN_POSITION } from "../../sun";
import earthAtmosphereFragmentShader from "./shaders/earth-atmosphere.fragment.glsl?raw";
import earthCloudFragmentShader from "./shaders/earth-clouds.fragment.glsl?raw";
import earthSurfaceFragmentShader from "./shaders/earth-surface.fragment.glsl?raw";
import earthSurfaceVertexShader from "./shaders/earth-surface.vertex.glsl?raw";
import type { EarthTextureSet } from "./textures";

export function createEarthSurfaceMaterial(
  textures: EarthTextureSet,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture: { value: textures.day },
      uNightTexture: { value: textures.night },
      uSunPosition: { value: SUN_POSITION.clone() },
      uNightStrength: { value: 1.5 },
      uTerminatorSoftness: { value: 0.16 },
    },
    vertexShader: earthSurfaceVertexShader,
    fragmentShader: earthSurfaceFragmentShader,
    toneMapped: true,
  });
}

export function createEarthCloudMaterial(
  textures: EarthTextureSet,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCloudTexture: { value: textures.clouds },
      uSunPosition: { value: SUN_POSITION.clone() },
      uDayOpacity: { value: 1.0 },
      uNightOpacity: { value: 0.14 },
      uCloudBrightness: { value: 1.0 },
    },
    vertexShader: earthSurfaceVertexShader,
    fragmentShader: earthCloudFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    alphaTest: 0.0,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
}

export function createEarthAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunPosition: { value: SUN_POSITION.clone() },
      uAtmosphereColor: { value: new THREE.Color(0x4ca8ff) },
      uNightAtmosphereColor: { value: new THREE.Color(0x123d88) },
    },
    vertexShader: earthSurfaceVertexShader,
    fragmentShader: earthAtmosphereFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
