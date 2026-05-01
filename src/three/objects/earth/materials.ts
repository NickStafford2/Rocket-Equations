import * as THREE from "three";
import { SUN_POSITION } from "../../sun";
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
      uDayBrightness: { value: 1.0 },
      uNightBrightness: { value: 0.08 },
      uTwilightColor: { value: new THREE.Color(0xa9c8ff) },
      uTwilightStrength: { value: 0.06 },
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
